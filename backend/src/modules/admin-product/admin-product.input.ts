import { Field, Float, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class AdminCreateProductInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @Field()
  name!: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Field(() => [String], { nullable: true })
  badges?: string[];

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Field(() => [String], { nullable: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Field(() => [String], { nullable: true })
  productFamilyIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Field(() => [String], { nullable: true })
  collectionIds?: string[];
}

@InputType()
export class AdminUpdateProductInput {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @Field({ nullable: true })
  name?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Field(() => [String], { nullable: true })
  badges?: string[];

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Field(() => [String], { nullable: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Field(() => [String], { nullable: true })
  productFamilyIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Field(() => [String], { nullable: true })
  collectionIds?: string[];
}

@InputType()
export class AdminCreateProductVariantInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Field()
  label!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Field(() => Float)
  price!: number;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isOnSale?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Field(() => Float, { nullable: true })
  discountPercentage?: number;
}

@InputType()
export class AdminUpdateProductVariantInput {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Field({ nullable: true })
  label?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Field(() => Float, { nullable: true })
  price?: number;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isOnSale?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Field(() => Float, { nullable: true })
  discountPercentage?: number;
}
