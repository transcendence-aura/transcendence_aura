import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'node:path';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { RequiredSecrets } from '../src/config/required-secrets';
import { ACCESS_COOKIE_NAME } from '../src/modules/auth/auth.constants';
import { REFRESH_COOKIE_NAME } from '../src/modules/auth/refresh/refresh-token.constants';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

describe('Access token transport', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testEmail = 'test-refresh@example.com';
  const testPassword = 'TestRefresh123!';

  let testUserId: string;

  const testSecrets: RequiredSecrets = {
    POSTGRES_URL: process.env.POSTGRES_URL!,
    JWT_ACCESS_SECRET: 'this-is-just-a-refresh-test-secret',
    JWT_REFRESH_SECRET: 'this-is-just-a-refresh-test-secret',
    REDIS_URL: 'access-token-transport-test',
    OAUTH_CLIENT_ID: 'local-refresh-test-id',
    OAUTH_CLIENT_SECRET: 'local-refresh-test-secret',
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

  function getCookie(response: request.Response, cookieName: string): string {
    const setCookie = response.headers['set-cookie'];

    if (!Array.isArray(setCookie)) {
      throw new Error('Response did not contain Set-Cookie.');
    }

    const cookie = setCookie.find((value) => value.startsWith(`${cookieName}=`));

    if (!cookie) {
      throw new Error(`${cookieName} cookie was not set.`);
    }

    return cookie;
  }

  function getRawCookieValue(cookie: string, cookieName: string): string {
    const cookieValue = cookie.split(';')[0];

    return cookieValue.substring(`${cookieName}=`.length);
  }

  function expectSecureHostCookie(cookie: string): void {
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/');
    expect(cookie).not.toContain('Domain=');
  }

  it('sets the access token in a secure httpOnly cookie on login', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    expect(response.body.requiresMfa).toBe(false);

    expect(response.body).toHaveProperty('accessToken');

    expect(typeof response.body.accessToken).toBe('string');

    expect(response.body.accessToken.length).toBeGreaterThan(0);

    const accessCookie = getCookie(response, ACCESS_COOKIE_NAME);

    expectSecureHostCookie(accessCookie);
  });

  it('returns the same access token for CSR that it stores in the SSR cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const accessCookie = getCookie(response, ACCESS_COOKIE_NAME);

    const cookieAccessToken = getRawCookieValue(accessCookie, ACCESS_COOKIE_NAME);

    expect(cookieAccessToken).toBe(response.body.accessToken);
  });

  it('does not expose the refresh token in the login response body', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    expect(response.body).not.toHaveProperty('refreshToken');

    expect(response.body).not.toHaveProperty('refreshExpiresInMs');

    const refreshCookie = getCookie(response, REFRESH_COOKIE_NAME);

    expectSecureHostCookie(refreshCookie);
  });

  it('sets a new access token cookie when the access token is refreshed', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const initialAccessToken = loginResponse.body.accessToken as string;

    const refreshCookie = getCookie(loginResponse, REFRESH_COOKIE_NAME);

    const rawRefreshToken = getRawCookieValue(refreshCookie, REFRESH_COOKIE_NAME);

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=${rawRefreshToken}`)
      .expect(200);

    expect(refreshResponse.body).toHaveProperty('accessToken');

    expect(typeof refreshResponse.body.accessToken).toBe('string');

    const refreshedAccessCookie = getCookie(refreshResponse, ACCESS_COOKIE_NAME);

    expectSecureHostCookie(refreshedAccessCookie);

    const cookieAccessToken = getRawCookieValue(refreshedAccessCookie, ACCESS_COOKIE_NAME);

    expect(cookieAccessToken).toBe(refreshResponse.body.accessToken);

    expect(refreshResponse.body.accessToken).not.toBe(initialAccessToken);
  });

  it('rotates the refresh cookie while refreshing the access token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const firstRefreshCookie = getCookie(loginResponse, REFRESH_COOKIE_NAME);

    const firstRefreshToken = getRawCookieValue(firstRefreshCookie, REFRESH_COOKIE_NAME);

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=${firstRefreshToken}`)
      .expect(200);

    const secondRefreshCookie = getCookie(refreshResponse, REFRESH_COOKIE_NAME);

    expectSecureHostCookie(secondRefreshCookie);

    const secondRefreshToken = getRawCookieValue(secondRefreshCookie, REFRESH_COOKIE_NAME);

    expect(secondRefreshToken).not.toBe(firstRefreshToken);
  });

  it('returns 401 when the refresh cookie is missing', async () => {
    await request(app.getHttpServer()).post('/auth/refresh').expect(401);
  });

  it('clears the access and refresh cookies when refresh fails', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=invalid-refresh-token`)
      .expect(401);

    const setCookie = response.headers['set-cookie'];

    expect(Array.isArray(setCookie)).toBe(true);

    if (!Array.isArray(setCookie)) {
      throw new Error('Response did not contain Set-Cookie.');
    }

    const accessCookie = setCookie.find((cookie) => cookie.startsWith(`${ACCESS_COOKIE_NAME}=`));

    const refreshCookie = setCookie.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE_NAME}=`));

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();

    expect(accessCookie?.includes('Expires=') || accessCookie?.includes('Max-Age=0')).toBe(true);

    expect(refreshCookie?.includes('Expires=') || refreshCookie?.includes('Max-Age=0')).toBe(true);
  });
});
