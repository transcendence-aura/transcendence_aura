import { Field, InputType } from '@nestjs/graphql';
import { IsString, Matches } from 'class-validator';

@InputType()
export class VerifyMfaInput {
  @Field()
  @IsString()
  mfaPendingToken!: string;

  @Field()
  @Matches(/^\d{6}$/, {
    message: 'Authentication code must be exactly 6 digits.',
  })
  code!: string;
}
