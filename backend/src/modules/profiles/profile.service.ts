import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProductsService } from '../products/product.service';
import { ProductType } from '../products/product.model';
import { UserType } from '../auth/auth.model';
import { ProfileDirectoryInput, UpdateProfileInput } from './profile.input';
import {
  ProfileDirectoryPageType,
  PublicProfileSummaryType,
  PublicProfileType,
} from './profile.model';

const RECENT_ACTIVITY_LIMIT = 5;
const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async getProfile(handle: string, viewerId: string): Promise<PublicProfileType> {
    const user = await this.prisma.user.findUnique({
      where: { handle },
      select: { id: true, name: true, handle: true, bio: true, status: true, deletedAt: true },
    });

    // Suspended/deleted accounts have no public profile: not found, same as if the handle never existed.
    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt !== null) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const [followersCount, followingCount, isFollowing, recentFollows, recentWishlistAdds] =
      await Promise.all([
        this.getFollowersCount(user.id),
        this.getFollowingCount(user.id),
        this.isFollowedBy(viewerId, user.id),
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
      isFollowing,
      recentFollows,
      recentWishlistAdds,
    };
  }

  async listProfiles(
    input: ProfileDirectoryInput,
    viewerId: string,
  ): Promise<ProfileDirectoryPageType> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const search = input.search?.trim();

    const where: Prisma.UserWhereInput = {
      status: UserStatus.ACTIVE,
      deletedAt: null,
      id: { not: viewerId },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { handle: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, name: true, handle: true, bio: true },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((user) => ({ ...user, bio: user.bio ?? undefined })),
      total,
      hasNextPage: page * limit < total,
    };
  }

  // The profile owner never "follows" their own profile: skip the query.
  // Same visibility rule as followersCount: a suspended or deleted viewer does not count
  // as a follower, so a token that is still valid for a few minutes must not show them as one.
  private async isFollowedBy(viewerId: string, profileId: string): Promise<boolean> {
    if (viewerId === profileId) {
      return false;
    }

    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId: viewerId,
        followingId: profileId,
        follower: { status: UserStatus.ACTIVE, deletedAt: null },
      },
      select: { followerId: true },
    });

    return follow !== null;
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

  // email/handle/bio are the only self-editable fields - name and avatar are out of scope here.
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserType> {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, handle: true },
    });

    if (!current) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const normalizedEmail = input.email ? input.email.trim().toLowerCase() : undefined;
    const normalizedHandle = input.handle ? input.handle.trim() : undefined;

    if (normalizedEmail !== undefined && normalizedEmail !== current.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (emailTaken) {
        throw new BadRequestException('EMAIL_UNAVAILABLE');
      }
    }

    if (normalizedHandle !== undefined && normalizedHandle !== current.handle) {
      const handleTaken = await this.prisma.user.findUnique({
        where: { handle: normalizedHandle },
        select: { id: true },
      });
      if (handleTaken) {
        throw new ConflictException('USERNAME_TAKEN');
      }
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: normalizedEmail,
          handle: normalizedHandle,
          bio: input.bio,
        },
        select: { id: true, name: true, email: true, handle: true, bio: true },
      });

      return { ...updated, bio: updated.bio ?? undefined };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        if (normalizedEmail !== undefined) {
          throw new BadRequestException('EMAIL_UNAVAILABLE');
        }
        if (normalizedHandle !== undefined) {
          throw new ConflictException('USERNAME_TAKEN');
        }
      }
      throw error;
    }
  }
}
