import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ProductType } from '../products/product.model';
import { PublicProfileSummaryType } from '../profiles/profile.model';

export enum CircleFeedActivityType {
  NEW_FOLLOW = 'NEW_FOLLOW',
  WISHLIST_ITEM_ADDED = 'WISHLIST_ITEM_ADDED',
}

registerEnumType(CircleFeedActivityType, { name: 'CircleFeedActivityType' });

@ObjectType()
export class CircleFeedItemType {
  @Field()
  id!: string;

  @Field(() => CircleFeedActivityType)
  type!: CircleFeedActivityType;

  @Field(() => PublicProfileSummaryType)
  actor!: PublicProfileSummaryType;

  @Field()
  createdAt!: Date;

  @Field(() => PublicProfileSummaryType, { nullable: true })
  followedUser?: PublicProfileSummaryType;

  @Field(() => ProductType, { nullable: true })
  product?: ProductType;
}

@ObjectType()
export class CircleFeedPageType {
  @Field(() => [CircleFeedItemType])
  items!: CircleFeedItemType[];

  @Field(() => Int)
  total!: number;

  @Field()
  hasNextPage!: boolean;
}
