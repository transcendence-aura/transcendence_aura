import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

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

@InputType()
export class ProfileDirectoryInput {
  @IsOptional()
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page!: number;

  @IsOptional()
  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Field({ nullable: true })
  search?: string;
}
