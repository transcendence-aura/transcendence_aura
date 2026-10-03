import { Field, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

@InputType()
export class AdminReorderProductImagesInput {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  @Field(() => [String])
  imageIds!: string[];
}
