import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import cookieParser from 'cookie-parser';
import { RequiredSecrets } from '../src/config/required-secrets';
import { ValidationPipe } from '@nestjs/common';
import { REFRESH_COOKIE_NAME } from '../src/modules/auth/refresh/refresh-token.constants';
import { hashRefreshToken } from '../src/modules/auth/refresh/refresh-token.utils';

import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

describe('Refresh token flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  //Test Refresh user
  const testEmail = 'test-refresh@example.com';

  const testPassword = 'TestRefresh123!';

  let testUserId: string;
  const testSecrets: RequiredSecrets = {
    POSTGRES_URL: process.env.POSTGRES_URL!,
    JWT_ACCESS_SECRET: 'this-is-just-a-refresh-test-secret',
    JWT_REFRESH_SECRET: 'this-is-just-a-refresh-test-secret',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(testSecrets)],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.use(cookieParser());

    await app.init();

    prisma = moduleRef.get(PrismaService);

    const testUser = await prisma.user.findUnique({
      where: {
        email: testEmail,
      },
      select: {
        id: true,
      },
    });

    if (!testUser) {
      throw new Error(
        `Test user ${testEmail} does not exist. ` + 'Please create it before running this suite.',
      );
    }

    testUserId = testUser.id;
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({
      where: {
        userId: testUserId,
      },
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.refreshToken.deleteMany({
        where: {
          userId: testUserId,
        },
      });
    }

    await app.close();
  });

  function getRefreshCookie(response: request.Response): string {
    const setCookie = response.headers['set-cookie'];

    if (!Array.isArray(setCookie)) {
      throw new Error('Response did not contain Set-Cookie.');
    }

    const refreshCookie = setCookie.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE_NAME}=`));

    if (!refreshCookie) {
      throw new Error('Refresh cookie was not set.');
    }

    return refreshCookie;
  }

  function getRawRefreshToken(cookie: string): string {
    const cookieValue = cookie.split(';')[0];

    return cookieValue.substring(`${REFRESH_COOKIE_NAME}=`.length);
  }

  it('stores the refresh token in a secure cookie and its SHA-256 hash', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    expect(response.body).not.toHaveProperty('refreshToken');
    expect(response.body).not.toHaveProperty('refreshExpiresInMs');

    const cookie = getRefreshCookie(response);
    const rawRefreshToken = getRawRefreshToken(cookie);

    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/');

    expect(cookie).not.toContain('Domain=');

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken(rawRefreshToken),
      },
    });

    expect(storedToken).not.toBeNull();
    expect(storedToken?.userId).toBe(testUserId);

    expect(storedToken?.tokenHash).not.toBe(rawRefreshToken);

    expect(storedToken?.tokenHash).toBe(hashRefreshToken(rawRefreshToken));

    expect(storedToken?.isRevoked).toBe(false);
  });

  it('rotates the token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const r1Cookie = getRefreshCookie(loginResponse);
    const r1 = getRawRefreshToken(r1Cookie);
    const r1Hash = hashRefreshToken(r1);

    const originalRecord = await prisma.refreshToken.findUniqueOrThrow({
      where: {
        tokenHash: r1Hash,
      },
    });

    expect(originalRecord.userId).toBe(testUserId);
    expect(originalRecord.isRevoked).toBe(false);

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=${r1}`)
      .expect(200);

    expect(refreshResponse.body).toHaveProperty('accessToken');

    expect(refreshResponse.body).not.toHaveProperty('refreshToken');

    const r2Cookie = getRefreshCookie(refreshResponse);
    const r2 = getRawRefreshToken(r2Cookie);

    expect(r2).not.toBe(r1);

    const oldRecord = await prisma.refreshToken.findUniqueOrThrow({
      where: {
        tokenHash: r1Hash,
      },
    });

    expect(oldRecord.userId).toBe(testUserId);
    expect(oldRecord.isRevoked).toBe(true);
    expect(oldRecord.revocationReason).toBe('ROTATED');
    expect(oldRecord.revokedAt).not.toBeNull();

    const newRecord = await prisma.refreshToken.findUniqueOrThrow({
      where: {
        tokenHash: hashRefreshToken(r2),
      },
    });

    expect(newRecord.userId).toBe(testUserId);
    expect(newRecord.isRevoked).toBe(false);

    expect(newRecord.familyId).toBe(originalRecord.familyId);
  });

  it('returns 401 and revokes the session family when an old refresh token is reused', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const r1 = getRawRefreshToken(getRefreshCookie(loginResponse));

    const firstRefreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=${r1}`)
      .expect(200);

    const r2 = getRawRefreshToken(getRefreshCookie(firstRefreshResponse));

    const r2BeforeReuse = await prisma.refreshToken.findUniqueOrThrow({
      where: {
        tokenHash: hashRefreshToken(r2),
      },
    });

    expect(r2BeforeReuse.userId).toBe(testUserId);
    expect(r2BeforeReuse.isRevoked).toBe(false);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=${r1}`)
      .expect(401);

    const r2AfterReuse = await prisma.refreshToken.findUniqueOrThrow({
      where: {
        tokenHash: hashRefreshToken(r2),
      },
    });

    expect(r2AfterReuse.userId).toBe(testUserId);
    expect(r2AfterReuse.isRevoked).toBe(true);
    expect(r2AfterReuse.revocationReason).toBe('REUSE_DETECTED');

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=${r2}`)
      .expect(401);
  });
});
