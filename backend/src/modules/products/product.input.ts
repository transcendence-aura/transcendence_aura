import { InputType, Field, Float, Int, registerEnumType } from '@nestjs/graphql';
import { IsInt, IsOptional, Min, Max, IsEnum } from 'class-validator';

export enum PriceSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

registerEnumType(PriceSortOrder, { name: 'PriceSortOrder' });

@InputType()
export class ProductsFilterInput {
  @IsOptional()
  @Field({ nullable: true })
  collectionSlug?: string;

  @IsOptional()
  @Field({ nullable: true })
  categorySlug?: string;

  @IsOptional()
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
  @Field({ nullable: true })
  badge?: string;

  @IsOptional()
  @IsEnum(PriceSortOrder)
  @Field(() => PriceSortOrder, { nullable: true })
  sortByPrice?: PriceSortOrder;
}

@InputType()
export class ProductPaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page!: number;

  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;
}
