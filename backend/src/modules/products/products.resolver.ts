import { Resolver, Query, Args } from '@nestjs/graphql';
import { ProductPageType, ProductType } from './product.model';
import { ProductsService } from './product.service';
import { ProductPaginationInput, ProductsFilterInput } from './product.input';

@Resolver(() => ProductType)
export class ProductResolver {
  constructor(private readonly productService: ProductsService) {}

  @Query(() => ProductType)
  async product(@Args('slug') slug: string): Promise<ProductType> {
    return this.productService.findBySlug(slug);
  }

  @Query(() => ProductPageType)
  async products(
    @Args('filter', { type: () => ProductsFilterInput, nullable: true })
    filter?: ProductsFilterInput,
    @Args('pagination', { type: () => ProductPaginationInput, nullable: true })
    pagination?: ProductPaginationInput,
  ): Promise<ProductPageType> {
    return this.productService.findMany(filter ?? {}, pagination ?? { page: 1, limit: 20 });
  }
}
