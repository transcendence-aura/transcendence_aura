import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class WishlistItemType {
  @Field()
  id!: string;

  @Field()
  productId!: string;

  @Field()
  createdAt!: Date;
}
