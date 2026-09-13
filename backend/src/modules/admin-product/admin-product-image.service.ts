import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MediaStorageService } from '../../common/media/media-storage.service';
import { assertValidJpegSquareImage } from '../../common/media/image-validation.util';
import { ProductsService } from '../products/product.service';
import { ProductMediaType, ProductType } from '../products/product.model';

@Injectable()
export class AdminProductImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  async addImage(productId: string, file: Express.Multer.File): Promise<ProductMediaType> {
    await this.assertProductExists(productId);
    assertValidJpegSquareImage(file.buffer);

    const { publicUrl } = await this.mediaStorage.save(`products/${productId}`, file.buffer);

    const { _max } = await this.prisma.media.aggregate({
      where: { productId },
      _max: { position: true },
    });
    const nextPosition = _max.position === null ? 0 : _max.position + 1;

    const created = await this.prisma.media.create({
      data: { productId, url: publicUrl, mimeType: 'image/jpeg', position: nextPosition },
    });

    return {
      id: created.id,
      url: created.url,
      altText: created.altText ?? undefined,
      position: created.position,
      isPrimary: created.position === 0,
    };
  }

  async reorder(productId: string, imageIds: string[]): Promise<ProductType> {
    await this.assertProductExists(productId);

    const images = await this.prisma.media.findMany({
      where: { productId },
      select: { id: true },
    });
    const currentIds = new Set(images.map((m) => m.id));

    if (imageIds.length !== currentIds.size || new Set(imageIds).size !== imageIds.length) {
      throw new BadRequestException('IMAGE_ORDER_MISMATCH');
    }
    if (!imageIds.every((id) => currentIds.has(id))) {
      throw new BadRequestException('IMAGE_ORDER_MISMATCH');
    }

    await this.prisma.$transaction(
      imageIds.map((id, index) =>
        this.prisma.media.update({ where: { id }, data: { position: index } }),
      ),
    );

    return this.productsService.findById(productId);
  }

  async setPrimary(productId: string, imageId: string): Promise<ProductType> {
    const images = await this.prisma.media.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });

    if (!images.some((m) => m.id === imageId)) {
      throw new NotFoundException('IMAGE_NOT_FOUND');
    }

    const reordered = [imageId, ...images.map((m) => m.id).filter((id) => id !== imageId)];
    return this.reorder(productId, reordered);
  }

  async deleteImage(productId: string, imageId: string): Promise<ProductType> {
    const image = await this.prisma.media.findFirst({ where: { id: imageId, productId } });
    if (!image) {
      throw new NotFoundException('IMAGE_NOT_FOUND');
    }

    await this.prisma.media.delete({ where: { id: imageId } });
    await this.mediaStorage.remove(image.url);

    const remaining = await this.prisma.media.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });
    await this.prisma.$transaction(
      remaining.map((m, index) =>
        this.prisma.media.update({ where: { id: m.id }, data: { position: index } }),
      ),
    );

    return this.productsService.findById(productId);
  }

  private async assertProductExists(productId: string): Promise<void> {
    const exists = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }
  }
}
