import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class AdminProductFamilyFilterInput {
  @IsOptional()
  @IsUUID('4')
  @Field({ nullable: true })
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isActive?: boolean;
}
