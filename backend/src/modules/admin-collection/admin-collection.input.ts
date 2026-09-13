import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class AdminCollectionFilterInput {
  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isActive?: boolean;
}

