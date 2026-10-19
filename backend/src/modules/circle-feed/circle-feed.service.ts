import { Injectable, Logger } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProductsService } from '../products/product.service';
import { ProductType } from '../products/product.model';
import { PublicProfileSummaryType } from '../profiles/profile.model';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  CircleFeedActivityType,
  CircleFeedItemType,
  CircleFeedPageType,
} from './circle-feed.model';
import { CircleFeedPaginationInput } from './circle-feed.input';

type RawActivity =
  | { kind: 'NEW_FOLLOW'; id: string; actorId: string; followedUserId: string; createdAt: Date }
  | {
      kind: 'WISHLIST_ITEM_ADDED';
      id: string;
      actorId: string;
      productId: string;
      createdAt: Date;
    };

const EMPTY_PAGE: CircleFeedPageType = { items: [], total: 0, hasNextPage: false };

@Injectable()
export class CircleFeedService {
  private readonly logger = new Logger(CircleFeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async getFeed(
    userId: string,
    pagination: CircleFeedPaginationInput,
  ): Promise<CircleFeedPageType> {
    const followedIds = await this.getFollowedActiveUserIds(userId);

    if (followedIds.length === 0) {
      return EMPTY_PAGE;
    }

    const pageNumber = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    const skip = (pageNumber - 1) * limit;
    const take = skip + limit;

    const [followRows, wishlistRows, followTotal, wishlistTotal] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: { in: followedIds } },
        orderBy: [{ createdAt: 'desc' }, { followerId: 'desc' }, { followingId: 'desc' }],
        take,
        select: { followerId: true, followingId: true, createdAt: true },
      }),
      this.prisma.wishlist.findMany({
        where: { userId: { in: followedIds } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
        select: { id: true, userId: true, productId: true, createdAt: true },
      }),
      this.prisma.follow.count({ where: { followerId: { in: followedIds } } }),
      this.prisma.wishlist.count({ where: { userId: { in: followedIds } } }),
    ]);

    const activities: RawActivity[] = [
      ...followRows.map((f): RawActivity => ({
        kind: 'NEW_FOLLOW',
        id: `follow:${f.followerId}:${f.followingId}`,
        actorId: f.followerId,
        followedUserId: f.followingId,
        createdAt: f.createdAt,
      })),
      ...wishlistRows.map((w): RawActivity => ({
        kind: 'WISHLIST_ITEM_ADDED',
        id: `wishlist:${w.id}`,
        actorId: w.userId,
        productId: w.productId,
        createdAt: w.createdAt,
      })),
    ];

    activities.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1),
    );

    const page = activities.slice(skip, skip + limit);

    const [actorsById, productsById] = await Promise.all([
      this.getActorSummaries(page),
      this.getProductsById(page),
    ]);

    const items = page
      .map((activity) => this.mapActivity(activity, actorsById, productsById))
      .filter((item): item is CircleFeedItemType => item !== null);

    return {
      items,
      total: followTotal + wishlistTotal,
      hasNextPage: skip + page.length < followTotal + wishlistTotal,
    };
  }

  async publishNewFollow(followerId: string, followingId: string, createdAt: Date): Promise<void> {
    try {
      await this.publishActivity(followerId, {
        kind: 'NEW_FOLLOW',
        id: `follow:${followerId}:${followingId}`,
        actorId: followerId,
        followedUserId: followingId,
        createdAt,
      });
    } catch (error) {
      this.logger.warn(
        `Unable to push a NEW_FOLLOW circle feed activity for actor ${followerId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async publishNewWishlistItem(
    wishlistId: string,
    userId: string,
    productId: string,
    createdAt: Date,
  ): Promise<void> {
    try {
      await this.publishActivity(userId, {
        kind: 'WISHLIST_ITEM_ADDED',
        id: `wishlist:${wishlistId}`,
        actorId: userId,
        productId,
        createdAt,
      });
    } catch (error) {
      this.logger.warn(
        `Unable to push a WISHLIST_ITEM_ADDED circle feed activity for actor ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async publishActivity(actorId: string, activity: RawActivity): Promise<void> {
    const followerIds = await this.getFollowerIds(actorId);
    if (followerIds.length === 0) {
      return;
    }

    const [actorsById, productsById] = await Promise.all([
      this.getActorSummaries([activity]),
      this.getProductsById([activity]),
    ]);

    const item = this.mapActivity(activity, actorsById, productsById);
    if (!item) {
      return;
    }

    for (const followerId of followerIds) {
      this.realtimeGateway.emitCircleFeedActivity(followerId, item);
    }
  }

  private async getFollowerIds(actorId: string): Promise<string[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: actorId },
      select: { followerId: true },
    });

    return follows.map((f) => f.followerId);
  }

  private async getFollowedActiveUserIds(userId: string): Promise<string[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId, following: { status: UserStatus.ACTIVE, deletedAt: null } },
      select: { followingId: true },
    });

    return follows.map((f) => f.followingId);
  }

  private async getActorSummaries(
    page: RawActivity[],
  ): Promise<Map<string, PublicProfileSummaryType>> {
    const ids = new Set<string>();
    for (const activity of page) {
      ids.add(activity.actorId);
      if (activity.kind === 'NEW_FOLLOW') {
        ids.add(activity.followedUserId);
      }
    }

    if (ids.size === 0) {
      return new Map();
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true, name: true, handle: true },
    });

    return new Map(users.map((u) => [u.id, u]));
  }

  private async getProductsById(page: RawActivity[]): Promise<Map<string, ProductType>> {
    const productIds = page
      .filter(
        (a): a is Extract<RawActivity, { kind: 'WISHLIST_ITEM_ADDED' }> =>
          a.kind === 'WISHLIST_ITEM_ADDED',
      )
      .map((a) => a.productId);

    const products = await this.productsService.findByIds(productIds);
    return new Map(products.map((p) => [p.id, p]));
  }

  private mapActivity(
    activity: RawActivity,
    actorsById: Map<string, PublicProfileSummaryType>,
    productsById: Map<string, ProductType>,
  ): CircleFeedItemType | null {
    const actor = actorsById.get(activity.actorId);
    if (!actor) {
      return null;
    }

    if (activity.kind === 'NEW_FOLLOW') {
      const followedUser = actorsById.get(activity.followedUserId);
      if (!followedUser) {
        return null;
      }
      return {
        id: activity.id,
        type: CircleFeedActivityType.NEW_FOLLOW,
        actor,
        createdAt: activity.createdAt,
        followedUser,
      };
    }

    const product = productsById.get(activity.productId);
    if (!product) {
      return null;
    }

    return {
      id: activity.id,
      type: CircleFeedActivityType.WISHLIST_ITEM_ADDED,
      actor,
      createdAt: activity.createdAt,
      product,
    };
  }
}
