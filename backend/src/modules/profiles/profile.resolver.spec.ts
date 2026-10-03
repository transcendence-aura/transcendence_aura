import { ProfileResolver } from './profile.resolver';

describe('ProfileResolver.userProfile', () => {
  const profileService = { getProfile: jest.fn(), listProfiles: jest.fn() };

  let resolver: ProfileResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    profileService.getProfile.mockResolvedValue({ handle: 'marie' });
    resolver = new ProfileResolver(profileService as never);
  });

  it('passes the signed-in viewer to the service', async () => {
    await resolver.userProfile('marie', 'viewer-1');

    expect(profileService.getProfile).toHaveBeenCalledWith('marie', 'viewer-1');
  });
});

describe('ProfileResolver.profileDirectory', () => {
  const profileService = { getProfile: jest.fn(), listProfiles: jest.fn() };

  let resolver: ProfileResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    profileService.listProfiles.mockResolvedValue({ items: [], total: 0, hasNextPage: false });
    resolver = new ProfileResolver(profileService as never);
  });

  it('passes the signed-in viewer to the service, to exclude them from their own directory', async () => {
    await resolver.profileDirectory('viewer-1', { page: 1, limit: 20 });

    expect(profileService.listProfiles).toHaveBeenCalledWith({ page: 1, limit: 20 }, 'viewer-1');
  });

  it('defaults to page 1 / limit 20 when no input is given', async () => {
    await resolver.profileDirectory('viewer-1', undefined);

    expect(profileService.listProfiles).toHaveBeenCalledWith({ page: 1, limit: 20 }, 'viewer-1');
  });
});
