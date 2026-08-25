import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const tokenService = { verifyAccessToken: jest.fn() };
  const prisma = { user: { findUnique: jest.fn() } };
  const reflector = { getAllAndOverride: jest.fn() };

  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector as never, tokenService as never, prisma as never);
  });

  function createHttpContext(authorization?: string, request?: Record<string, unknown>) {
    const req = request ?? { headers: { authorization } };
    const handler = jest.fn();
    const klass = jest.fn();
    return {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => handler,
      getClass: () => klass,
    } as unknown as ExecutionContext;
  }

  it('denies when no Authorization header is present', async () => {
    const context = createHttpContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('denies when the token fails verification', async () => {
    tokenService.verifyAccessToken.mockRejectedValue(new Error('invalid signature'));
    const context = createHttpContext('Bearer bad-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('denies non-access tokens (e.g. an MFA-pending token)', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({ sub: 'user-1', tokenType: 'mfaPending' });
    const context = createHttpContext('Bearer mfa-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('denies when the user no longer exists in the database', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      tokenType: 'access',
      permissions: [],
    });
    prisma.user.findUnique.mockResolvedValue(null);
    const context = createHttpContext('Bearer valid-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('denies when the user account is suspended or soft-deleted', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      tokenType: 'access',
      permissions: [],
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.USER,
      status: UserStatus.SUSPENDED,
      deletedAt: null,
    });
    const context = createHttpContext('Bearer valid-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('denies with 403 when the fresh database role does not match the required roles', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      tokenType: 'access',
      permissions: [],
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createHttpContext('Bearer valid-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows and attaches the fresh database role to the request when it matches', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      tokenType: 'access',
      permissions: [],
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    const request: { headers: Record<string, string>; userId?: string; user?: unknown } = {
      headers: { authorization: 'Bearer valid-token' },
    };
    const context = createHttpContext(undefined, request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1', role: UserRole.ADMIN });
    expect(request.userId).toBe('user-1');
  });

  it('ignores any role claim on the token itself - only the database role is used', async () => {
    // Simulates a stale token issued before an admin demotion: even though
    // nothing in this payload claims a role, a compromised/forged claim
    // would still be ignored since the guard never reads role from the token.
    tokenService.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      tokenType: 'access',
      permissions: ['users:manage'],
      role: UserRole.ADMIN,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createHttpContext('Bearer valid-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('trusts a userId already attached by an upstream auth guard (e.g. GqlAuthGuard) and skips token verification', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    const request: { headers: Record<string, string>; userId?: string; user?: unknown } = {
      headers: {},
      userId: 'user-1',
    };
    const context = createHttpContext(undefined, request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, role: true, status: true, deletedAt: true },
    });
    expect(request.user).toEqual({ id: 'user-1', role: UserRole.ADMIN });
  });

  it('still denies when a pre-attached userId no longer maps to an active account', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.USER,
      status: UserStatus.SUSPENDED,
      deletedAt: null,
    });

    const request = { headers: {}, userId: 'user-1' };
    const context = createHttpContext(undefined, request);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('sets request.userId even when authenticating itself, so @CurrentUser() works without an upstream guard', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      tokenType: 'access',
      permissions: [],
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const request: { headers: Record<string, string>; userId?: string } = {
      headers: { authorization: 'Bearer valid-token' },
    };
    const context = createHttpContext(undefined, request);

    await guard.canActivate(context);

    expect(request.userId).toBe('user-1');
  });

  it('allows any authenticated user when no @Roles() is declared', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      tokenType: 'access',
      permissions: [],
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createHttpContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('reads required roles from the ROLES_KEY metadata via Reflector', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      tokenType: 'access',
      permissions: [],
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createHttpContext('Bearer valid-token');

    await guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
