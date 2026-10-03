import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminCollectionType } from './admin-collection.model';
import { AdminCollectionService } from './admin-collection.service';
import { AdminCollectionFilterInput } from './admin-collection.input';

@Resolver(() => AdminCollectionType)
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCollectionResolver {
  constructor(private readonly adminCollectionService: AdminCollectionService) {}

  @Query(() => [AdminCollectionType])
  adminCollections(
    @Args('filter', { type: () => AdminCollectionFilterInput, nullable: true })
    filter?: AdminCollectionFilterInput,
  ): Promise<AdminCollectionType[]> {
    return this.adminCollectionService.listCollections(filter ?? {});
  }
}
