import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

const PROFILE_BIO_MAX_LENGTH = 500;

export class AddWishlistItemDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Id of the product to add.',
    example: '6f1c1f0e-5b1a-4b8e-9d0c-2a3f4e5d6c7b',
  })
  @IsUUID()
  productId!: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    maxLength: PROFILE_BIO_MAX_LENGTH,
    description:
      'New bio, replacing the current one (an empty string sets an empty bio). ' +
      'No other profile field can be changed.',
    example: 'Skincare enthusiast.',
  })
  @IsString()
  @MaxLength(PROFILE_BIO_MAX_LENGTH)
  bio!: string;
}

export class PublicWishlistItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class PublicProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  handle!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  bio!: string | null;
}
