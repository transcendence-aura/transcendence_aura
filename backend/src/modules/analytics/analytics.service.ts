import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsEventType, AnalyticsTargetType } from './analytics-event-type.enum';

export interface AnalyticsTarget {
  type: AnalyticsTargetType;
  id: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Never throws: a failure to record an event must never break the action it observes.
  async record(type: AnalyticsEventType, actorId: string, target?: AnalyticsTarget): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventType: type,
          actorId,
          targetType: target?.type,
          targetId: target?.id,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Unable to record analytics event ${type} for actor ${actorId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
