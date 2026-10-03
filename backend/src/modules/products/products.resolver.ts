import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { ProductPageType, ProductType } from './product.model';
import { ProductsService } from './product.service';
import { ProductPaginationInput, ProductsFilterInput } from './product.input';
import { TokenService } from '../auth/token.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEventType, AnalyticsTargetType } from '../analytics/analytics-event-type.enum';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

@Resolver(() => ProductType)
export class ProductResolver {
  constructor(
    private readonly productService: ProductsService,
    private readonly tokenService: TokenService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Query(() => ProductType)
  async product(
    @Args('slug') slug: string,
    @Context() context: { req: AuthenticatedRequest },
  ): Promise<ProductType> {
    const product = await this.productService.findBySlug(slug);

    // Browsing a product is and remains public: an actor is attached only when a
    // valid access token is present, so anonymous views stay untracked and the
    // query never requires authentication.
    const actorId = await this.tokenService.getOptionalUserId(context.req.headers.authorization);
    if (actorId) {
      await this.analyticsService.record(AnalyticsEventType.PRODUCT_VIEWED, actorId, {
        type: AnalyticsTargetType.PRODUCT,
        id: product.id,
      });
    }

    return product;
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
