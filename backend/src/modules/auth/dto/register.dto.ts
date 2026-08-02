import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RegisterDto {
  @Field()
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @Field()
  @IsString()
  @MinLength(8)
  password!: string;

  @Field()
  @IsString()
  @MaxLength(100)
  name!: string;

  @Field()
  @IsString()
  @MaxLength(30)
  handle!: string;
}
