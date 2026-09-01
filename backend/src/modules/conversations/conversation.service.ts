import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Message, NotificationType as NotificationTypeEnum } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationService } from '../notifications/notification.service';
import { ConversationType, MessageType } from './conversation.model';
import { SendMessageInput } from './conversation.input';

interface ConversationParticipants {
  userOneId: string;
  userTwoId: string;
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
    private readonly notificationService: NotificationService,
  ) {}

  async findOrCreateConversation(userId: string, otherUserId: string): Promise<ConversationType> {
    if (userId === otherUserId) {
      throw new BadRequestException('CANNOT_MESSAGE_SELF');
    }

    let otherUser: { id: string } | null = null;
    try {
      otherUser = await this.prisma.user.findUnique({
        where: { id: otherUserId },
        select: { id: true },
      });
    } catch {
      otherUser = null;
    }

    if (!otherUser) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    // TODO(AUR-94): check the follow relationship between userId and otherUserId before creating a conversation, once the backend
    const [userOneId, userTwoId] = [userId, otherUserId].sort();

    const conversation = await this.prisma.conversation.upsert({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
      create: { userOneId, userTwoId },
      update: {},
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return { ...conversation, messages: conversation.messages.map(mapMessage) };
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

    const message = await this.prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: userId,
        content: input.content,
      },
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

  private async assertParticipant(
    userId: string,
    conversationId: string,
  ): Promise<ConversationParticipants> {
    let conversation: ConversationParticipants | null = null;

    try {
      conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { userOneId: true, userTwoId: true },
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
