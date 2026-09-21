import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { hashApiKey } from '../../modules/api-keys/api-key.utils';
import { AuthenticatedRequest } from '../types/authenticated-request';

const API_KEY_HEADER = 'x-api-key';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const presentedKey = request.headers[API_KEY_HEADER];

    if (typeof presentedKey !== 'string' || presentedKey.length === 0) {
      throw new UnauthorizedException();
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash: hashApiKey(presentedKey) },
      include: { owner: { select: { status: true, deletedAt: true } } },
    });

    // Same generic failure whether the key doesn't exist, was revoked,
    // expired, or its owner is suspended/deleted - never hints which.
    if (
      !apiKey ||
      apiKey.isRevoked ||
      (apiKey.expiresAt && apiKey.expiresAt <= new Date()) ||
      apiKey.owner.status !== UserStatus.ACTIVE ||
      apiKey.owner.deletedAt !== null
    ) {
      throw new UnauthorizedException();
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    request.apiKey = { id: apiKey.id, ownerId: apiKey.ownerId };

    return true;
  }
}
