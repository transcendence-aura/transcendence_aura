import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AnalyticsTimeSeriesPointType {
  @Field()
  bucket!: Date;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class TopWishlistedProductType {
  @Field()
  productId!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => Int)
  wishlistAdds!: number;
}
