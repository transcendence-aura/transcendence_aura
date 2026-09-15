import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TwoFactorSetupResponse {
  @Field()
  provisioningUri!: string;

  @Field()
  qrCode!: string;
}

@ObjectType()
export class TwoFactorConfirmResponse {
  @Field()
  enabled!: boolean;
}
