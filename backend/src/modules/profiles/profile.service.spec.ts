import { NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { ProfileService } from './profile.service';

describe('ProfileService.getProfile', () => {
  const profileUser = {
    id: 'profile-1',
    name: 'Marie Laurent',
    handle: 'marie',
    bio: null,
    status: UserStatus.ACTIVE,
    deletedAt: null,
  };

  const prisma = {
    user: { findUnique: jest.fn() },
    follow: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    wishlist: { findMany: jest.fn() },
  };
  const productsService = { findByIds: jest.fn() };

  let service: ProfileService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(profileUser);
    prisma.follow.count.mockResolvedValue(0);
    prisma.follow.findMany.mockResolvedValue([]);
    prisma.follow.findUnique.mockResolvedValue(null);
    prisma.wishlist.findMany.mockResolvedValue([]);
    productsService.findByIds.mockResolvedValue([]);
    service = new ProfileService(prisma as never, productsService as never);
  });

  describe('isFollowing', () => {
    it('is true when the viewer follows the profile', async () => {
      prisma.follow.findUnique.mockResolvedValue({ followerId: 'viewer-1' });

      const profile = await service.getProfile('marie', 'viewer-1');

      expect(profile.isFollowing).toBe(true);
      expect(prisma.follow.findUnique).toHaveBeenCalledWith({
        where: { followerId_followingId: { followerId: 'viewer-1', followingId: 'profile-1' } },
        select: { followerId: true },
      });
    });

    it('is false when the viewer does not follow the profile', async () => {
      const profile = await service.getProfile('marie', 'viewer-1');

      expect(profile.isFollowing).toBe(false);
    });

    it('is false for an anonymous visitor, without querying the follow relation', async () => {
      const profile = await service.getProfile('marie');

      expect(profile.isFollowing).toBe(false);
      expect(prisma.follow.findUnique).not.toHaveBeenCalled();
    });

    it("is false on the viewer's own profile, without querying the follow relation", async () => {
      const profile = await service.getProfile('marie', 'profile-1');

      expect(profile.isFollowing).toBe(false);
      expect(prisma.follow.findUnique).not.toHaveBeenCalled();
    });

    it('reflects an unfollow on the next call', async () => {
      prisma.follow.findUnique.mockResolvedValueOnce({ followerId: 'viewer-1' });
      prisma.follow.findUnique.mockResolvedValueOnce(null);

      expect((await service.getProfile('marie', 'viewer-1')).isFollowing).toBe(true);
      expect((await service.getProfile('marie', 'viewer-1')).isFollowing).toBe(false);
    });
  });

  describe('unavailable profiles', () => {
    it('throws USER_NOT_FOUND for an unknown handle', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nobody', 'viewer-1')).rejects.toThrow(NotFoundException);
    });

    it('throws USER_NOT_FOUND for a suspended account', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...profileUser, status: UserStatus.SUSPENDED });

      await expect(service.getProfile('marie', 'viewer-1')).rejects.toThrow(NotFoundException);
      expect(prisma.follow.findUnique).not.toHaveBeenCalled();
    });

    it('throws USER_NOT_FOUND for a deleted account', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...profileUser, deletedAt: new Date() });

      await expect(service.getProfile('marie', 'viewer-1')).rejects.toThrow(NotFoundException);
    });
  });
});
