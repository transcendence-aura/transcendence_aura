import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminProductFamilyType } from './admin-product-family.model';
import { AdminProductFamilyService } from './admin-product-family.service';
import { AdminProductFamilyFilterInput } from './admin-product-family.input';

@Resolver(() => AdminProductFamilyType)
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminProductFamilyResolver {
  constructor(private readonly adminProductFamilyService: AdminProductFamilyService) {}

  @Query(() => [AdminProductFamilyType])
  adminProductFamilies(
    @Args('filter', { type: () => AdminProductFamilyFilterInput, nullable: true })
    filter?: AdminProductFamilyFilterInput,
  ): Promise<AdminProductFamilyType[]> {
    return this.adminProductFamilyService.listProductFamilies(filter ?? {});
  }
}
