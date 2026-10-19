import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AnalyticsService } from './analytics.service';

// Global: AnalyticsService is called from unrelated feature modules (auth,
// products, wishlist, conversations, ...) that have no other reason to
// depend on each other.
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
