import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyCreatedDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({
    description:
      'The raw key value - shown only in this response, never retrievable again. Send it as the X-API-Key header on /api/v1/* requests.',
    example: 'sk_live_yPipsYHJFwzeiZiYZEDNI42vN2q4ZsR4wAWn4IO9gIM',
  })
  key!: string;

  @ApiProperty({ nullable: true, format: 'date-time' })
  expiresAt!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}
