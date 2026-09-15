import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SendMessageInput {
  @Field()
  @IsUUID()
  conversationId!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

@InputType()
export class RespondToConversationInput {
  @Field()
  @IsUUID()
  conversationId!: string;
}
