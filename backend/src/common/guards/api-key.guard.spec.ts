import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { ApiKeyGuard } from './api-key.guard';
import { hashApiKey } from '../../modules/api-keys/api-key.utils';

describe('ApiKeyGuard', () => {
  const prisma = { apiKey: { findUnique: jest.fn(), update: jest.fn() } };

  let guard: ApiKeyGuard;

  const activeOwner = { status: UserStatus.ACTIVE, deletedAt: null };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ApiKeyGuard(prisma as never);
  });

  function createContext(headers: Record<string, string> = {}) {
    const request: { headers: Record<string, string>; apiKey?: unknown } = { headers };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('denies when no X-API-Key header is present', async () => {
    const context = createContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.apiKey.findUnique).not.toHaveBeenCalled();
  });

  it('denies when the key does not match any stored hash', async () => {
    prisma.apiKey.findUnique.mockResolvedValue(null);
    const context = createContext({ 'x-api-key': 'unknown-key' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('denies a revoked key with the same generic error as an unknown key', async () => {
    prisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      ownerId: 'user-1',
      scopes: [],
      isRevoked: true,
      expiresAt: null,
      owner: activeOwner,
    });
    const context = createContext({ 'x-api-key': 'revoked-key' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.apiKey.update).not.toHaveBeenCalled();
  });

  it('denies an expired key', async () => {
    prisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      ownerId: 'user-1',
      scopes: [],
      isRevoked: false,
      expiresAt: new Date(Date.now() - 1000),
      owner: activeOwner,
    });
    const context = createContext({ 'x-api-key': 'expired-key' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('denies a valid, non-revoked key whose owner is suspended', async () => {
    prisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      ownerId: 'user-1',
      scopes: [],
      isRevoked: false,
      expiresAt: null,
      owner: { status: UserStatus.SUSPENDED, deletedAt: null },
    });
    const context = createContext({ 'x-api-key': 'valid-key' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.apiKey.update).not.toHaveBeenCalled();
  });

  it('denies a valid, non-revoked key whose owner is soft-deleted', async () => {
    prisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      ownerId: 'user-1',
      scopes: [],
      isRevoked: false,
      expiresAt: null,
      owner: { status: UserStatus.ACTIVE, deletedAt: new Date() },
    });
    const context = createContext({ 'x-api-key': 'valid-key' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.apiKey.update).not.toHaveBeenCalled();
  });

  it('allows a valid key, attaches it to the request, and bumps lastUsedAt', async () => {
    prisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      ownerId: 'user-1',
      scopes: ['read'],
      isRevoked: false,
      expiresAt: null,
      owner: activeOwner,
    });
    const request: { headers: Record<string, string>; apiKey?: unknown } = {
      headers: { 'x-api-key': 'valid-key' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.apiKey).toEqual({ id: 'key-1', ownerId: 'user-1', scopes: ['read'] });
    expect(prisma.apiKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: { lastUsedAt: expect.any(Date) },
    });
  });

  it('looks up the key by the sha256 hash of the presented value, never the raw value', async () => {
    prisma.apiKey.findUnique.mockResolvedValue(null);
    const context = createContext({ 'x-api-key': 'some-raw-key' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
      where: { keyHash: hashApiKey('some-raw-key') },
      include: { owner: { select: { status: true, deletedAt: true } } },
    });
  });
});
