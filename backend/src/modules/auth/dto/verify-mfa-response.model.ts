import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class VerifyMfaResponse {
  @Field()
  accessToken!: string;

  @Field(() => Int)
  expiresIn!: number;
}
