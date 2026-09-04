import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductsService } from '../products/product.service';
import { ProductType } from '../products/product.model';
import { WishlistItemType } from './wishlist.model';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEventType, AnalyticsTargetType } from '../analytics/analytics-event-type.enum';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getWishlist(userId: string): Promise<ProductType[]> {
    const entries = await this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { productId: true },
    });

    return this.productsService.findByIds(entries.map((entry) => entry.productId));
  }

  async addItem(userId: string, productId: string): Promise<WishlistItemType> {
    await this.assertProductExists(productId);
    const item = await this.prisma.wishlist.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    await this.analyticsService.record(AnalyticsEventType.WISHLIST_ITEM_ADDED, userId, {
      type: AnalyticsTargetType.PRODUCT,
      id: productId,
    });

    return item;
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
