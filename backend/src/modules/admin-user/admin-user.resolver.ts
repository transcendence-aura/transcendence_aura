import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminUserPageType, AdminUserType } from './admin-user.model';
import { AdminUserFilterInput, AdminUserPaginationInput } from './admin-user.input';
import { AdminUserService } from './admin-user.service';

@Resolver(() => AdminUserType)
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserResolver {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Query(() => AdminUserPageType)
  adminUsers(
    @Args('filter', { type: () => AdminUserFilterInput, nullable: true })
    filter?: AdminUserFilterInput,
    @Args('pagination', { type: () => AdminUserPaginationInput, nullable: true })
    pagination?: AdminUserPaginationInput,
  ): Promise<AdminUserPageType> {
    return this.adminUserService.findMany(filter ?? {}, {
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
    });
  }

  @Query(() => AdminUserType)
  adminUser(@Args('id', ParseUUIDPipe) id: string): Promise<AdminUserType> {
    return this.adminUserService.findById(id);
  }
}
