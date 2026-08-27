import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WishlistItemType } from './wishlist.model';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async addItem(userId: string, productId: string): Promise<WishlistItemType> {
    await this.assertProductExists(productId);
    return this.prisma.wishlist.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
  }

  async removeItem(userId: string, productId: string): Promise<boolean> {
    await this.assertProductExists(productId);
    await this.prisma.wishlist.deleteMany({
      where: { userId, productId },
    });
    return true;
  }

  private async assertProductExists(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }
  }
}
