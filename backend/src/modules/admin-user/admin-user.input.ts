import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { UserRole, UserStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum AdminUserSortOrder {
  NAME_ASC = 'NAME_ASC',
  NAME_DESC = 'NAME_DESC',
  ROLE_ASC = 'ROLE_ASC',
  ROLE_DESC = 'ROLE_DESC',
  STATUS_ASC = 'STATUS_ASC',
  STATUS_DESC = 'STATUS_DESC',
  JOINED_AT_ASC = 'JOINED_AT_ASC',
  JOINED_AT_DESC = 'JOINED_AT_DESC',
}

registerEnumType(AdminUserSortOrder, { name: 'AdminUserSortOrder' });

@InputType()
export class AdminUserFilterInput {
  @IsOptional()
  @IsEnum(UserRole)
  @Field(() => UserRole, { nullable: true })
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  @Field(() => UserStatus, { nullable: true })
  status?: UserStatus;

  @IsOptional()
  @IsEnum(AdminUserSortOrder)
  @Field(() => AdminUserSortOrder, { nullable: true })
  sort?: AdminUserSortOrder;
}

@InputType()
export class AdminUserPaginationInput {
  @IsOptional()
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page!: number;

  @IsOptional()
  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;
}
