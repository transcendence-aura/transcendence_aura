import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { CategoriesService } from '../modules/categories/category.service';
import { CollectionsService } from '../modules/collections/collection.service';
import { ProductsService } from '../modules/products/product.service';
import { ProfileService } from '../modules/profiles/profile.service';
import { WishlistService } from '../modules/wishlist/wishlist.service';
import { ApiExceptionFilter } from './api-exception.filter';
import { ApiKeyThrottlerGuard } from './api-key-throttler.guard';
import { API_RATE_LIMIT } from './api-rate-limit';
import type { ApiSuccess } from './api-response';
import {
  ApiEnvelopeResponse,
  ApiErrorResponse,
  ok,
  paginated,
  RETRY_AFTER_HEADER,
} from './api-response';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import {
  PublicCategoryDto,
  PublicCollectionDto,
  PublicProductDto,
  PublicStatusDto,
} from './dto/public-catalogue.dto';
import {
  AddWishlistItemDto,
  PublicProfileDto,
  PublicWishlistItemDto,
  UpdateProfileDto,
} from './dto/public-user.dto';
import { toPublicCategory, toPublicCollection, toPublicProduct } from './public-catalogue.mapper';

// Controller path is 'v1', not 'api/v1': nginx's `location /api/` strips
// the /api/ prefix before proxying to the backend (see nginx/nginx.conf),
// so a client-facing /api/v1/status maps to this app's /v1/status - same
// convention already used by AvatarController and AdminProductImageController.
@ApiTags('Public API')
@ApiSecurity('ApiKeyAuth')
@ApiErrorResponse(
  401,
  'Missing, unknown, revoked or expired API key.',
  'UNAUTHORIZED',
  'A valid API key is required.',
)
@ApiErrorResponse(
  429,
  `Rate limit exceeded: ${API_RATE_LIMIT.limit} requests per ${API_RATE_LIMIT.ttlMs / 1000} seconds per API key. The Retry-After header gives the seconds to wait.`,
  'RATE_LIMITED',
  'Too many requests.',
  RETRY_AFTER_HEADER,
)
@ApiErrorResponse(
  500,
  'Unexpected server error.',
  'INTERNAL_ERROR',
  'An unexpected error occurred.',
)
@Controller('v1')
@UseGuards(ApiKeyGuard, ApiKeyThrottlerGuard)
@UseFilters(ApiExceptionFilter)
export class ApiController {
  constructor(
    private readonly products: ProductsService,
    private readonly collections: CollectionsService,
    private readonly categories: CategoriesService,
    private readonly wishlist: WishlistService,
    private readonly profiles: ProfileService,
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Public API status',
    description:
      'Confirms the API is reachable and the API key is valid. Does not query the catalogue.',
  })
  @ApiEnvelopeResponse(PublicStatusDto, { description: 'The API is up.' })
  status(): ApiSuccess<PublicStatusDto> {
    return ok({ status: 'ok', version: 'v1' });
  }

  @Get('products')
  @ApiOperation({
    summary: 'List active products',
    description:
      'Paginated list of active products. Combine the optional filters freely; an unknown ' +
      'slug filter returns an empty list, not an error.',
  })
  @ApiEnvelopeResponse(PublicProductDto, { list: true, description: 'A page of products.' })
  @ApiErrorResponse(
    400,
    'Invalid or unknown query parameter, or minPrice greater than maxPrice.',
    'VALIDATION_ERROR',
    'limit must not be greater than 100',
  )
  async listProducts(
    @Query() query: ListProductsQueryDto,
  ): Promise<ApiSuccess<PublicProductDto[]>> {
    const { page, limit, collection, category, productFamily, ...rest } = query;
    const result = await this.products.findMany(
      {
        ...rest,
        collectionSlug: collection,
        categorySlug: category,
        productFamilySlug: productFamily,
      },
      { page, limit },
    );
    return paginated(result.items.map(toPublicProduct), page, limit, result.total);
  }

  @Get('products/:slug')
  @ApiOperation({
    summary: 'Get a product by slug',
    description: 'Full product with media, variants, categories, product families and collections.',
  })
  @ApiParam({ name: 'slug', description: 'Product slug.', example: 'purifying-gel-cleanser' })
  @ApiEnvelopeResponse(PublicProductDto, { description: 'The product.' })
  @ApiErrorResponse(
    404,
    'PRODUCT_NOT_FOUND: no active product has this slug.',
    'PRODUCT_NOT_FOUND',
    'The requested product could not be found.',
  )
  async getProduct(@Param('slug') slug: string): Promise<ApiSuccess<PublicProductDto>> {
    return ok(toPublicProduct(await this.products.findBySlug(slug)));
  }

  @Get('collections')
  @ApiOperation({
    summary: 'List active collections',
    description:
      'Paginated list of active collections, each with its categories and product families.',
  })
  @ApiEnvelopeResponse(PublicCollectionDto, { list: true, description: 'A page of collections.' })
  @ApiErrorResponse(
    400,
    'Invalid or unknown query parameter.',
    'VALIDATION_ERROR',
    'limit must not be greater than 100',
  )
  async listCollections(
    @Query() { page, limit }: PaginationQueryDto,
  ): Promise<ApiSuccess<PublicCollectionDto[]>> {
    const result = await this.collections.findPage(page, limit);
    return paginated(result.items.map(toPublicCollection), page, limit, result.total);
  }

  @Get('collections/:slug')
  @ApiOperation({
    summary: 'Get a collection by slug',
    description: 'A collection with its categories and product families.',
  })
  @ApiParam({ name: 'slug', description: 'Collection slug.', example: 'clean-beauty-skincare' })
  @ApiEnvelopeResponse(PublicCollectionDto, { description: 'The collection.' })
  @ApiErrorResponse(
    404,
    'COLLECTION_NOT_FOUND: no active collection has this slug.',
    'COLLECTION_NOT_FOUND',
    'The requested collection could not be found.',
  )
  async getCollection(@Param('slug') slug: string): Promise<ApiSuccess<PublicCollectionDto>> {
    return ok(toPublicCollection(await this.collections.findBySlug(slug)));
  }

  @Get('categories')
  @ApiOperation({
    summary: 'List active categories',
    description: 'Paginated list of active categories sorted by name, with their collection slug.',
  })
  @ApiEnvelopeResponse(PublicCategoryDto, { list: true, description: 'A page of categories.' })
  @ApiErrorResponse(
    400,
    'Invalid or unknown query parameter.',
    'VALIDATION_ERROR',
    'limit must not be greater than 100',
  )
  async listCategories(
    @Query() { page, limit }: PaginationQueryDto,
  ): Promise<ApiSuccess<PublicCategoryDto[]>> {
    const result = await this.categories.findPage(page, limit);
    return paginated(result.items.map(toPublicCategory), page, limit, result.total);
  }

  @Post('users/me/wishlist')
  @ApiOperation({
    summary: 'Add a product to the key owner wishlist',
    description:
      '"me" is the owner of the API key. Adding a product that is already in the wishlist ' +
      'returns the existing entry.',
  })
  @ApiEnvelopeResponse(PublicWishlistItemDto, { created: true, description: 'The wishlist entry.' })
  @ApiErrorResponse(
    400,
    'Invalid or unknown body property, or productId is not a UUID.',
    'VALIDATION_ERROR',
    'productId must be a UUID',
  )
  @ApiErrorResponse(
    404,
    'PRODUCT_NOT_FOUND: no product has this id.',
    'PRODUCT_NOT_FOUND',
    'The requested product could not be found.',
  )
  async addWishlistItem(
    @Req() req: AuthenticatedRequest,
    @Body() { productId }: AddWishlistItemDto,
  ): Promise<ApiSuccess<PublicWishlistItemDto>> {
    const { id, createdAt } = await this.wishlist.addItem(req.apiKey!.ownerId, productId);
    return ok({ id, productId, createdAt });
  }

  @Delete('users/me/wishlist/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a product from the key owner wishlist',
    description: 'Idempotent: removing a product that is not in the wishlist still returns 204.',
  })
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'Id of the product to remove.',
    example: '6f1c1f0e-5b1a-4b8e-9d0c-2a3f4e5d6c7b',
  })
  @ApiNoContentResponse({ description: 'Removed (or was not in the wishlist).' })
  @ApiErrorResponse(
    400,
    'productId is not a UUID.',
    'VALIDATION_ERROR',
    'Validation failed (uuid is expected)',
  )
  @ApiErrorResponse(
    404,
    'PRODUCT_NOT_FOUND: no product has this id.',
    'PRODUCT_NOT_FOUND',
    'The requested product could not be found.',
  )
  async removeWishlistItem(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    await this.wishlist.removeItem(req.apiKey!.ownerId, productId);
  }

  @Put('users/me/profile')
  @ApiOperation({
    summary: 'Update the key owner bio',
    description:
      'Only the bio can be changed; email and handle are rejected so a leaked key cannot ' +
      'take over the account.',
  })
  @ApiEnvelopeResponse(PublicProfileDto, { description: 'The updated profile.' })
  @ApiErrorResponse(
    400,
    'Missing or too long bio, or an unknown body property (e.g. email, handle).',
    'VALIDATION_ERROR',
    'bio must be shorter than or equal to 500 characters',
  )
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() { bio }: UpdateProfileDto,
  ): Promise<ApiSuccess<PublicProfileDto>> {
    const profile = await this.profiles.updateProfile(req.apiKey!.ownerId, { bio });
    return ok({
      id: profile.id,
      handle: profile.handle,
      name: profile.name,
      bio: profile.bio ?? null,
    });
  }
}
