import { Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaService } from '../../database/prisma.service';
import { MediaStorageService } from '../../common/media/media-storage.service';
import { assertValidJpegSquareImage } from '../../common/media/image-validation.util';
import { ALLOWED_IMAGE_MIME_TYPE } from '../../common/media/media.constants';

export interface AvatarFile {
  buffer: Buffer;
  mimeType: string;
}

// Shipped as a build asset (see nest-cli.json's "assets" entry) rather than
// through MediaStorageService - it's a static project file, not user content.
const DEFAULT_AVATAR_PATH = resolve(
  process.cwd(),
  'dist',
  'modules',
  'avatar',
  'assets',
  'default-avatar.jpeg',
);

@Injectable()
export class AvatarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ id: string; updatedAt: Date }> {
    assertValidJpegSquareImage(file.buffer);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: { select: { id: true, url: true } } },
    });
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const { relativePath } = await this.mediaStorage.save(`avatars/${userId}`, file.buffer, {
      visibility: 'private',
    });

    const previousAvatar = user.avatar;
    const media = await this.prisma.$transaction(async (tx) => {
      const created = await tx.media.create({
        data: { url: relativePath, mimeType: ALLOWED_IMAGE_MIME_TYPE, position: 0 },
      });
      await tx.user.update({ where: { id: userId }, data: { avatarId: created.id } });
      if (previousAvatar) {
        await tx.media.delete({ where: { id: previousAvatar.id } });
      }
      return created;
    });

    // Best-effort: the DB is already consistent regardless of this succeeding.
    if (previousAvatar) {
      await this.mediaStorage.removePrivate(previousAvatar.url);
    }

    return { id: media.id, updatedAt: media.updatedAt };
  }

  async getAvatar(userId: string): Promise<AvatarFile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        deletedAt: true,
        avatar: { select: { url: true, mimeType: true } },
      },
    });

    // Suspended/deleted accounts have no visible avatar either, same as the public profile.
    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt !== null) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
    if (!user.avatar) {
      return this.getDefaultAvatar();
    }

    try {
      const buffer = await this.mediaStorage.readPrivate(user.avatar.url);
      return { buffer, mimeType: user.avatar.mimeType ?? ALLOWED_IMAGE_MIME_TYPE };
    } catch {
      // File missing/unreadable on disk despite a DB row referencing it.
      throw new NotFoundException('AVATAR_NOT_FOUND');
    }
  }

  private async getDefaultAvatar(): Promise<AvatarFile> {
    try {
      const buffer = await readFile(DEFAULT_AVATAR_PATH);
      return { buffer, mimeType: ALLOWED_IMAGE_MIME_TYPE };
    } catch {
      throw new NotFoundException('AVATAR_NOT_FOUND');
    }
  }
}
