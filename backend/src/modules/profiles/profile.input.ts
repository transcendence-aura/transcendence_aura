import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

@InputType()
export class UpdateProfileInput {
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  @Field({ nullable: true })
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'handle must contain only lowercase letters, numbers, hyphens and underscores',
  })
  @Field({ nullable: true })
  handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Field({ nullable: true })
  bio?: string;
}
