import { NotFoundException } from '@nestjs/common';
import { NotificationType as NotificationTypeEnum } from '@prisma/client';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const prisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const realtimeGateway = {
    emitNewNotification: jest.fn(),
  };

  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService(prisma as never, realtimeGateway as never);
  });

  describe('create', () => {
    it('persists a notification with the given fields', async () => {
      prisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        type: NotificationTypeEnum.MESSAGE,
        userId: 'user-2',
        actorId: 'user-1',
        title: null,
        body: 'hello',
        readAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      await service.create({
        userId: 'user-2',
        type: NotificationTypeEnum.MESSAGE,
        actorId: 'user-1',
        body: 'hello',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-2',
          type: NotificationTypeEnum.MESSAGE,
          actorId: 'user-1',
          body: 'hello',
        }),
      });
    });

    it('pushes the created notification to the owner over the realtime gateway', async () => {
      prisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        type: NotificationTypeEnum.MESSAGE,
        userId: 'user-2',
        actorId: 'user-1',
        title: null,
        body: 'hello',
        readAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      await service.create({
        userId: 'user-2',
        type: NotificationTypeEnum.MESSAGE,
        actorId: 'user-1',
        body: 'hello',
      });

      expect(realtimeGateway.emitNewNotification).toHaveBeenCalledWith(
        'user-2',
        expect.objectContaining({ id: 'notif-1', userId: 'user-2', body: 'hello' }),
      );
    });

    it('never throws: a database failure is logged and swallowed, not propagated to the caller', async () => {
      prisma.notification.create.mockRejectedValue(new Error('connection reset'));

      await expect(
        service.create({ userId: 'user-2', type: NotificationTypeEnum.MESSAGE, body: 'hello' }),
      ).resolves.toBeUndefined();
      expect(realtimeGateway.emitNewNotification).not.toHaveBeenCalled();
    });

    it('never throws: a realtime push failure is logged and swallowed - the notification was already persisted', async () => {
      prisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        type: NotificationTypeEnum.MESSAGE,
        userId: 'user-2',
        actorId: 'user-1',
        title: null,
        body: 'hello',
        readAt: null,
        createdAt: new Date(),
      });
      realtimeGateway.emitNewNotification.mockImplementation(() => {
        throw new Error('socket server not ready');
      });

      await expect(
        service.create({ userId: 'user-2', type: NotificationTypeEnum.MESSAGE, body: 'hello' }),
      ).resolves.toBeUndefined();
    });

    it('truncates an over-long body to the database column limit (500 chars)', async () => {
      const longBody = 'a'.repeat(600);
      prisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        type: NotificationTypeEnum.MESSAGE,
        userId: 'user-2',
        actorId: 'user-1',
        title: null,
        body: 'a'.repeat(500),
        readAt: null,
        createdAt: new Date(),
      });

      await service.create({
        userId: 'user-2',
        type: NotificationTypeEnum.MESSAGE,
        body: longBody,
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ body: 'a'.repeat(500) }),
      });
    });

    it('truncates an over-long title to the database column limit (160 chars)', async () => {
      const longTitle = 'b'.repeat(200);
      prisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        type: NotificationTypeEnum.SYSTEM,
        userId: 'user-2',
        actorId: null,
        title: 'b'.repeat(160),
        body: null,
        readAt: null,
        createdAt: new Date(),
      });

      await service.create({
        userId: 'user-2',
        type: NotificationTypeEnum.SYSTEM,
        title: longTitle,
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ title: 'b'.repeat(160) }),
      });
    });
  });

  describe('list', () => {
    it('scopes the query to the given user and orders newest first', async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      await service.list('user-2');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-2' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('filters to unread only when unreadOnly is true', async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      await service.list('user-2', true);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-2', readAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('markRead', () => {
    it('throws NotFoundException when the notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markRead('user-2', 'missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException (not Forbidden) when the notification belongs to someone else - never reveals it exists', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'someone-else',
      });

      await expect(service.markRead('user-2', 'notif-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('marks the notification read when it belongs to the caller', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'notif-1', userId: 'user-2' });
      prisma.notification.update.mockResolvedValue({
        id: 'notif-1',
        type: NotificationTypeEnum.MESSAGE,
        userId: 'user-2',
        actorId: null,
        title: null,
        body: null,
        readAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const result = await service.markRead('user-2', 'notif-1');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { readAt: expect.any(Date) },
      });
      expect(result.readAt).toBeInstanceOf(Date);
    });
  });

  describe('markAllRead', () => {
    it('updates only the unread notifications for that user and returns the count', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const count = await service.markAllRead('user-2');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-2', readAt: null },
        data: { readAt: expect.any(Date) },
      });
      expect(count).toBe(3);
    });

    it('returns 0 without error when there is nothing unread', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.markAllRead('user-2')).resolves.toBe(0);
    });
  });
});
