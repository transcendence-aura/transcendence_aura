import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

export type MediaVisibility = 'public' | 'private';

export const PUBLIC_UPLOADS_ROOT = resolve(process.cwd(), 'uploads', 'public');

export const PRIVATE_UPLOADS_ROOT = resolve(process.cwd(), 'uploads', 'private');

const PUBLIC_URL_PREFIX = '/api/uploads';

export interface StoredImage {
  visibility: MediaVisibility;
  relativePath: string;
  publicUrl?: string;
}

@Injectable()
export class MediaStorageService {
  private readonly logger = new Logger(MediaStorageService.name);

  save(
    subdirectory: string,
    buffer: Buffer,
    options?: { visibility?: 'public'; extension?: string },
  ): Promise<StoredImage & { visibility: 'public'; publicUrl: string }>;
  save(
    subdirectory: string,
    buffer: Buffer,
    options: { visibility: 'private'; extension?: string },
  ): Promise<StoredImage & { visibility: 'private'; publicUrl?: undefined }>;
  async save(
    subdirectory: string,
    buffer: Buffer,
    options: { visibility?: MediaVisibility; extension?: string } = {},
  ): Promise<StoredImage> {
    const visibility = options.visibility ?? 'public';
    const extension = options.extension ?? 'jpeg';
    const root = visibility === 'public' ? PUBLIC_UPLOADS_ROOT : PRIVATE_UPLOADS_ROOT;

    const dir = join(root, subdirectory);
    await mkdir(dir, { recursive: true });

    const filename = `${randomUUID()}.${extension}`;
    await writeFile(join(dir, filename), buffer);

    const relativePath = `${subdirectory}/${filename}`;
    return {
      visibility,
      relativePath,
      publicUrl: visibility === 'public' ? `${PUBLIC_URL_PREFIX}/${relativePath}` : undefined,
    };
  }

  async remove(publicUrl: string): Promise<void> {
    if (!publicUrl.startsWith(PUBLIC_URL_PREFIX)) {
      return;
    }
    await this.unlinkSafely(PUBLIC_UPLOADS_ROOT, publicUrl.slice(PUBLIC_URL_PREFIX.length));
  }

  async removePrivate(relativePath: string): Promise<void> {
    await this.unlinkSafely(PRIVATE_UPLOADS_ROOT, relativePath);
  }

  private async unlinkSafely(root: string, relativePath: string): Promise<void> {
    const normalized = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    const filePath = resolve(root, normalized);

    if (!filePath.startsWith(root + sep)) {
      this.logger.warn(`Refused to delete a file outside its uploads root: ${relativePath}`);
      return;
    }

    try {
      await unlink(filePath);
    } catch (error: unknown) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') {
        this.logger.warn(`Failed to delete uploaded file ${relativePath}: ${String(error)}`);
      }
    }
  }
}
