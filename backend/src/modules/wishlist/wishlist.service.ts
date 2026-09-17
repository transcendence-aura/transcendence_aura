import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProductsService } from '../products/product.service';
import { ProductType } from '../products/product.model';
import { WishlistItemType } from './wishlist.model';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEventType, AnalyticsTargetType } from '../analytics/analytics-event-type.enum';
import { CircleFeedService } from '../circle-feed/circle-feed.service';

const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly analyticsService: AnalyticsService,
    private readonly circleFeedService: CircleFeedService,
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

    let item: WishlistItemType;
    try {
      item = await this.prisma.wishlist.create({ data: { userId, productId } });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        return this.prisma.wishlist.findUniqueOrThrow({
          where: { userId_productId: { userId, productId } },
        });
      }
      throw error;
    }

    await this.analyticsService.record(AnalyticsEventType.WISHLIST_ITEM_ADDED, userId, {
      type: AnalyticsTargetType.PRODUCT,
      id: productId,
    });

    await this.circleFeedService.publishNewWishlistItem(item.id, userId, productId, item.createdAt);

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
