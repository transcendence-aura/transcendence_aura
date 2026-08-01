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

  @Field(() => [ProductMediaType])
  media!: ProductMediaType[];

  @Field(() => [ProductVariantType])
  variants!: ProductVariantType[];
}
