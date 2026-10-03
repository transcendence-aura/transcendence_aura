import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AccessTokenPayload, TokenService } from '../../modules/auth/token.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { ACCESS_COOKIE_NAME } from '../../modules/auth/auth.constants';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);

    // An upstream authentication guard may already have resolved and attached the caller's id.
    // That's trusted because it can only be set by server-side guard code, never by the client -
    // so the token itself doesn't need re-verifying here, only the role still does.
    const userId = request.userId ?? (await this.authenticate(request));

    // The role is always re-read from the database rather than trusted from
    // the token payload: a role change (e.g. revoking admin) must take effect
    // immediately, not only once the previously issued token expires.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true, deletedAt: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt !== null) {
      throw new UnauthorizedException();
    }

    // Set on every successful check (not just the upstream-guard fast path)
    // so @CurrentUser() also works on routes protected only by RolesGuard.
    request.userId = user.id;
    request.user = { id: user.id, role: user.role };

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException();
    }

    return true;
  }

  private async authenticate(request: AuthenticatedRequest): Promise<string> {
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: AccessTokenPayload;

    try {
      payload = await this.tokenService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException();
    }

    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException();
    }

    return payload.sub;
  }

  private getRequest(context: ExecutionContext): AuthenticatedRequest {
    if (context.getType<GqlContextType>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{ req: AuthenticatedRequest }>().req;
    }
    return context.switchToHttp().getRequest<AuthenticatedRequest>();
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const header = request.headers.authorization;

    if (header) {
      const [scheme, token] = header.split(' ');

      if (scheme === 'Bearer' && token) {
        return token;
      }
    }

    const cookieToken = request.cookies?.[ACCESS_COOKIE_NAME];

    return typeof cookieToken === 'string' && cookieToken.length > 0 ? cookieToken : undefined;
  }
}
