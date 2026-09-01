import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationType as NotificationTypeEnum } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

  async create(params: CreateNotificationParams): Promise<NotificationType> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        actorId: params.actorId,
        title: params.title?.slice(0, TITLE_MAX_LENGTH),
        body: params.body?.slice(0, BODY_MAX_LENGTH),
      },
    });

    return mapNotification(notification);
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
