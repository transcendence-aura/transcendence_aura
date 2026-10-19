import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicMediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional()
  altText?: string;

  @ApiProperty()
  position!: number;

  @ApiProperty()
  isPrimary!: boolean;
}

export class PublicVariantDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  isAvailable!: boolean;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  isOnSale!: boolean;

  @ApiProperty()
  discountPercentage!: number;
}

export class PublicReferenceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}

export class PublicProductDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: [String] })
  badges!: string[];

  @ApiPropertyOptional({ type: PublicMediaDto })
  primaryImage?: PublicMediaDto;

  @ApiPropertyOptional()
  minPrice?: number;

  @ApiProperty({ type: [PublicMediaDto] })
  media!: PublicMediaDto[];

  @ApiProperty({ type: [PublicVariantDto] })
  variants!: PublicVariantDto[];

  @ApiProperty({ type: [PublicReferenceDto] })
  categories!: PublicReferenceDto[];

  @ApiProperty({ type: [PublicReferenceDto] })
  productFamilies!: PublicReferenceDto[];

  @ApiProperty({ type: [PublicReferenceDto] })
  collections!: PublicReferenceDto[];
}

export class PublicCollectionCategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: [PublicReferenceDto] })
  productFamilies!: PublicReferenceDto[];
}

export class PublicCollectionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  heroImageUrl!: string;

  @ApiProperty({ type: [PublicCollectionCategoryDto] })
  categories!: PublicCollectionCategoryDto[];
}

export class PublicCategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  collectionSlug!: string;
}

export class PublicStatusDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'v1' })
  version!: string;
}
