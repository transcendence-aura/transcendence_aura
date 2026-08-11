import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductMediaType {
  @Field()
  id!: string;

  @Field()
  url!: string;

  @Field({ nullable: true })
  altText?: string;

  @Field(() => Int)
  position!: number;

  @Field()
  isPrimary!: boolean;
}

@ObjectType()
export class ProductVariantType {
  @Field()
  id!: string;

  @Field()
  label!: string;

  @Field()
  isAvailable!: boolean;

  @Field(() => Float)
  price!: number;

  @Field()
  isOnSale!: boolean;

  @Field(() => Float)
  discountPercentage!: number; // Decimal(5,2) — two decimal places, same precision as price
}

@ObjectType()
export class ProductCollectionType {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  name!: string;
}

@ObjectType()
export class ProductCategoryType {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  name!: string;
}

@ObjectType()
export class ProductFamilyType {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  name!: string;
}

@ObjectType()
export class ProductType {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String])
  badges!: string[];

  @Field(() => ProductMediaType, { nullable: true })
  primaryImage?: ProductMediaType;

  @Field(() => Float, { nullable: true })
  minPrice?: number;

  @Field(() => [ProductMediaType])
  media!: ProductMediaType[];

  @Field(() => [ProductVariantType])
  variants!: ProductVariantType[];

  @Field(() => [ProductCategoryType])
  categories!: ProductCategoryType[];

  @Field(() => [ProductFamilyType])
  productFamilies!: ProductFamilyType[];

  @Field(() => [ProductCollectionType])
  collections!: ProductCollectionType[];
}

@ObjectType()
export class ProductPageType {
  @Field(() => [ProductType])
  items!: ProductType[];

  @Field(() => Int)
  total!: number;

  @Field()
  hasNextPage!: boolean;
}
