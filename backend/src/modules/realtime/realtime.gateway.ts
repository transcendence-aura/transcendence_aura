import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConversationStatus } from '@prisma/client';
import { TokenService } from '../auth/token.service';
import { PrismaService } from '../../database/prisma.service';
import { ConversationType, MessageType } from '../conversations/conversation.model';
import { NotificationType } from '../notifications/notification.model';
import { CircleFeedItemType } from '../circle-feed/circle-feed.model';

interface JoinConversationPayload {
  conversationId: string;
}

@WebSocketGateway()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  emitNewMessage(conversationId: string, message: MessageType): void {
    this.server.to(`conversation:${conversationId}`).emit('newMessage', {
      conversationId,
      message,
    });
  }

  emitConversationStatusChanged(conversationId: string, status: ConversationStatus): void {
    this.server.to(`conversation:${conversationId}`).emit('conversationStatusChanged', {
      conversationId,
      status,
    });
  }
  emitNewNotification(userId: string, notification: NotificationType): void {
    this.server.to(`user:${userId}`).emit('newNotification', notification);
  }

  // A brand-new conversation's recipient hasn't joined `conversation:${id}` yet
  // (that only happens once they've fetched it), so this goes to their user room
  // instead - same as emitNewNotification.
  emitConversationStarted(recipientId: string, conversation: ConversationType): void {
    this.server.to(`user:${recipientId}`).emit('conversationStarted', conversation);
  }

  emitCircleFeedActivity(followerId: string, item: CircleFeedItemType): void {
    this.server.to(`user:${followerId}`).emit('circleFeedActivity', item);
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth.token as string | undefined;

    if (!token) {
      this.logger.warn(`Connection rejected: no token (${client.id})`);
      client.disconnect();
      return;
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      client.data.userId = payload.sub;
      await client.join(`user:${payload.sub}`);
    } catch {
      this.logger.warn(`Connection rejected: invalid token (${client.id})`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() data: JoinConversationPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userId = client.data.userId as string;

    let conversation: { userOneId: string; userTwoId: string } | null = null;
    try {
      conversation = await this.prisma.conversation.findUnique({
        where: { id: data.conversationId },
        select: { userOneId: true, userTwoId: true },
      });
    } catch {
      conversation = null;
    }

    const isParticipant =
      conversation !== null &&
      (conversation.userOneId === userId || conversation.userTwoId === userId);

    if (!isParticipant) {
      this.logger.warn(
        `Rejected room join: user ${userId} is not a participant of conversation ${data.conversationId}`,
      );
      client.emit('error', { message: 'FORBIDDEN' });
      return;
    }

    await client.join(`conversation:${data.conversationId}`);
  }
}
