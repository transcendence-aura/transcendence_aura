import { Resolver, Query, Args } from '@nestjs/graphql';
import { CollectionsType } from './collection.model';
import { CollectionsService } from './collection.service';

@Resolver(() => CollectionsType)
export class CollectionsResolver {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Query(() => [CollectionsType])
  async collections(): Promise<CollectionsType[]> {
    return this.collectionsService.findAll();
  }

  @Query(() => CollectionsType)
  async collection(@Args('slug') slug: string): Promise<CollectionsType> {
    return this.collectionsService.findBySlug(slug);
  }
}
