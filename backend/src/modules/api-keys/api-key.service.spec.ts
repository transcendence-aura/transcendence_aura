import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { ApiKeyService } from './api-key.service';

describe('ApiKeyService', () => {
  const apiKey = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  type FakePrisma = { apiKey: typeof apiKey; $transaction: jest.Mock };
  const prisma: FakePrisma = { apiKey, $transaction: jest.fn() };

  let service: ApiKeyService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((fn: (tx: FakePrisma) => unknown) => fn(prisma));
    service = new ApiKeyService(prisma as never);
  });

  describe('create', () => {
    it('creates a key and returns the raw value once when the owner has no active key', async () => {
      apiKey.findFirst.mockResolvedValue(null);
      apiKey.create.mockResolvedValue({
        id: 'key-1',
        name: 'my-key',
        scopes: [],
        expiresAt: null,
        createdAt: new Date('2026-01-01'),
      });

      const result = await service.create('user-1', { name: 'my-key' });

      expect(apiKey.findFirst).toHaveBeenCalledWith({
        where: { ownerId: 'user-1', isRevoked: false },
      });
      expect(result.id).toBe('key-1');
      expect(result.key).toEqual(expect.any(String));
      expect(result.key.length).toBeGreaterThan(0);
    });

    it('rejects with a conflict naming the existing key when the owner already has a non-revoked key', async () => {
      apiKey.findFirst.mockResolvedValue({ id: 'existing-key', isRevoked: false });

      const failure: unknown = await service
        .create('user-1', { name: 'second-key' })
        .catch((e) => e);

      expect(failure).toBeInstanceOf(ConflictException);
      expect((failure as ConflictException).message).toContain('existing-key');
      expect(apiKey.create).not.toHaveBeenCalled();
    });

    it('allows creating a new key once the previous one was revoked', async () => {
      apiKey.findFirst.mockResolvedValue(null);
      apiKey.create.mockResolvedValue({
        id: 'key-2',
        name: 'replacement-key',
        scopes: [],
        expiresAt: null,
        createdAt: new Date('2026-01-02'),
      });

      await expect(service.create('user-1', { name: 'replacement-key' })).resolves.toMatchObject({
        id: 'key-2',
      });
    });
  });

  describe('create (concurrent race)', () => {
    it('turns a unique-index violation from a losing concurrent call into a conflict', async () => {
      apiKey.findFirst.mockResolvedValue(null);
      apiKey.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.create('user-1', { name: 'racing-key' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows unrelated errors untouched', async () => {
      apiKey.findFirst.mockResolvedValue(null);
      apiKey.create.mockRejectedValue(new Error('db down'));

      await expect(service.create('user-1', { name: 'k' })).rejects.toThrow('db down');
    });
  });

  describe('list', () => {
    it('returns metadata plus the owner, and never the hash or a raw value', async () => {
      apiKey.findMany.mockResolvedValue([
        {
          id: 'key-1',
          name: 'my-key',
          scopes: ['read'],
          expiresAt: null,
          lastUsedAt: null,
          isRevoked: false,
          revokedAt: null,
          createdAt: new Date('2026-01-01'),
          keyHash: 'should-never-be-selected-but-guard-anyway',
          owner: { id: 'user-1', handle: 'marie', email: 'marie@example.com' },
        },
      ]);

      const result = await service.list();

      expect(apiKey.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { id: true, handle: true, email: true } } },
      });
      expect(result).toEqual([
        {
          id: 'key-1',
          name: 'my-key',
          scopes: ['read'],
          expiresAt: null,
          lastUsedAt: null,
          isRevoked: false,
          revokedAt: null,
          createdAt: new Date('2026-01-01'),
          owner: { id: 'user-1', handle: 'marie', email: 'marie@example.com' },
        },
      ]);
      expect(result[0]).not.toHaveProperty('keyHash');
      expect(result[0]).not.toHaveProperty('key');
    });
  });

  describe('revoke', () => {
    it('throws NotFoundException when the key does not exist', async () => {
      apiKey.findUnique.mockResolvedValue(null);

      await expect(
        service.revoke('missing-key', { id: 'user-1', role: UserRole.USER }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lets the owner revoke their own key', async () => {
      apiKey.findUnique.mockResolvedValue({ id: 'key-1', ownerId: 'user-1', isRevoked: false });

      await service.revoke('key-1', { id: 'user-1', role: UserRole.USER });

      expect(apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { isRevoked: true, revokedAt: expect.any(Date) },
      });
    });

    it('lets an admin revoke a key they do not own', async () => {
      apiKey.findUnique.mockResolvedValue({ id: 'key-1', ownerId: 'user-1', isRevoked: false });

      await service.revoke('key-1', { id: 'admin-1', role: UserRole.ADMIN });

      expect(apiKey.update).toHaveBeenCalled();
    });

    it("denies a different non-admin user from revoking someone else's key", async () => {
      apiKey.findUnique.mockResolvedValue({ id: 'key-1', ownerId: 'user-1', isRevoked: false });

      await expect(
        service.revoke('key-1', { id: 'user-2', role: UserRole.USER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(apiKey.update).not.toHaveBeenCalled();
    });

    it('is idempotent when the key is already revoked', async () => {
      apiKey.findUnique.mockResolvedValue({ id: 'key-1', ownerId: 'user-1', isRevoked: true });

      await service.revoke('key-1', { id: 'user-1', role: UserRole.USER });

      expect(apiKey.update).not.toHaveBeenCalled();
    });
  });
});
