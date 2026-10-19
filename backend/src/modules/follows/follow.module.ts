import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CircleFeedModule } from '../circle-feed/circle-feed.module';
import { NotificationModule } from '../notifications/notification.module';
import { FollowResolver } from './follow.resolver';
import { FollowService } from './follow.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AnalyticsModule,
    RealtimeModule,
    CircleFeedModule,
    NotificationModule,
  ],
  providers: [FollowResolver, FollowService],
})
export class FollowModule {}
