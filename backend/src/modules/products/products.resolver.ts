import { Resolver, Query, Args } from '@nestjs/graphql';
import { ProductType } from './product.model';
import { ProductsService } from './product.service';

@Resolver(() => ProductType)
export class ProductResolver {
  constructor(private readonly productService: ProductsService) {}

  @Query(() => ProductType)
  async product(@Args('slug') slug: string): Promise<ProductType> {
    return this.productService.findBySlug(slug);
  }
}
