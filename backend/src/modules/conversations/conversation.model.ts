import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ConversationStatus } from '@prisma/client';

registerEnumType(ConversationStatus, { name: 'ConversationStatus' });

@ObjectType()
export class MessageType {
  @Field()
  id!: string;

  @Field({ nullable: true })
  senderId?: string;

  @Field()
  content!: string;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class ConversationType {
  @Field()
  id!: string;

  @Field()
  userOneId!: string;

  @Field()
  userTwoId!: string;

  @Field()
  initiatorId!: string;

  @Field(() => ConversationStatus)
  status!: ConversationStatus;

  @Field(() => [MessageType])
  messages!: MessageType[];
}
