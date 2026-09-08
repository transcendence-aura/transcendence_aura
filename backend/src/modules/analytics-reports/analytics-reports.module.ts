import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsReportsResolver } from './analytics-reports.resolver';
import { AnalyticsReportsService } from './analytics-reports.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AnalyticsReportsResolver, AnalyticsReportsService],
})
export class AnalyticsReportsModule {}
