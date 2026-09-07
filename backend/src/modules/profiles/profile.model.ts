import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProductType } from '../products/product.model';

@ObjectType()
export class PublicProfileSummaryType {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  handle!: string;
}

@ObjectType()
export class PublicProfileType {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  handle!: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => Int)
  followersCount!: number;

  @Field(() => Int)
  followingCount!: number;

  @Field(() => [PublicProfileSummaryType])
  recentFollows!: PublicProfileSummaryType[];

  @Field(() => [ProductType])
  recentWishlistAdds!: ProductType[];
}
