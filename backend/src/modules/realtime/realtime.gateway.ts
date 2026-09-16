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
import { MessageType } from '../conversations/conversation.model';

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
    this.server.to(`conversation:${conversationId}`).emit('newMessage', message);
  }

  emitConversationStatusChanged(conversationId: string, status: ConversationStatus): void {
    this.server.to(`conversation:${conversationId}`).emit('conversationStatusChanged', {
      conversationId,
      status,
    });
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
