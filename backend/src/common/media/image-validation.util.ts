import { BadRequestException } from '@nestjs/common';
import { imageSize } from 'image-size';

export function assertValidJpegSquareImage(buffer: Buffer): { width: number; height: number } {
  let dimensions: { width?: number; height?: number; type?: string };

  try {
    dimensions = imageSize(buffer);
  } catch {
    throw new BadRequestException('IMAGE_TYPE_NOT_ALLOWED');
  }

  if (dimensions.type !== 'jpg' || !dimensions.width || !dimensions.height) {
    throw new BadRequestException('IMAGE_TYPE_NOT_ALLOWED');
  }

  if (dimensions.width !== dimensions.height) {
    throw new BadRequestException('IMAGE_MUST_BE_SQUARE');
  }

  return { width: dimensions.width, height: dimensions.height };
}
