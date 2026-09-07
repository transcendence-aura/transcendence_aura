import { Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProductsService } from '../products/product.service';
import { ProductType } from '../products/product.model';
import { PublicProfileSummaryType, PublicProfileType } from './profile.model';

const RECENT_ACTIVITY_LIMIT = 5;

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async getProfile(handle: string): Promise<PublicProfileType> {
    const user = await this.prisma.user.findUnique({
      where: { handle },
      select: { id: true, name: true, handle: true, bio: true, status: true, deletedAt: true },
    });

    // Suspended/deleted accounts have no public profile: not found, same as if the handle never existed.
    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt !== null) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const [followersCount, followingCount, recentFollows, recentWishlistAdds] = await Promise.all([
      this.getFollowersCount(user.id),
      this.getFollowingCount(user.id),
      this.getRecentFollows(user.id),
      this.getRecentWishlistAdds(user.id),
    ]);

    return {
      id: user.id,
      name: user.name,
      handle: user.handle,
      bio: user.bio ?? undefined,
      followersCount,
      followingCount,
      recentFollows,
      recentWishlistAdds,
    };
  }

  // Counts are scoped to visible (active, non-deleted) accounts on the other
  // side of the relationship, so they stay consistent with recentFollows
  // filtering out suspended/deleted targets — a raw count would otherwise
  // show e.g. "following: 1" next to an empty list.
  private getFollowersCount(userId: string): Promise<number> {
    return this.prisma.follow.count({
      where: {
        followingId: userId,
        follower: { status: UserStatus.ACTIVE, deletedAt: null },
      },
    });
  }

  private getFollowingCount(userId: string): Promise<number> {
    return this.prisma.follow.count({
      where: {
        followerId: userId,
        following: { status: UserStatus.ACTIVE, deletedAt: null },
      },
    });
  }

  private async getRecentFollows(userId: string): Promise<PublicProfileSummaryType[]> {
    const follows = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
        following: { status: UserStatus.ACTIVE, deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ACTIVITY_LIMIT,
      select: {
        following: { select: { id: true, name: true, handle: true } },
      },
    });

    return follows.map((follow) => follow.following);
  }

  private async getRecentWishlistAdds(userId: string): Promise<ProductType[]> {
    const entries = await this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ACTIVITY_LIMIT,
      select: { productId: true },
    });

    return this.productsService.findByIds(entries.map((entry) => entry.productId));
  }
}
