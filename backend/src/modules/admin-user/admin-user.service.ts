import { Injectable, NotFoundException, ConflictException, ForbiddenException} from '@nestjs/common';
import { Prisma, TokenRevocationReason, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RefreshTokenService } from '../auth/refresh/refresh-token.service';
import { AdminUserPageType, AdminUserType } from './admin-user.model';
import { AdminUserFilterInput, AdminUserPaginationInput, AdminUserSortOrder } from './admin-user.input';

const ADMIN_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  handle: true,
  role: true,
  status: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type AdminUserRow = Prisma.UserGetPayload<{ select: typeof ADMIN_USER_SELECT }>;

function mapAdminUser(user: AdminUserRow): AdminUserType {
  const { createdAt, ...rest } = user;
  return { ...rest, joinedAt: createdAt };
}

function buildOrderBy(sort?: AdminUserSortOrder): Prisma.UserOrderByWithRelationInput[] {
  const primary = ((): Prisma.UserOrderByWithRelationInput => {
    switch (sort) {
      case AdminUserSortOrder.NAME_ASC:
        return { name: 'asc' };
      case AdminUserSortOrder.NAME_DESC:
        return { name: 'desc' };
      case AdminUserSortOrder.ROLE_ASC:
        return { role: 'asc' };
      case AdminUserSortOrder.ROLE_DESC:
        return { role: 'desc' };
      case AdminUserSortOrder.STATUS_ASC:
        return { status: 'asc' };
      case AdminUserSortOrder.STATUS_DESC:
        return { status: 'desc' };
      case AdminUserSortOrder.JOINED_AT_ASC:
        return { createdAt: 'asc' };
      case AdminUserSortOrder.JOINED_AT_DESC:
      default:
        return { createdAt: 'desc' };
    }
  })();

  return [primary, { id: 'asc' }];
}

@Injectable()
export class AdminUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async findMany(
    filter: AdminUserFilterInput,
    pagination: AdminUserPaginationInput,
  ): Promise<AdminUserPageType> {
    const where: Prisma.UserWhereInput = {
      role: filter.role,
      status: filter.status,
    };
    const skip = (pagination.page - 1) * pagination.limit;

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: buildOrderBy(filter.sort),
        skip,
        take: pagination.limit,
        select: ADMIN_USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: rows.map(mapAdminUser),
      total,
      hasNextPage: skip + rows.length < total,
    };
  }

  async findById(id: string): Promise<AdminUserType> {
    const user = await this.findRawOrThrow(id);

    return mapAdminUser(user);
  }

  private assertNotSelf(targetUserId: string, actorId: string, message: string): void {
    if (targetUserId === actorId) {
      throw new ForbiddenException(message);
    }
  }

  private async findRawOrThrow(id: string): Promise<AdminUserRow> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: ADMIN_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return user;
  }

  async setRole(targetUserId: string, role: UserRole, actorId: string): Promise<AdminUserType> {
    this.assertNotSelf(targetUserId, actorId, 'CANNOT_CHANGE_OWN_ROLE');

    const target = await this.findRawOrThrow(targetUserId);

    if (target.status === UserStatus.DELETED) {
      throw new ConflictException('USER_DELETED');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: ADMIN_USER_SELECT,
    });

    return mapAdminUser(updated);
  }

  async suspend(targetUserId: string, actorId: string): Promise<AdminUserType> {
    this.assertNotSelf(targetUserId, actorId, 'CANNOT_SUSPEND_OWN_ACCOUNT');

    const target = await this.findRawOrThrow(targetUserId);

    if (target.status === UserStatus.DELETED) {
      throw new ConflictException('USER_DELETED');
    }
    if (target.status === UserStatus.SUSPENDED) {
      throw new ConflictException('USER_ALREADY_SUSPENDED');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.SUSPENDED },
      select: ADMIN_USER_SELECT,
    });

    await this.refreshTokenService.revokeAllForUser(
      targetUserId,
      TokenRevocationReason.ADMIN_REVOKED,
    );

    return mapAdminUser(updated);
  }

  async reinstate(targetUserId: string): Promise<AdminUserType> {
    const target = await this.findRawOrThrow(targetUserId);

    if (target.status !== UserStatus.SUSPENDED) {
      throw new ConflictException('USER_NOT_SUSPENDED');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.ACTIVE },
      select: ADMIN_USER_SELECT,
    });

    return mapAdminUser(updated);
  }

  async delete(targetUserId: string, actorId: string): Promise<AdminUserType> {
    this.assertNotSelf(targetUserId, actorId, 'CANNOT_DELETE_OWN_ACCOUNT');

    const target = await this.findRawOrThrow(targetUserId);

    if (target.status === UserStatus.DELETED) {
      throw new ConflictException('USER_ALREADY_DELETED');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.DELETED, deletedAt: new Date() },
      select: ADMIN_USER_SELECT,
    });

    await this.refreshTokenService.revokeAllForUser(
      targetUserId,
      TokenRevocationReason.ADMIN_REVOKED,
    );

    return mapAdminUser(updated);
  }
}
