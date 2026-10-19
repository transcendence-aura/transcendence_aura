import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConversationStatus, NotificationType as NotificationTypeEnum } from '@prisma/client';
import { ConversationService } from './conversation.service';
import { CONVERSATION_REQUEST_MARKER } from '../notifications/notification-markers';

describe('ConversationService.startConversation', () => {
  const prisma = {
    user: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    conversation: { findUnique: jest.fn(), create: jest.fn(), findUniqueOrThrow: jest.fn() },
    follow: { findUnique: jest.fn() },
  };
  const realtimeGateway = { emitConversationStarted: jest.fn() };
  const analyticsService = { record: jest.fn() };
  const notificationService = { create: jest.fn() };

  let service: ConversationService;

  const createdConversation = {
    id: 'conv-1',
    userOneId: 'user-a',
    userTwoId: 'user-b',
    initiatorId: 'user-a',
    status: ConversationStatus.PENDING,
    messages: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ id: 'user-b' });
    prisma.conversation.findUnique.mockResolvedValue(null);
    prisma.follow.findUnique.mockResolvedValue(null);
    prisma.conversation.create.mockResolvedValue(createdConversation);
    service = new ConversationService(
      prisma as never,
      realtimeGateway as never,
      analyticsService as never,
      notificationService as never,
    );
  });

  it('refuses to let a user message themselves', async () => {
    await expect(service.startConversation('user-a', 'user-a')).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('creates a PENDING request when the recipient does not already follow the initiator', async () => {
    const conversation = await service.startConversation('user-a', 'user-b');

    expect(prisma.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ConversationStatus.PENDING }),
      }),
    );
    expect(conversation.status).toBe(ConversationStatus.PENDING);
  });

  it('notifies the recipient of a genuine PENDING request, marked as a conversation request', async () => {
    await service.startConversation('user-a', 'user-b');

    expect(notificationService.create).toHaveBeenCalledWith({
      userId: 'user-b',
      type: NotificationTypeEnum.MESSAGE,
      actorId: 'user-a',
      title: CONVERSATION_REQUEST_MARKER,
    });
  });

  it('auto-accepts when the recipient already follows the initiator - skipping the request entirely', async () => {
    prisma.follow.findUnique.mockResolvedValue({ followerId: 'user-b', followingId: 'user-a' });
    prisma.conversation.create.mockResolvedValue({
      ...createdConversation,
      status: ConversationStatus.ACCEPTED,
    });

    const conversation = await service.startConversation('user-a', 'user-b');

    expect(prisma.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ConversationStatus.ACCEPTED }),
      }),
    );
    expect(conversation.status).toBe(ConversationStatus.ACCEPTED);
  });

  it('does not send a "wants to start a conversation" notification for an auto-accepted conversation', async () => {
    prisma.follow.findUnique.mockResolvedValue({ followerId: 'user-b', followingId: 'user-a' });
    prisma.conversation.create.mockResolvedValue({
      ...createdConversation,
      status: ConversationStatus.ACCEPTED,
    });

    await service.startConversation('user-a', 'user-b');

    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('emits a realtime conversationStarted event to the recipient', async () => {
    await service.startConversation('user-a', 'user-b');

    expect(realtimeGateway.emitConversationStarted).toHaveBeenCalledWith(
      'user-b',
      expect.objectContaining({ id: 'conv-1' }),
    );
  });

  it('returns the existing conversation instead of creating a duplicate when one already exists', async () => {
    const existing = { ...createdConversation, status: ConversationStatus.ACCEPTED };
    prisma.conversation.findUnique.mockResolvedValue(existing);

    const conversation = await service.startConversation('user-a', 'user-b');

    expect(conversation.status).toBe(ConversationStatus.ACCEPTED);
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('refuses to reopen a conversation the recipient declined', async () => {
    prisma.conversation.findUnique.mockResolvedValue({
      ...createdConversation,
      status: ConversationStatus.DECLINED,
    });

    await expect(service.startConversation('user-a', 'user-b')).rejects.toThrow(ForbiddenException);
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });
});

describe('ConversationService.getParticipant', () => {
  const prisma = {
    user: { findUniqueOrThrow: jest.fn() },
  };

  let service: ConversationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConversationService(prisma as never, {} as never, {} as never, {} as never);
  });

  it('includes the handle, so the frontend can link to /profile/<handle>', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 'user-b',
      name: 'Marie',
      handle: 'marie',
      bio: null,
    });

    const participant = await service.getParticipant('user-b');

    expect(participant).toEqual({ id: 'user-b', name: 'Marie', handle: 'marie', bio: undefined });
  });

  it('defaults a null bio to undefined', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 'user-b',
      name: 'Marie',
      handle: 'marie',
      bio: null,
    });

    const participant = await service.getParticipant('user-b');

    expect(participant.bio).toBeUndefined();
  });

  it('keeps a real bio as-is', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 'user-b',
      name: 'Marie',
      handle: 'marie',
      bio: 'Skincare enthusiast',
    });

    const participant = await service.getParticipant('user-b');

    expect(participant.bio).toBe('Skincare enthusiast');
  });
});
