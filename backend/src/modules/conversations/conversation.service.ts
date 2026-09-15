import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationStatus,
  Message,
  NotificationType as NotificationTypeEnum,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationService } from '../notifications/notification.service';
import { ConversationType, MessageType } from './conversation.model';
import { SendMessageInput } from './conversation.input';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEventType, AnalyticsTargetType } from '../analytics/analytics-event-type.enum';

const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

interface ConversationParticipants {
  userOneId: string;
  userTwoId: string;
  initiatorId: string;
  status: ConversationStatus;
}

function mapMessage(message: Message): MessageType {
  return {
    id: message.id,
    senderId: message.senderId ?? undefined,
    content: message.content,
    createdAt: message.createdAt,
  };
}

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationService: NotificationService,
  ) {}

  async findOrCreateConversation(userId: string, otherUserId: string): Promise<ConversationType> {
    if (userId === otherUserId) {
      throw new BadRequestException('CANNOT_MESSAGE_SELF');
    }

    await this.assertUserExists(otherUserId);

    const [userOneId, userTwoId] = [userId, otherUserId].sort();

    const existing = await this.prisma.conversation.findUnique({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (existing) {
      return { ...existing, messages: existing.messages.map(mapMessage) };
    }

    // Skip the pending request entirely when the recipient already follows
    const recipientFollowsInitiator = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: otherUserId, followingId: userId } },
    });
    const status = recipientFollowsInitiator
      ? ConversationStatus.ACCEPTED
      : ConversationStatus.PENDING;

    try {
      const conversation = await this.prisma.conversation.create({
        data: { userOneId, userTwoId, initiatorId: userId, status },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      return { ...conversation, messages: conversation.messages.map(mapMessage) };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        const conversation = await this.prisma.conversation.findUniqueOrThrow({
          where: { userOneId_userTwoId: { userOneId, userTwoId } },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        return { ...conversation, messages: conversation.messages.map(mapMessage) };
      }
      throw error;
    }
  }

  async getMessages(userId: string, conversationId: string): Promise<MessageType[]> {
    await this.assertParticipant(userId, conversationId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(mapMessage);
  }

  async sendMessage(userId: string, input: SendMessageInput): Promise<MessageType> {
    const conversation = await this.assertParticipant(userId, input.conversationId);

    if (conversation.status === ConversationStatus.DECLINED) {
      throw new ForbiddenException('CONVERSATION_DECLINED');
    }

    if (conversation.status === ConversationStatus.PENDING) {
      if (userId !== conversation.initiatorId) {
        // The recipient must accept/decline before they can reply.
        throw new ForbiddenException('CONVERSATION_PENDING_APPROVAL');
      }

      const messagesAlreadySent = await this.prisma.message.count({
        where: { conversationId: input.conversationId, senderId: conversation.initiatorId },
      });

      if (messagesAlreadySent > 0) {
        throw new ForbiddenException('CONVERSATION_MESSAGE_LIMIT_REACHED');
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: userId,
        content: input.content,
      },
    });

    await this.analyticsService.record(AnalyticsEventType.MESSAGE_SENT, userId, {
      type: AnalyticsTargetType.MESSAGE,
      id: message.id,
    });

    const mapped = mapMessage(message);
    this.realtimeGateway.emitNewMessage(input.conversationId, mapped);

    const recipientId =
      conversation.userOneId === userId ? conversation.userTwoId : conversation.userOneId;

    await this.notificationService.create({
      userId: recipientId,
      type: NotificationTypeEnum.MESSAGE,
      actorId: userId,
      body: input.content,
    });

    return mapped;
  }

  private async assertUserExists(userId: string): Promise<void> {
    let user: { id: string } | null = null;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
    } catch {
      user = null;
    }

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
  }

  private async assertParticipant(
    userId: string,
    conversationId: string,
  ): Promise<ConversationParticipants> {
    let conversation: ConversationParticipants | null = null;

    try {
      conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { userOneId: true, userTwoId: true, initiatorId: true, status: true },
      });
    } catch {
      conversation = null;
    }

    const isParticipant =
      conversation !== null &&
      (conversation.userOneId === userId || conversation.userTwoId === userId);

    if (!isParticipant || conversation === null) {
      throw new ForbiddenException('NOT_A_PARTICIPANT');
    }

    return conversation;
  }
}
