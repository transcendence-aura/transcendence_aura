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

  // Whether the authenticated viewer follows this profile. False for anonymous
  // visitors, invalid tokens, suspended or deleted viewers and the viewer's own profile.
  @Field()
  isFollowing!: boolean;

  @Field(() => [PublicProfileSummaryType])
  recentFollows!: PublicProfileSummaryType[];

  @Field(() => [ProductType])
  recentWishlistAdds!: ProductType[];
}

@ObjectType()
export class ProfileDirectoryEntryType {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  handle!: string;

  @Field({ nullable: true })
  bio?: string;
}

@ObjectType()
export class ProfileDirectoryPageType {
  @Field(() => [ProfileDirectoryEntryType])
  items!: ProfileDirectoryEntryType[];

  @Field(() => Int)
  total!: number;

  @Field()
  hasNextPage!: boolean;
}
