import { Field, InputType } from '@nestjs/graphql';
import { IsString, Matches } from 'class-validator';

@InputType()
export class ConfirmTwoFactorInput {
  @Field()
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Authentication code must be exactly 6 digits.',
  })
  code!: string;
}

@InputType()
export class DisableTwoFactorInput {
  @Field()
  @Matches(/^\d{6}$/, {
    message: 'Authentication code must be exactly 6 digits.',
  })
  code!: string;
}
