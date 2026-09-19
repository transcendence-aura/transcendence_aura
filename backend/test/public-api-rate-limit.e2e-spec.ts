import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import dotenv from 'dotenv';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { RequiredSecrets } from '../src/config/required-secrets';
import { API_RATE_LIMIT } from '../src/api/api-rate-limit';
import { generateApiKey, hashApiKey } from '../src/modules/api-keys/api-key.utils';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (process.env.E2E_POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.E2E_POSTGRES_URL;
}

function stubVaultEnvironment(): void {
  const secretIdFile = path.join(mkdtempSync(path.join(tmpdir(), 'vault-')), 'secret-id');
  writeFileSync(secretIdFile, 'e2e-placeholder');
  process.env.VAULT_ADDR ??= 'http://127.0.0.1:8200';
  process.env.VAULT_ROLE_ID ??= 'e2e-placeholder';
  process.env.VAULT_SECRET_ID_FILE ??= secretIdFile;
  process.env.VAULT_SECRET_PATH ??= 'aura-backend/development';
}

const RUN = `e2e-ratelimit-${Date.now()}`;
const OWNER_EMAIL_DOMAIN = '@ratelimit-owner.example.com';

describe('Public API rate limiting (AUR-154 acceptance criteria)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const keyA = generateApiKey();
  const keyB = generateApiKey();

  const get = (url: string, key: string) =>
    request(app.getHttpServer()).get(url).set('x-api-key', key);

  const graphql = () =>
    request(app.getHttpServer()).post('/graphql').send({ query: '{ __typename }' });

  beforeAll(async () => {
    stubVaultEnvironment();
    const secrets: RequiredSecrets = {
      POSTGRES_URL: process.env.POSTGRES_URL!,
      JWT_ACCESS_SECRET: 'rate-limit-e2e-secret',
      JWT_REFRESH_SECRET: 'rate-limit-e2e-secret',
      REDIS_URL: 'rate-limit-e2e',
      OAUTH_CLIENT_ID: 'rate-limit-e2e-id',
      OAUTH_CLIENT_SECRET: 'rate-limit-e2e-secret',
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(secrets)],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = moduleRef.get(PrismaService);

    const createKey = async (suffix: string, key: string) => {
      const owner = await prisma.user.create({
        data: {
          name: `Rate Limit Owner ${RUN} ${suffix}`,
          email: `${RUN}-${suffix}${OWNER_EMAIL_DOMAIN}`,
          handle: `r${suffix}${Date.now().toString(36)}`.slice(0, 30),
          passwordHash: `hash-${RUN}`,
        },
      });
      await prisma.apiKey.create({
        data: { name: `${RUN}-${suffix}`, keyHash: hashApiKey(key), ownerId: owner.id },
      });
    };
    await createKey('a', keyA);
    await createKey('b', keyB);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.apiKey.deleteMany({ where: { name: { startsWith: 'e2e-ratelimit-' } } });
      await prisma.user.deleteMany({ where: { email: { endsWith: OWNER_EMAIL_DOMAIN } } });
    }
    await app?.close();
  });

  it('limits /v1 per API key, shared across endpoints, and leaves GraphQL unlimited', async () => {
    const first = await get('/v1/status', keyA).expect(200);
    expect(first.headers['x-ratelimit-limit']).toBe(String(API_RATE_LIMIT.limit));
    expect(first.headers['x-ratelimit-remaining']).toBe(String(API_RATE_LIMIT.limit - 1));

    for (let i = 1; i < API_RATE_LIMIT.limit; i++) {
      await get(i % 2 ? '/v1/categories' : '/v1/status', keyA).expect(200);
    }

    const limited = await get('/v1/products', keyA).expect(429);
    expect(limited.body).toEqual({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests.' },
    });
    const retryAfter = Number(limited.headers['retry-after']);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(API_RATE_LIMIT.ttlMs / 1000);

    await get('/v1/status', keyB).expect(200);

    for (let i = 0; i < API_RATE_LIMIT.limit + 1; i++) {
      await graphql().expect(200);
    }
  });
});
