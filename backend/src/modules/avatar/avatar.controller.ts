import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ALLOWED_IMAGE_MIME_TYPE,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from '../../common/media/media.constants';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { AvatarService } from './avatar.service';

// Any authenticated user (no @Roles) - viewing avatars only requires being
// logged in, changing one is further restricted to the caller's own id below.
@Controller('v1/users')
@UseGuards(RolesGuard)
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Post('me/avatar')
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
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ id: string; updatedAt: Date }> {
    if (!req.userId) {
      throw new UnauthorizedException();
    }
    if (!file) {
      throw new BadRequestException('IMAGE_FILE_REQUIRED');
    }
    return this.avatarService.uploadAvatar(req.userId, file);
  }

  @Get(':userId/avatar')
  async getAvatar(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const avatar = await this.avatarService.getAvatar(userId);
    res.set('Cache-Control', 'private, no-store');
    res.type(avatar.mimeType).send(avatar.buffer);
  }
}
