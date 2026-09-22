import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import dotenv from 'dotenv';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Prisma } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { RequiredSecrets } from '../src/config/required-secrets';
import { generateApiKey, hashApiKey } from '../src/modules/api-keys/api-key.utils';

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

const RUN = `e2e-pubapi-${Date.now()}`;
const OWNER_EMAIL_DOMAIN = '@owner-private.example.com';
const OWNER_EMAIL = `${RUN}${OWNER_EMAIL_DOMAIN}`;
const OWNER_HANDLE = `o${Date.now().toString(36)}`.slice(0, 30);
const OWNER_NAME = `Private Owner ${RUN}`;
const OWNER_PASSWORD_HASH = `hash-${RUN}`;

const FORBIDDEN_KEYS = [
  'email',
  'passwordHash',
  'handle',
  'ownerId',
  'keyHash',
  'apiKey',
  'isActive',
  'createdAt',
  'updatedAt',
  'popularityScore',
  'collectionId',
  'categoryId',
  'productId',
  'deletedAt',
];

const placeholderImage = {
  id: 'placeholder',
  url: expect.any(String),
  altText: expect.any(String),
  position: 0,
  isPrimary: true,
};

const UNAUTHORIZED_BODY = {
  success: false,
  error: { code: 'UNAUTHORIZED', message: 'A valid API key is required.' },
};

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((v) => collectKeys(v, keys));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      keys.add(k);
      collectKeys(v, keys);
    }
  }
  return keys;
}

describe('Public API /v1 (AUR-153 acceptance criteria)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const validKey = generateApiKey();
  const revokedKey = generateApiKey();
  const expiredKey = generateApiKey();
  let ownerId: string;

  const slugs = {
    collection: `${RUN}-col`,
    inactiveCollection: `${RUN}-col-off`,
    category: `${RUN}-cat`,
    inactiveCategory: `${RUN}-cat-off`,
    family: `${RUN}-fam`,
    inactiveFamily: `${RUN}-fam-off`,
    product: `${RUN}-prod`,
    product2: `${RUN}-prod2`,
    inactiveProduct: `${RUN}-prod-off`,
  };

  const get = (url: string, key: string | null = validKey) => {
    const req = request(app.getHttpServer()).get(url);
    return key ? req.set('x-api-key', key) : req;
  };

  beforeAll(async () => {
    stubVaultEnvironment();
    const secrets: RequiredSecrets = {
      POSTGRES_URL: process.env.POSTGRES_URL!,
      JWT_ACCESS_SECRET: 'public-api-e2e-secret',
      JWT_REFRESH_SECRET: 'public-api-e2e-secret',
      REDIS_URL: 'public-api-e2e',
      OAUTH_CLIENT_ID: 'public-api-e2e-id',
      OAUTH_CLIENT_SECRET: 'public-api-e2e-secret',
      TWO_FACTOR_ENCRYPTION: 'two-factor-encryption-secret-123',
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

    const createOwner = (suffix: string, extra: Partial<Prisma.UserCreateInput> = {}) =>
      prisma.user.create({
        data: {
          name: `${OWNER_NAME} ${suffix}`,
          email: suffix === 'main' ? OWNER_EMAIL : `${RUN}-${suffix}${OWNER_EMAIL_DOMAIN}`,
          handle: suffix === 'main' ? OWNER_HANDLE : `${OWNER_HANDLE}${suffix}`.slice(0, 30),
          passwordHash: OWNER_PASSWORD_HASH,
          ...extra,
        },
      });
    const owner = await createOwner('main');
    ownerId = owner.id;
    const revokedOwner = await createOwner('r');
    const expiredOwner = await createOwner('e');

    await prisma.apiKey.createMany({
      data: [
        { name: `${RUN}-valid`, keyHash: hashApiKey(validKey), ownerId },
        {
          name: `${RUN}-revoked`,
          keyHash: hashApiKey(revokedKey),
          ownerId: revokedOwner.id,
          isRevoked: true,
          revokedAt: new Date(),
        },
        {
          name: `${RUN}-expired`,
          keyHash: hashApiKey(expiredKey),
          ownerId: expiredOwner.id,
          expiresAt: new Date(Date.now() - 60_000),
        },
      ],
    });

    const collection = await prisma.collection.create({
      data: {
        name: `${RUN} Collection`,
        slug: slugs.collection,
        description: 'E2E collection',
        heroImageUrl: 'https://example.com/hero.jpg',
      },
    });
    await prisma.collection.create({
      data: {
        name: `${RUN} Hidden Collection`,
        slug: slugs.inactiveCollection,
        heroImageUrl: 'https://example.com/hero.jpg',
        isActive: false,
      },
    });

    const category = await prisma.category.create({
      data: { name: `${RUN} Category`, slug: slugs.category, collectionId: collection.id },
    });
    const inactiveCategory = await prisma.category.create({
      data: {
        name: `${RUN} Hidden Category`,
        slug: slugs.inactiveCategory,
        collectionId: collection.id,
        isActive: false,
      },
    });
    const family = await prisma.productFamily.create({
      data: { name: `${RUN} Family`, slug: slugs.family, categoryId: category.id },
    });
    await prisma.productFamily.create({
      data: {
        name: `${RUN} Hidden Family`,
        slug: slugs.inactiveFamily,
        categoryId: category.id,
        isActive: false,
      },
    });
    await prisma.productFamily.create({
      data: {
        name: `${RUN} Family Under Hidden Category`,
        slug: `${slugs.inactiveFamily}-2`,
        categoryId: inactiveCategory.id,
      },
    });

    const relations = {
      categories: { connect: [{ id: category.id }] },
      productFamilies: { connect: [{ id: family.id }] },
      collections: { connect: [{ id: collection.id }] },
    };
    await prisma.product.create({
      data: {
        name: `${RUN} Product`,
        slug: slugs.product,
        description: 'E2E product',
        badges: ['new'],
        ...relations,
        variants: {
          create: [
            { label: '30ml', price: '12.50' },
            { label: '50ml', price: '20.00', isOnSale: true, discountPercentage: '10' },
            { label: '100ml', price: '5.00', isAvailable: false },
          ],
        },
      },
    });
    await prisma.product.create({
      data: {
        name: `${RUN} Product Two`,
        slug: slugs.product2,
        ...relations,
        variants: { create: [{ label: '1L', price: '40.00' }] },
      },
    });
    await prisma.product.create({
      data: {
        name: `${RUN} Hidden Product`,
        slug: slugs.inactiveProduct,
        isActive: false,
        ...relations,
        variants: { create: [{ label: '1L', price: '1.00' }] },
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      const like = { startsWith: 'e2e-pubapi-' };
      await prisma.product.deleteMany({ where: { slug: like } });
      await prisma.productFamily.deleteMany({ where: { slug: like } });
      await prisma.category.deleteMany({ where: { slug: like } });
      await prisma.collection.deleteMany({ where: { slug: like } });
      await prisma.apiKey.deleteMany({ where: { name: like } });
      await prisma.user.deleteMany({ where: { email: { endsWith: OWNER_EMAIL_DOMAIN } } });
    }
    await app?.close();
  });

  describe('GET /v1/status', () => {
    it('answers 200 with the documented shape instead of the 501 placeholder', async () => {
      const res = await get('/v1/status').expect(200);
      expect(res.body).toEqual({ success: true, data: { status: 'ok', version: 'v1' } });
    });
  });

  describe('GET /v1/products', () => {
    it('returns the paginated envelope with the documented product shape', async () => {
      const res = await get(`/v1/products?collection=${slugs.collection}`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.meta).toEqual({ page: 1, limit: 25, totalItems: 2, totalPages: 1 });
      expect(res.body.data).toHaveLength(2);

      const product = res.body.data.find((p: { slug: string }) => p.slug === slugs.product);
      expect(product).toEqual({
        id: expect.any(String),
        slug: slugs.product,
        name: `${RUN} Product`,
        description: 'E2E product',
        badges: ['new'],
        minPrice: 12.5,
        media: [placeholderImage],
        primaryImage: placeholderImage,
        variants: expect.any(Array),
        categories: [{ id: expect.any(String), slug: slugs.category, name: `${RUN} Category` }],
        productFamilies: [{ id: expect.any(String), slug: slugs.family, name: `${RUN} Family` }],
        collections: [
          { id: expect.any(String), slug: slugs.collection, name: `${RUN} Collection` },
        ],
      });
      expect(product.variants).toHaveLength(3);
      for (const variant of product.variants) {
        expect(Object.keys(variant).sort()).toEqual(
          ['discountPercentage', 'id', 'isAvailable', 'isOnSale', 'label', 'price'].sort(),
        );
        expect(typeof variant.price).toBe('number');
      }
    });

    it('never lists inactive products', async () => {
      const res = await get(`/v1/products?collection=${slugs.collection}`).expect(200);
      const found = res.body.data.map((p: { slug: string }) => p.slug);
      expect(found).not.toContain(slugs.inactiveProduct);
    });

    it('paginates with page and limit', async () => {
      const first = await get(`/v1/products?collection=${slugs.collection}&limit=1&page=1`).expect(
        200,
      );
      const second = await get(`/v1/products?collection=${slugs.collection}&limit=1&page=2`).expect(
        200,
      );
      expect(first.body.meta).toEqual({ page: 1, limit: 1, totalItems: 2, totalPages: 2 });
      expect(second.body.meta.page).toBe(2);
      expect(first.body.data[0].id).not.toBe(second.body.data[0].id);
    });

    it('filters by price and availability', async () => {
      const res = await get(
        `/v1/products?collection=${slugs.collection}&minPrice=30&onlyAvailable=true`,
      ).expect(200);
      expect(res.body.data.map((p: { slug: string }) => p.slug)).toEqual([slugs.product2]);
    });

    it('returns an empty list, not an error, for an unknown slug filter', async () => {
      const res = await get('/v1/products?collection=does-not-exist-anywhere').expect(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.totalItems).toBe(0);
    });

    it('ignores an empty minPrice or maxPrice instead of turning it into 0', async () => {
      const baseline = await get(`/v1/products?collection=${slugs.collection}`).expect(200);
      const emptyMax = await get(`/v1/products?collection=${slugs.collection}&maxPrice=`).expect(
        200,
      );
      const emptyMin = await get(`/v1/products?collection=${slugs.collection}&minPrice=`).expect(
        200,
      );
      expect(emptyMax.body.meta.totalItems).toBe(baseline.body.meta.totalItems);
      expect(emptyMin.body.meta.totalItems).toBe(baseline.body.meta.totalItems);
    });

    it.each([
      ['minPrice=abc'],
      ['maxPrice=Infinity'],
      ['minPrice=-1'],
      ['minPrice=10&maxPrice=5'],
      ['limit=101'],
      ['limit=0'],
      ['page=0'],
      ['page=99999999999'],
      ['unknown=1'],
      ['sort=nope'],
    ])('rejects invalid query "%s" with the VALIDATION_ERROR format', async (qs) => {
      const res = await get(`/v1/products?${qs}`).expect(400);
      expect(res.body).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: expect.any(String) },
      });
    });
  });

  describe('GET /v1/products/:slug', () => {
    it('returns the product wrapped in the envelope without meta', async () => {
      const res = await get(`/v1/products/${slugs.product}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta).toBeUndefined();
      expect(res.body.data.slug).toBe(slugs.product);
      expect(res.body.data.variants).toHaveLength(3);
    });

    it('exposes only id, slug and name on categories, families and collections', async () => {
      const res = await get(`/v1/products/${slugs.product}`).expect(200);
      for (const list of ['categories', 'productFamilies', 'collections']) {
        for (const ref of res.body.data[list]) {
          expect(Object.keys(ref).sort()).toEqual(['id', 'name', 'slug']);
        }
      }
    });

    it.each([[slugs.inactiveProduct], ['unknown-product-slug']])(
      'answers 404 PRODUCT_NOT_FOUND for %s',
      async (slug) => {
        const res = await get(`/v1/products/${slug}`).expect(404);
        expect(res.body).toEqual({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'The requested product could not be found.',
          },
        });
      },
    );
  });

  describe('GET /v1/collections', () => {
    it('returns the paginated envelope with active collections only', async () => {
      const res = await get('/v1/collections?limit=100').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 100,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
      });

      const found = res.body.data.map((c: { slug: string }) => c.slug);
      expect(found).toContain(slugs.collection);
      expect(found).not.toContain(slugs.inactiveCollection);
    });

    it('returns the documented collection shape', async () => {
      const res = await get('/v1/collections?limit=100').expect(200);
      const collection = res.body.data.find((c: { slug: string }) => c.slug === slugs.collection);
      expect(collection).toEqual({
        id: expect.any(String),
        slug: slugs.collection,
        name: `${RUN} Collection`,
        description: 'E2E collection',
        heroImageUrl: 'https://example.com/hero.jpg',
        categories: [
          {
            id: expect.any(String),
            slug: slugs.category,
            name: `${RUN} Category`,
            productFamilies: [
              { id: expect.any(String), slug: slugs.family, name: `${RUN} Family` },
            ],
          },
        ],
      });
    });

    it('hides inactive categories and product families nested in a collection', async () => {
      const res = await get('/v1/collections?limit=100').expect(200);
      const collection = res.body.data.find((c: { slug: string }) => c.slug === slugs.collection);
      const serialized = JSON.stringify(collection);
      expect(serialized).not.toContain(slugs.inactiveCategory);
      expect(serialized).not.toContain(slugs.inactiveFamily);
    });

    it('serves stable, non-overlapping pages', async () => {
      const all = await get('/v1/collections?limit=100').expect(200);
      const total: number = all.body.meta.totalItems;
      const expectedIds = all.body.data.map((c: { id: string }) => c.id);
      const pages = Math.min(total, 4);

      const walked: string[] = [];
      for (let page = 1; page <= pages; page++) {
        const res = await get(`/v1/collections?limit=1&page=${page}`).expect(200);
        expect(res.body.meta).toEqual({ page, limit: 1, totalItems: total, totalPages: total });
        walked.push(res.body.data[0].id);
      }
      expect(new Set(walked).size).toBe(walked.length);
      if (total <= 100) {
        expect(walked).toEqual(expectedIds.slice(0, pages));
      }
    });

    it('returns an empty page beyond the last one', async () => {
      const res = await get('/v1/collections?limit=100&page=1000000').expect(200);
      expect(res.body.data).toEqual([]);
    });

    it('rejects invalid pagination with the VALIDATION_ERROR format', async () => {
      const res = await get('/v1/collections?limit=1000').expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /v1/collections/:slug', () => {
    it('returns the collection with active categories and families only', async () => {
      const res = await get(`/v1/collections/${slugs.collection}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta).toBeUndefined();
      expect(res.body.data.categories.map((c: { slug: string }) => c.slug)).toEqual([
        slugs.category,
      ]);
      expect(
        res.body.data.categories[0].productFamilies.map((f: { slug: string }) => f.slug),
      ).toEqual([slugs.family]);
    });

    it.each([[slugs.inactiveCollection], ['unknown-collection-slug']])(
      'answers 404 COLLECTION_NOT_FOUND for %s',
      async (slug) => {
        const res = await get(`/v1/collections/${slug}`).expect(404);
        expect(res.body).toEqual({
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: 'The requested collection could not be found.',
          },
        });
      },
    );
  });

  describe('GET /v1/categories', () => {
    it('returns active categories with their collection slug', async () => {
      const res = await get('/v1/categories?limit=100').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta.limit).toBe(100);

      const found = res.body.data.map((c: { slug: string }) => c.slug);
      expect(found).toContain(slugs.category);
      expect(found).not.toContain(slugs.inactiveCategory);

      const category = res.body.data.find((c: { slug: string }) => c.slug === slugs.category);
      expect(category).toEqual({
        id: expect.any(String),
        slug: slugs.category,
        name: `${RUN} Category`,
        collectionSlug: slugs.collection,
      });
    });

    it('does not list categories of an inactive collection', async () => {
      await prisma.category.create({
        data: {
          name: `${RUN} Orphan`,
          slug: `${RUN}-orphan`,
          collection: { connect: { slug: slugs.inactiveCollection } },
        },
      });
      const res = await get('/v1/categories?limit=100').expect(200);
      expect(res.body.data.map((c: { slug: string }) => c.slug)).not.toContain(`${RUN}-orphan`);
    });

    it('serves stable, non-overlapping pages', async () => {
      const first = await get('/v1/categories?limit=1&page=1').expect(200);
      const second = await get('/v1/categories?limit=1&page=2').expect(200);
      const total: number = first.body.meta.totalItems;
      expect(first.body.meta.totalPages).toBe(total);
      if (total >= 2) {
        expect(first.body.data[0].id).not.toBe(second.body.data[0].id);
      }
    });

    it('rejects invalid pagination with the VALIDATION_ERROR format', async () => {
      const res = await get('/v1/categories?page=abc').expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Consistency: authentication errors', () => {
    it.each([
      '/v1/status',
      '/v1/products',
      '/v1/products/some-slug',
      '/v1/collections',
      '/v1/collections/some-slug',
      '/v1/categories',
    ])('%s answers the same 401 body without an API key', async (url) => {
      const res = await get(url, null).expect(401);
      expect(res.body).toEqual(UNAUTHORIZED_BODY);
    });

    it.each([
      ['unknown', () => 'sk_live_not-a-real-key'],
      ['revoked', () => revokedKey],
      ['expired', () => expiredKey],
    ])('rejects an %s key with the generic 401 body', async (_label, key) => {
      const res = await get('/v1/products', key()).expect(401);
      expect(res.body).toEqual(UNAUTHORIZED_BODY);
    });

    it('rejects the key of a suspended owner', async () => {
      await prisma.user.update({ where: { id: ownerId }, data: { status: 'SUSPENDED' } });
      try {
        const res = await get('/v1/status').expect(401);
        expect(res.body).toEqual(UNAUTHORIZED_BODY);
      } finally {
        await prisma.user.update({ where: { id: ownerId }, data: { status: 'ACTIVE' } });
      }
      await get('/v1/status').expect(200);
    });
  });

  describe('No personal data in any response', () => {
    const urls = () => [
      '/v1/status',
      `/v1/products?collection=${slugs.collection}`,
      `/v1/products/${slugs.product}`,
      '/v1/collections?limit=100',
      `/v1/collections/${slugs.collection}`,
      '/v1/categories?limit=100',
    ];

    it('never contains the API key owner data', async () => {
      for (const url of urls()) {
        const res = await get(url).expect(200);
        const body = JSON.stringify(res.body);
        for (const secret of [
          OWNER_EMAIL,
          OWNER_HANDLE,
          OWNER_NAME,
          OWNER_PASSWORD_HASH,
          validKey,
          hashApiKey(validKey),
          ownerId,
        ]) {
          expect(body).not.toContain(secret);
        }
      }
    });

    it('never exposes internal or personal field names', async () => {
      for (const url of urls()) {
        const res = await get(url).expect(200);
        const keys = collectKeys(res.body);
        for (const forbidden of FORBIDDEN_KEYS) {
          expect(keys.has(forbidden)).toBe(false);
        }
      }
    });
  });
});
