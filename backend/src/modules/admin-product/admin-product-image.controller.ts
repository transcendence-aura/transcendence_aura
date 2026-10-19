import {
  BadRequestException,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ALLOWED_IMAGE_MIME_TYPE,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from '../../common/media/media.constants';
import { ProductMediaType } from '../products/product.model';
import { AdminProductImageService } from './admin-product-image.service';

@Controller('v1/admin/products')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminProductImageController {
  constructor(private readonly adminProductImageService: AdminProductImageService) {}

  @Post(':productId/images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (file.mimetype !== ALLOWED_IMAGE_MIME_TYPE) {
          callback(new BadRequestException('IMAGE_TYPE_NOT_ALLOWED'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ProductMediaType> {
    if (!file) {
      throw new BadRequestException('IMAGE_FILE_REQUIRED');
    }
    return this.adminProductImageService.addImage(productId, file);
  }
}
