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
    follow: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    wishlist: { findMany: jest.fn() },
  };
  const productsService = { findByIds: jest.fn() };

  let service: ProfileService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(profileUser);
    prisma.follow.count.mockResolvedValue(0);
    prisma.follow.findMany.mockResolvedValue([]);
    prisma.follow.findFirst.mockResolvedValue(null);
    prisma.wishlist.findMany.mockResolvedValue([]);
    productsService.findByIds.mockResolvedValue([]);
    service = new ProfileService(prisma as never, productsService as never);
  });

  describe('isFollowing', () => {
    it('is true when the viewer follows the profile', async () => {
      prisma.follow.findFirst.mockResolvedValue({ followerId: 'viewer-1' });

      const profile = await service.getProfile('marie', 'viewer-1');

      expect(profile.isFollowing).toBe(true);
      expect(prisma.follow.findFirst).toHaveBeenCalledWith({
        where: {
          followerId: 'viewer-1',
          followingId: 'profile-1',
          follower: { status: UserStatus.ACTIVE, deletedAt: null },
        },
        select: { followerId: true },
      });
    });

    it('only counts an active viewer: the query filters out suspended or deleted followers', async () => {
      await service.getProfile('marie', 'viewer-1');

      // A suspended or deleted viewer matches no row, so isFollowing is false for them,
      // the same rule that keeps them out of followersCount.
      expect(prisma.follow.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            follower: { status: UserStatus.ACTIVE, deletedAt: null },
          }),
        }),
      );
    });

    it('is false when the viewer does not follow the profile', async () => {
      const profile = await service.getProfile('marie', 'viewer-1');

      expect(profile.isFollowing).toBe(false);
    });

    it('is false for an anonymous visitor, without querying the follow relation', async () => {
      const profile = await service.getProfile('marie');

      expect(profile.isFollowing).toBe(false);
      expect(prisma.follow.findFirst).not.toHaveBeenCalled();
    });

    it("is false on the viewer's own profile, without querying the follow relation", async () => {
      const profile = await service.getProfile('marie', 'profile-1');

      expect(profile.isFollowing).toBe(false);
      expect(prisma.follow.findFirst).not.toHaveBeenCalled();
    });

    it('reflects an unfollow on the next call', async () => {
      prisma.follow.findFirst.mockResolvedValueOnce({ followerId: 'viewer-1' });
      prisma.follow.findFirst.mockResolvedValueOnce(null);

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
      expect(prisma.follow.findFirst).not.toHaveBeenCalled();
    });

    it('throws USER_NOT_FOUND for a deleted account', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...profileUser, deletedAt: new Date() });

      await expect(service.getProfile('marie', 'viewer-1')).rejects.toThrow(NotFoundException);
    });
  });
});

describe('ProfileService.listProfiles', () => {
  const prisma = {
    user: { findMany: jest.fn(), count: jest.fn() },
  };
  const productsService = { findByIds: jest.fn() };

  let service: ProfileService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
    service = new ProfileService(prisma as never, productsService as never);
  });

  it('excludes the signed-in viewer from the directory', async () => {
    await service.listProfiles({ page: 1, limit: 20 }, 'viewer-1');

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { not: 'viewer-1' } }),
      }),
    );
  });

  it('does not filter by id for an anonymous visitor', async () => {
    await service.listProfiles({ page: 1, limit: 20 });

    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.id).toBeUndefined();
  });

  it('only lists active, non-deleted accounts', async () => {
    await service.listProfiles({ page: 1, limit: 20 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: UserStatus.ACTIVE, deletedAt: null }),
      }),
    );
  });

  it('omits the search filter entirely when no search term is given', async () => {
    await service.listProfiles({ page: 1, limit: 20 });

    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.OR).toBeUndefined();
  });

  it('searches case-insensitively across name and handle', async () => {
    await service.listProfiles({ page: 1, limit: 20, search: 'Marie' });

    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { name: { contains: 'Marie', mode: 'insensitive' } },
      { handle: { contains: 'Marie', mode: 'insensitive' } },
    ]);
  });

  it('trims the search term before filtering', async () => {
    await service.listProfiles({ page: 1, limit: 20, search: '  marie  ' });

    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.OR[0].name.contains).toBe('marie');
  });

  it('treats a blank/whitespace-only search the same as no search', async () => {
    await service.listProfiles({ page: 1, limit: 20, search: '   ' });

    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.OR).toBeUndefined();
  });

  it('paginates with skip/take derived from page and limit', async () => {
    await service.listProfiles({ page: 3, limit: 10 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it('reports hasNextPage when more results exist past this page', async () => {
    prisma.user.count.mockResolvedValue(25);

    const page = await service.listProfiles({ page: 1, limit: 20 });

    expect(page.hasNextPage).toBe(true);
  });

  it('reports no next page once the last page is reached', async () => {
    prisma.user.count.mockResolvedValue(25);

    const page = await service.listProfiles({ page: 2, limit: 20 });

    expect(page.hasNextPage).toBe(false);
  });

  it('defaults a null bio to undefined for each entry', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', name: 'Marie', handle: 'marie', bio: null },
    ]);

    const page = await service.listProfiles({ page: 1, limit: 20 });

    expect(page.items[0].bio).toBeUndefined();
  });

  it('returns an empty page without error when nothing matches', async () => {
    const page = await service.listProfiles({ page: 1, limit: 20, search: 'nobody-like-this' });

    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.hasNextPage).toBe(false);
  });
});
