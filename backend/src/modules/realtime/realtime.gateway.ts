import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TokenService } from '../auth/token.service';

@WebSocketGateway()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly tokenService: TokenService) {}

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
    } catch {
      this.logger.warn(`Connection rejected: invalid token (${client.id})`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
