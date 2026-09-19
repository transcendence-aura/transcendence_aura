import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class AdminCategoryFilterInput {
  @IsOptional()
  @IsUUID('4')
  @Field({ nullable: true })
  collectionId?: string;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isActive?: boolean;
}
