import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConversationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEventType, AnalyticsTargetType } from '../analytics/analytics-event-type.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CircleFeedService } from '../circle-feed/circle-feed.service';

const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

@Injectable()
export class FollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly circleFeedService: CircleFeedService,
  ) {}

  async follow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new BadRequestException('CANNOT_FOLLOW_SELF');
    }

    await this.assertUserExists(followingId);

    let created: { createdAt: Date };
    try {
      created = await this.prisma.follow.create({ data: { followerId, followingId } });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        // Already following: idempotent no-op, no new event.
        return true;
      }
      throw error;
    }

    await this.analyticsService.record(AnalyticsEventType.USER_FOLLOWED, followerId, {
      type: AnalyticsTargetType.USER,
      id: followingId,
    });

    await this.circleFeedService.publishNewFollow(followerId, followingId, created.createdAt);

    await this.unblockDeclinedConversation(followerId, followingId);

    return true;
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
    return true;
  }

  followersCount(userId: string): Promise<number> {
    return this.prisma.follow.count({ where: { followingId: userId } });
  }

  followingCount(userId: string): Promise<number> {
    return this.prisma.follow.count({ where: { followerId: userId } });
  }

  private async unblockDeclinedConversation(
    followerId: string,
    followingId: string,
  ): Promise<void> {
    const [userOneId, userTwoId] = [followerId, followingId].sort();

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        userOneId,
        userTwoId,
        status: ConversationStatus.DECLINED,
        initiatorId: followingId,
      },
      select: { id: true },
    });

    if (!conversation) {
      return;
    }

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: ConversationStatus.ACCEPTED },
    });

    this.realtimeGateway.emitConversationStatusChanged(
      conversation.id,
      ConversationStatus.ACCEPTED,
    );
  }

  private async assertUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
  }
}
