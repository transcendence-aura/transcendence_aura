import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdminCategoryType {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isActive!: boolean;

  @Field()
  collectionId!: string;
}
