import { Field, Int, ObjectType } from '@nestjs/graphql';

export type LoginResult =
  | {
      requiresMfa: false;
      accessToken: string;
      expiresIn: number;
      refreshToken: string;
      refreshExpiresInMs: number;
    }
  | {
      requiresMfa: true;
      mfaPendingToken: string;
      expiresIn: number;
    };

@ObjectType()
export class LoginResponse {
  @Field()
  requiresMfa!: boolean;

  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  mfaPendingToken?: string;

  @Field(() => Int)
  expiresIn!: number;
}

@ObjectType()
export class RefreshResponse {
  @Field()
  accessToken!: string;
}
