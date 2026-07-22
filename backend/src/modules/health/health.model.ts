import { Field, ObjectType } from '@nestjs/graphql';

// GraphQL object type describing the health response shape.
@ObjectType()
export class HealthStatus {
  @Field()
  status!: string;
}
