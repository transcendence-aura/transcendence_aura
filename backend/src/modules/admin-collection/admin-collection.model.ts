import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdminCollectionType {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  heroImageUrl!: string;

  @Field()
  isActive!: boolean;
}
