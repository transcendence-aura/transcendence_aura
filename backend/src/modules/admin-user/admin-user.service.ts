import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: ADMIN_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return mapAdminUser(user);
  }
}
