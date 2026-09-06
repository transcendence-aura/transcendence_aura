import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from '../../../config/configuration';
import { TokenService } from '../token.service';
import { TokenRevocationReason, UserStatus } from '@prisma/client';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.utils';
import { PERMISSIONS } from '../auth.permissions';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  async createSession(userId: string): Promise<{
    refreshToken: string;
    refreshExpiresInMs: number;
  }> {
    const auth = this.configService.get('auth', { infer: true });
    const ttlMs = auth.refreshTokenTtl * 1000;
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const familyId = randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
    return {
      refreshToken: rawRefreshToken,
      refreshExpiresInMs: ttlMs,
    };
  }

  async refresh(presentedToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshExpiresInMs: number;
  }> {
    const presentedHash = hashRefreshToken(presentedToken);

    const now = new Date();
    const auth = this.configService.get('auth', { infer: true });
    const ttlMs = auth.refreshTokenTtl * 1000;

    const result = await this.prisma.$transaction(async (tx) => {
      const currentToken = await tx.refreshToken.findUnique({
        where: {
          tokenHash: presentedHash,
        },
      });
      // UNKNOWN REFRESH TOKEN
      if (!currentToken) {
        return { status: 'invalid' as const };
      }
      // REUSE DETECTION. Revoke every currently active token in the same family.
      if (currentToken.isRevoked) {
        await tx.refreshToken.updateMany({
          where: {
            userId: currentToken.userId,
            familyId: currentToken.familyId,
            isRevoked: false,
          },
          data: {
            isRevoked: true,
            revokedAt: now,
            revocationReason: 'REUSE_DETECTED',
          },
        });

        return {
          status: 'reuse_detected' as const,
          userId: currentToken.userId,
          familyId: currentToken.familyId,
        };
      }

      // EXPIRED REFRESH TOKEN
      if (currentToken.expiresAt <= now) {
        await tx.refreshToken.update({
          where: {
            id: currentToken.id,
          },
          data: {
            isRevoked: true,
            revokedAt: now,
            revocationReason: 'EXPIRED',
          },
        });

        return {
          status: 'invalid' as const,
        };
      }

      const user = await tx.user.findUnique({
        where: {
          id: currentToken.userId,
        },
        select: {
          id: true,
          role: true,
          status: true,
          deletedAt: true,
        },
      });

      if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt !== null) {
        await tx.refreshToken.updateMany({
          where: {
            userId: currentToken.userId,
            familyId: currentToken.familyId,
            isRevoked: false,
          },
          data: {
            isRevoked: true,
            revokedAt: now,
            revocationReason: 'INACTIVE_USER',
          },
        });
        return {
          status: 'invalid' as const,
        };
      }

      const permissions = [...PERMISSIONS[user.role]];

      // ROTATION. Atomically claim current refresh token for rotation.
      const revoked = await tx.refreshToken.updateMany({
        where: {
          id: currentToken.id,
          isRevoked: false,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          isRevoked: true,
          revokedAt: now,
          revocationReason: 'ROTATED',
        },
      });

      if (revoked.count !== 1) {
        await tx.refreshToken.updateMany({
          where: {
            userId: currentToken.userId,
            familyId: currentToken.familyId,
            isRevoked: false,
          },
          data: {
            isRevoked: true,
            revokedAt: now,
            revocationReason: 'REUSE_DETECTED',
          },
        });

        return {
          status: 'reuse_detected' as const,
          userId: currentToken.userId,
          familyId: currentToken.familyId,
        };
      }

      const rawRefreshToken = generateRefreshToken();

      const tokenHash = hashRefreshToken(rawRefreshToken);

      await tx.refreshToken.create({
        data: {
          tokenHash,
          familyId: currentToken.familyId,
          userId: currentToken.userId,
          expiresAt: new Date(now.getTime() + ttlMs),
        },
      });

      return {
        status: 'rotated' as const,
        userId: user.id,
        permissions,
        refreshToken: rawRefreshToken,
      };
    });

    if (result.status === 'invalid') {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (result.status === 'reuse_detected') {
      this.logger.warn({
        event: 'REFRESH_TOKEN_REUSE',
        userId: result.userId,
        familyId: result.familyId,
      });
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const accessToken = await this.tokenService.issueAccessToken(result.userId, result.permissions);

    return {
      accessToken,
      refreshToken: result.refreshToken,
      refreshExpiresInMs: ttlMs,
    };
  }

  async revokeAllForUser(userId: string, reason: TokenRevocationReason): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: reason,
      },
    });
  }
}
