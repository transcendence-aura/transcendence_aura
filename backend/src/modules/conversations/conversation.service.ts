import {
  BadRequestException,
  ConflictException,
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
import { CONVERSATION_REQUEST_MARKER } from '../notifications/notification-markers';
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

function lastActivity(conversation: { createdAt: Date; messages: Message[] }): Date {
  const lastMessage = conversation.messages.at(-1);
  return lastMessage ? lastMessage.createdAt : conversation.createdAt;
}

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationService: NotificationService,
  ) {}

  async getConversation(userId: string, otherUserId: string): Promise<ConversationType | null> {
    await this.assertValidOtherUser(userId, otherUserId);

    const [userOneId, userTwoId] = [userId, otherUserId].sort();
    const conversation = await this.findConversationRow(userOneId, userTwoId);

    if (!conversation) {
      return null;
    }

    return { ...conversation, messages: conversation.messages.map(mapMessage) };
  }

  async startConversation(userId: string, otherUserId: string): Promise<ConversationType> {
    await this.assertValidOtherUser(userId, otherUserId);

    const [userOneId, userTwoId] = [userId, otherUserId].sort();

    const existing = await this.findConversationRow(userOneId, userTwoId);

    if (existing) {
      if (existing.status === ConversationStatus.DECLINED) {
        throw new ForbiddenException('CONVERSATION_DECLINED');
      }
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

      const mapped = { ...conversation, messages: conversation.messages.map(mapMessage) };

      // Only a genuine PENDING request needs a "wants to start a conversation"
      // notification - when the recipient already follows the initiator this
      // conversation is auto-ACCEPTED above, and that notification text would
      // be misleading (nothing is actually awaiting their response).
      // NotificationService.create never throws, so this isn't awaited.
      if (status === ConversationStatus.PENDING) {
        void this.notificationService.create({
          userId: otherUserId,
          type: NotificationTypeEnum.MESSAGE,
          actorId: userId,
          title: CONVERSATION_REQUEST_MARKER,
        });
      }

      // Emit only the declared ConversationType shape - `conversation` also
      // carries raw Prisma columns (e.g. userOneDeletedAt) that GraphQL would
      // normally strip, but socket.io has no schema to filter against.
      this.realtimeGateway.emitConversationStarted(otherUserId, {
        id: mapped.id,
        userOneId: mapped.userOneId,
        userTwoId: mapped.userTwoId,
        initiatorId: mapped.initiatorId,
        status: mapped.status,
        messages: mapped.messages,
      });
      return mapped;
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

  async getParticipant(userId: string): Promise<{ id: string; name: string; bio?: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true, bio: true },
    });

    return { id: user.id, name: user.name, bio: user.bio ?? undefined };
  }

  async listConversations(userId: string): Promise<ConversationType[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          {
            status: ConversationStatus.ACCEPTED,
            OR: [{ userOneId: userId }, { userTwoId: userId }],
          },
          {
            status: ConversationStatus.PENDING,
            initiatorId: userId,
          },
        ],
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return conversations
      .sort((a, b) => lastActivity(b).getTime() - lastActivity(a).getTime())
      .map((conversation) => ({
        ...conversation,
        messages: conversation.messages.map(mapMessage),
      }));
  }

  async listPendingConversations(userId: string): Promise<ConversationType[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        status: ConversationStatus.PENDING,
        initiatorId: { not: userId },
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map(mapMessage),
    }));
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

    // A PENDING conversation's first (and only possible, per the guard above)
    // message from the initiator already triggered a "wants to start a
    // conversation" notification in startConversation - sending a second
    // "sent you a message" notification for the same event is redundant.
    if (conversation.status !== ConversationStatus.PENDING) {
      await this.notificationService.create({
        userId: recipientId,
        type: NotificationTypeEnum.MESSAGE,
        actorId: userId,
        body: input.content,
      });
    }

    return mapped;
  }

  async acceptConversation(userId: string, conversationId: string): Promise<ConversationType> {
    return this.respondToConversation(userId, conversationId, ConversationStatus.ACCEPTED);
  }

  async declineConversation(userId: string, conversationId: string): Promise<ConversationType> {
    return this.respondToConversation(userId, conversationId, ConversationStatus.DECLINED);
  }

  private async respondToConversation(
    userId: string,
    conversationId: string,
    nextStatus: ConversationStatus,
  ): Promise<ConversationType> {
    const conversation = await this.assertParticipant(userId, conversationId);

    if (userId === conversation.initiatorId) {
      // The initiator sent the request - only the other participant can respond to it.
      throw new ForbiddenException('ONLY_RECIPIENT_CAN_RESPOND');
    }

    if (conversation.status !== ConversationStatus.PENDING) {
      throw new ConflictException('CONVERSATION_NOT_PENDING');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: nextStatus },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    this.realtimeGateway.emitConversationStatusChanged(conversationId, updated.status);

    return { ...updated, messages: updated.messages.map(mapMessage) };
  }

  private async assertValidOtherUser(userId: string, otherUserId: string): Promise<void> {
    if (userId === otherUserId) {
      throw new BadRequestException('CANNOT_MESSAGE_SELF');
    }

    await this.assertUserExists(otherUserId);
  }

  private findConversationRow(userOneId: string, userTwoId: string) {
    return this.prisma.conversation.findUnique({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
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
