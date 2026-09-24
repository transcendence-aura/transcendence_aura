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
import { TokenService } from '../src/modules/auth/token.service';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// PrismaService reads POSTGRES_URL directly; from the host the compose hostname does not resolve.
if (process.env.E2E_POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.E2E_POSTGRES_URL;
}

// Vault is only contacted lazily (TOTP), so placeholders are enough to boot the module graph.
function stubVaultEnvironment(): void {
  const secretIdFile = path.join(mkdtempSync(path.join(tmpdir(), 'vault-')), 'secret-id');
  writeFileSync(secretIdFile, 'e2e-placeholder');
  process.env.VAULT_ADDR ??= 'http://127.0.0.1:8200';
  process.env.VAULT_ROLE_ID ??= 'e2e-placeholder';
  process.env.VAULT_SECRET_ID_FILE ??= secretIdFile;
  process.env.VAULT_SECRET_PATH ??= 'aura-backend/development';
}

const RUN = `e2e-profiledir-${Date.now()}`;

const DIRECTORY_QUERY = `
  query ($input: ProfileDirectoryInput) {
    profileDirectory(input: $input) {
      items { id name handle }
      total
      hasNextPage
    }
  }
`;

// Regression coverage for a bug found in review: `profileDirectory`'s resolver argument was
// typed `input: ProfileDirectoryInput | undefined` instead of `input?: ProfileDirectoryInput`.
// TypeScript only reflects the real class in design:paramtypes for the `?` form - a `| undefined`
// union reflects as `Object`, which is exactly the metatype Nest's global ValidationPipe treats
// as "nothing to validate" and skips entirely. The result: page/limit/search went straight to
// Prisma unchecked, and an out-of-range page crashed with a raw Prisma stack trace (including the
// server's internal file path) leaking to an unauthenticated caller. A unit test instantiating
// the resolver directly can't catch this class of bug - it bypasses Nest's pipe pipeline - so
// this needs a real e2e request through the actual GraphQL endpoint.
describe('GraphQL profileDirectory input validation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  const query = (variables?: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ query: DIRECTORY_QUERY, variables });

  beforeAll(async () => {
    stubVaultEnvironment();
    const secrets: RequiredSecrets = {
      POSTGRES_URL: process.env.POSTGRES_URL!,
      JWT_ACCESS_SECRET: 'profile-directory-e2e-secret',
      JWT_REFRESH_SECRET: 'profile-directory-e2e-secret',
      REDIS_URL: 'profile-directory-e2e',
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

    const viewer = await prisma.user.create({
      data: {
        name: `${RUN} User`,
        email: `${RUN}@example.com`,
        handle: `u${Date.now().toString(36)}`.slice(0, 30),
        passwordHash: `hash-${RUN}`,
      },
    });

    accessToken = await moduleRef.get(TokenService).issueAccessToken(viewer.id, []);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email: { startsWith: RUN } } });
    }
    await app?.close();
  });

  it('serves a valid request normally', async () => {
    const res = await query({ input: { page: 1, limit: 20 } }).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.profileDirectory.total).toBeGreaterThan(0);
  });

  it('rejects a request without a valid access token', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: DIRECTORY_QUERY, variables: { input: { page: 1, limit: 5 } } })
      .expect(200);

    expect(res.body.data).toBeNull();
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('rejects page: 0 as a clean validation error, never an internal crash', async () => {
    const res = await query({ input: { page: 0, limit: 20 } }).expect(200);

    expect(res.body.data).toBeNull();
    expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');

    // The point of the bug: none of this ever reaches the client.
    const message = JSON.stringify(res.body.errors);
    expect(message).not.toContain('/app/dist');
    expect(message).not.toContain('AssertionError');
    expect(message).not.toContain('prisma.user.findMany');
  });

  it('rejects a negative limit instead of silently accepting it', async () => {
    const res = await query({ input: { page: 1, limit: -5 } }).expect(200);

    expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');
  });

  it('rejects a limit above the 100 cap instead of silently accepting it', async () => {
    const res = await query({ input: { page: 1, limit: 500 } }).expect(200);

    expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');
  });

  it('rejects a search term longer than 100 characters', async () => {
    const res = await query({ input: { page: 1, limit: 20, search: 'a'.repeat(150) } }).expect(200);

    expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');
  });
});
