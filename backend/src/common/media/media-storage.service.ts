import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
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

    // Defense in depth: a caller-supplied subdirectory containing "../" must never be able to write outside the uploads root (same check as
    // unlinkSafely(), but throwing - a write can't just silently no-op).
    const dir = resolve(root, subdirectory);
    if (!dir.startsWith(root + sep)) {
      throw new BadRequestException('INVALID_UPLOAD_PATH');
    }
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

  // Reads a file previously saved with visibility: 'private'. relativePath
  // must be a path returned by save() (i.e. server-generated, DB-stored),
  // never taken directly from client input.
  async readPrivate(relativePath: string): Promise<Buffer> {
    const filePath = this.resolveWithinRoot(PRIVATE_UPLOADS_ROOT, relativePath);
    return readFile(filePath);
  }

  // Resolves relativePath against root and rejects anything that would
  // escape it (e.g. via ".." segments), regardless of how relativePath
  // was produced upstream.
  private resolveWithinRoot(root: string, relativePath: string): string {
    const normalized = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    const filePath = resolve(root, normalized);

    if (!filePath.startsWith(root + sep)) {
      throw new Error(`Refused to access a path outside its uploads root: ${relativePath}`);
    }
    return filePath;
  }

  private async unlinkSafely(root: string, relativePath: string): Promise<void> {
    let filePath: string;
    try {
      filePath = this.resolveWithinRoot(root, relativePath);
    } catch {
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
