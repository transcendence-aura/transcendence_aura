import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ maxLength: 100, example: 'my-integration' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
