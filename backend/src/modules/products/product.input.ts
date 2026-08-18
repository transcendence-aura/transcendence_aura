import { InputType, Field, Float, Int, registerEnumType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  IsEnum,
} from 'class-validator';

export enum ProductSortOrder {
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  NEWEST = 'NEWEST',
  POPULARITY = 'POPULARITY',
}

registerEnumType(ProductSortOrder, { name: 'ProductSortOrder' });

@InputType()
export class ProductsFilterInput {
  @IsOptional()
  @MaxLength(200)
  @Field({ nullable: true })
  collectionSlug?: string;

  @IsOptional()
  @MaxLength(200)
  @Field({ nullable: true })
  categorySlug?: string;

  @IsOptional()
  @MaxLength(200)
  @Field({ nullable: true })
  productFamilySlug?: string;

  @IsOptional()
  @Min(0)
  @Field(() => Float, { nullable: true })
  minPrice?: number;

  @IsOptional()
  @Min(0)
  @Field(() => Float, { nullable: true })
  maxPrice?: number;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  onlyAvailable?: boolean;

  @IsOptional()
  @MaxLength(200)
  @Field({ nullable: true })
  badge?: string;

  @IsOptional()
  @IsEnum(ProductSortOrder)
  @Field(() => ProductSortOrder, { nullable: true })
  sort?: ProductSortOrder;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Field({ nullable: true })
  search?: string;
}

@InputType()
export class ProductPaginationInput {
  @IsOptional()
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page!: number;

  @IsOptional()
  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;
}
