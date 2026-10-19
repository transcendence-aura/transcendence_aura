import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UserRole, UserStatus } from '@prisma/client';

registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(UserStatus, { name: 'UserStatus' });

@ObjectType()
export class AdminUserType {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  handle!: string;

  @Field(() => UserRole)
  role!: UserRole;

  @Field(() => UserStatus)
  status!: UserStatus;

  @Field()
  joinedAt!: Date;
}

@ObjectType()
export class AdminUserPageType {
  @Field(() => [AdminUserType])
  items!: AdminUserType[];

  @Field(() => Int)
  total!: number;

  @Field()
  hasNextPage!: boolean;
}
