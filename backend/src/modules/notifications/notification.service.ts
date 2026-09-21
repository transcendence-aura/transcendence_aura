import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Notification, NotificationType as NotificationTypeEnum } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationType } from './notification.model';

interface CreateNotificationParams {
  userId: string;
  type: NotificationTypeEnum;
  actorId?: string;
  title?: string;
  body?: string;
}

const TITLE_MAX_LENGTH = 160;
const BODY_MAX_LENGTH = 500;

function mapNotification(notification: Notification): NotificationType {
  return {
    id: notification.id,
    type: notification.type,
    userId: notification.userId,
    actorId: notification.actorId ?? undefined,
    title: notification.title ?? undefined,
    body: notification.body ?? undefined,
    readAt: notification.readAt ?? undefined,
    createdAt: notification.createdAt,
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // Never throws: a failure to record a notification must never break the
  // primary action it observes (same principle as AnalyticsService.record).
  async create(params: CreateNotificationParams): Promise<void> {
    let created: Notification;
    try {
      created = await this.prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          actorId: params.actorId,
          title: params.title?.slice(0, TITLE_MAX_LENGTH),
          body: params.body?.slice(0, BODY_MAX_LENGTH),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Unable to create a ${params.type} notification for user ${params.userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return;
    }

    try {
      this.realtimeGateway.emitNewNotification(params.userId, mapNotification(created));
    } catch (error) {
      this.logger.warn(
        `Unable to push notification ${created.id} to user ${params.userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getActor(actorId: string): Promise<{ id: string; name: string } | null> {
    return this.prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, name: true },
    });
  }

  async list(userId: string, unreadOnly?: boolean): Promise<NotificationType[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map(mapNotification);
  }

  async markRead(userId: string, notificationId: string): Promise<NotificationType> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('NOTIFICATION_NOT_FOUND');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return mapNotification(updated);
  }

  async markAllRead(userId: string): Promise<number> {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return count;
  }
}
