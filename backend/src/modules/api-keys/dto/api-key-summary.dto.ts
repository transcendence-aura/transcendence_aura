import { ApiProperty } from '@nestjs/swagger';

class ApiKeyOwnerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  handle!: string;

  @ApiProperty()
  email!: string;
}

export class ApiKeySummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: [String] })
  scopes!: string[];

  @ApiProperty({ nullable: true, format: 'date-time' })
  expiresAt!: Date | null;

  @ApiProperty({ nullable: true, format: 'date-time' })
  lastUsedAt!: Date | null;

  @ApiProperty()
  isRevoked!: boolean;

  @ApiProperty({ nullable: true, format: 'date-time' })
  revokedAt!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: ApiKeyOwnerDto })
  owner!: ApiKeyOwnerDto;
}
