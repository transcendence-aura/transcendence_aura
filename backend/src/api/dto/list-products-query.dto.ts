import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ProductSortOrder } from '../../modules/products/product.input';
import { PaginationQueryDto } from './pagination-query.dto';

const toOptionalNumber = ({ value }: { value: unknown }) =>
  value === '' || value === undefined ? undefined : Number(value);

export class ListProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Only products in the collection with this slug.',
    example: 'clean-beauty-skincare',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  collection?: string;

  @ApiPropertyOptional({
    description: 'Only products in the category with this slug.',
    example: 'face-care',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  category?: string;

  @ApiPropertyOptional({
    description: 'Only products in the product family with this slug.',
    example: 'cleanser',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  productFamily?: string;

  @ApiPropertyOptional({
    minimum: 0,
    description: 'Only products with an available variant priced at least this much.',
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    minimum: 0,
    description:
      'Only products with an available variant priced at most this much. Must not be below minPrice.',
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'When true, only products with at least one available variant.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  onlyAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Only products carrying this badge.', example: 'new' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  badge?: string;

  @ApiPropertyOptional({
    enum: ProductSortOrder,
    description: 'Sort order. Defaults to relevance when searching, otherwise oldest first.',
  })
  @IsOptional()
  @IsEnum(ProductSortOrder)
  sort?: ProductSortOrder;

  @ApiPropertyOptional({
    description: 'Full-text search on name and description (accent-insensitive, prefix match).',
    example: 'cleanser',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
