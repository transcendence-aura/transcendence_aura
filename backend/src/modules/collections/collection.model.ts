import { Field, ObjectType } from '@nestjs/graphql';

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
}
