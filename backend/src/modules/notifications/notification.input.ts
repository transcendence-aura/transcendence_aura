import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class MarkNotificationReadInput {
  @Field()
  @IsUUID()
  notificationId!: string;
}
