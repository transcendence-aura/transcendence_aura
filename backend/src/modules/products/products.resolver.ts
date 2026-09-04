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

    const actorId = await this.resolveOptionalActorId(context.req);
    if (actorId) {
      await this.analyticsService.record(AnalyticsEventType.PRODUCT_VIEWED, actorId, {
        type: AnalyticsTargetType.PRODUCT,
        id: product.id,
      });
    }

    return product;
  }

  // Browsing a product is and remains public: this only attaches an actor
  // when a valid access token happens to be present, so anonymous views
  // stay untracked and the query never requires authentication.
  private async resolveOptionalActorId(request: AuthenticatedRequest): Promise<string | undefined> {
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!token) {
      return undefined;
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      return payload.sub;
    } catch {
      return undefined;
    }
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
