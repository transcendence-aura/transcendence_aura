import { Controller, Get, Param, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CategoriesService } from '../modules/categories/category.service';
import { CollectionsService } from '../modules/collections/collection.service';
import { ProductsService } from '../modules/products/product.service';
import { ApiExceptionFilter } from './api-exception.filter';
import type { ApiSuccess } from './api-response';
import { ApiEnvelopeResponse, ApiErrorDto, ok, paginated, slicePage } from './api-response';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import {
  PublicCategoryDto,
  PublicCollectionDto,
  PublicProductDto,
  PublicStatusDto,
} from './dto/public-catalogue.dto';
import { toPublicCategory, toPublicCollection, toPublicProduct } from './public-catalogue.mapper';

// Controller path is 'v1', not 'api/v1': nginx's `location /api/` strips
// the /api/ prefix before proxying to the backend (see nginx/nginx.conf),
// so a client-facing /api/v1/status maps to this app's /v1/status - same
// convention already used by AvatarController and AdminProductImageController.
@ApiTags('Public API')
@ApiSecurity('ApiKeyAuth')
@ApiResponse({ status: 401, type: ApiErrorDto })
@Controller('v1')
@UseGuards(ApiKeyGuard)
@UseFilters(ApiExceptionFilter)
export class ApiController {
  constructor(
    private readonly products: ProductsService,
    private readonly collections: CollectionsService,
    private readonly categories: CategoriesService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Public API status' })
  @ApiEnvelopeResponse(PublicStatusDto)
  status(): ApiSuccess<PublicStatusDto> {
    return ok({ status: 'ok', version: 'v1' });
  }

  @Get('products')
  @ApiOperation({ summary: 'List active products' })
  @ApiEnvelopeResponse(PublicProductDto, { list: true })
  @ApiResponse({ status: 400, type: ApiErrorDto })
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
  @ApiOperation({ summary: 'Get a product by slug' })
  @ApiEnvelopeResponse(PublicProductDto)
  @ApiResponse({ status: 404, type: ApiErrorDto })
  async getProduct(@Param('slug') slug: string): Promise<ApiSuccess<PublicProductDto>> {
    return ok(toPublicProduct(await this.products.findBySlug(slug)));
  }

  @Get('collections')
  @ApiOperation({ summary: 'List active collections' })
  @ApiEnvelopeResponse(PublicCollectionDto, { list: true })
  @ApiResponse({ status: 400, type: ApiErrorDto })
  async listCollections(
    @Query() { page, limit }: PaginationQueryDto,
  ): Promise<ApiSuccess<PublicCollectionDto[]>> {
    const all = await this.collections.findAll();
    return slicePage(all.map(toPublicCollection), page, limit);
  }

  @Get('collections/:slug')
  @ApiOperation({ summary: 'Get a collection by slug' })
  @ApiEnvelopeResponse(PublicCollectionDto)
  @ApiResponse({ status: 404, type: ApiErrorDto })
  async getCollection(@Param('slug') slug: string): Promise<ApiSuccess<PublicCollectionDto>> {
    return ok(toPublicCollection(await this.collections.findBySlug(slug)));
  }

  @Get('categories')
  @ApiOperation({ summary: 'List active categories' })
  @ApiEnvelopeResponse(PublicCategoryDto, { list: true })
  @ApiResponse({ status: 400, type: ApiErrorDto })
  async listCategories(
    @Query() { page, limit }: PaginationQueryDto,
  ): Promise<ApiSuccess<PublicCategoryDto[]>> {
    const all = await this.categories.findAll();
    return slicePage(all.map(toPublicCategory), page, limit);
  }
}
