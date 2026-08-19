import { Field, ObjectType } from '@nestjs/graphql';

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

  @Field(() => [MessageType])
  messages!: MessageType[];
}
