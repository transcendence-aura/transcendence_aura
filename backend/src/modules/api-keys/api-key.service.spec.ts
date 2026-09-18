import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiKeyService } from './api-key.service';

describe('ApiKeyService', () => {
  const apiKey = {
    findFirst: jest.fn(),
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
