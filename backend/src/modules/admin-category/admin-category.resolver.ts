import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminCategoryType } from './admin-category.model';
import { AdminCategoryService } from './admin-category.service';
import { AdminCategoryFilterInput } from './admin-category.input';

@Resolver(() => AdminCategoryType)
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCategoryResolver {
  constructor(private readonly adminCategoryService: AdminCategoryService) {}

  @Query(() => [AdminCategoryType])
  adminCategories(
    @Args('filter', { type: () => AdminCategoryFilterInput, nullable: true })
    filter?: AdminCategoryFilterInput,
  ): Promise<AdminCategoryType[]> {
    return this.adminCategoryService.listCategories(filter ?? {});
  }
}
