import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ServiceHealth {
  @Field()
  name!: string;

  @Field()
  up!: boolean;

  @Field(() => Int)
  latencyMs!: number;
}

// Overall status is "ok" only when every checked service is up.
@ObjectType()
export class HealthStatus {
  @Field()
  status!: string;

  @Field(() => [ServiceHealth])
  services!: ServiceHealth[];

  @Field()
  checkedAt!: Date;
}
