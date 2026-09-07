import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationModule } from '../notifications/notification.module';
import { ConversationResolver } from './conversation.resolver';
import { ConversationService } from './conversation.service';

@Module({
  imports: [AuthModule, RealtimeModule, AnalyticsModule, NotificationModule],
  providers: [ConversationResolver, ConversationService],
})
export class ConversationModule {}
