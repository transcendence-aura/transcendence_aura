import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CollectionProductFamilyType {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  name!: string;
}

@ObjectType()
export class CollectionCategoryType {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [CollectionProductFamilyType])
  productFamilies!: CollectionProductFamilyType[];
}

@ObjectType()
export class CollectionsType {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  heroImageUrl!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [CollectionCategoryType])
  categories!: CollectionCategoryType[];
}
