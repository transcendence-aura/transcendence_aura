import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyCreatedDto } from './dto/api-key-created.dto';
import { ApiKeySummaryDto } from './dto/api-key-summary.dto';
import { generateApiKey, hashApiKey } from './api-key.utils';

const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateApiKeyDto): Promise<ApiKeyCreatedDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const activeKey = await tx.apiKey.findFirst({
          where: { ownerId, isRevoked: false },
        });

        if (activeKey) {
          throw new ConflictException(
            `You already have an active API key (id: ${activeKey.id}). Revoke it before creating a new one.`,
          );
        }

        const rawKey = generateApiKey();

        const apiKey = await tx.apiKey.create({
          data: {
            name: dto.name,
            scopes: dto.scopes ?? [],
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            keyHash: hashApiKey(rawKey),
            ownerId,
          },
        });

        return {
          id: apiKey.id,
          name: apiKey.name,
          key: rawKey,
          scopes: apiKey.scopes,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        };
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        throw new ConflictException(
          'You already have an active API key. Revoke it before creating a new one.',
        );
      }
      throw error;
    }
  }

  async list(): Promise<ApiKeySummaryDto[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, handle: true, email: true } } },
    });

    return apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      isRevoked: apiKey.isRevoked,
      revokedAt: apiKey.revokedAt,
      createdAt: apiKey.createdAt,
      owner: apiKey.owner,
    }));
  }

  async revoke(id: string, requester: AuthenticatedUser): Promise<void> {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });

    if (!apiKey) {
      throw new NotFoundException();
    }

    if (apiKey.ownerId !== requester.id && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }

    if (apiKey.isRevoked) {
      return;
    }

    await this.prisma.apiKey.update({
      where: { id },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }
}
