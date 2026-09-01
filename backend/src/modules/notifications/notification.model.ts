import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { NotificationType as NotificationTypeEnum } from '@prisma/client';

// Registered as "NotificationKind" in the GraphQL schema: the ObjectType
// below is itself named NotificationType, and GraphQL type names must be
// unique.
registerEnumType(NotificationTypeEnum, { name: 'NotificationKind' });

@ObjectType()
export class NotificationType {
  @Field()
  id!: string;

  @Field(() => NotificationTypeEnum)
  type!: NotificationTypeEnum;

  @Field()
  userId!: string;

  @Field({ nullable: true })
  actorId?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  body?: string;

  @Field({ nullable: true })
  readAt?: Date;

  @Field()
  createdAt!: Date;
}
