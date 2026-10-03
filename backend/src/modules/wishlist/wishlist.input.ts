import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class WishlistItemInput {
  @Field()
  @IsUUID()
  productId!: string;
}
