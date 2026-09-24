import { ProfileResolver } from './profile.resolver';

describe('ProfileResolver.userProfile', () => {
  const profileService = { getProfile: jest.fn(), listProfiles: jest.fn() };
  const tokenService = { getOptionalUserId: jest.fn() };

  const contextWith = (authorization?: string) => ({ req: { headers: { authorization } } });

  let resolver: ProfileResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    profileService.getProfile.mockResolvedValue({ handle: 'marie' });
    resolver = new ProfileResolver(profileService as never, tokenService as never);
  });

  it('passes the signed-in viewer to the service', async () => {
    tokenService.getOptionalUserId.mockResolvedValue('viewer-1');

    await resolver.userProfile('marie', contextWith('Bearer valid') as never);

    expect(tokenService.getOptionalUserId).toHaveBeenCalledWith('Bearer valid');
    expect(profileService.getProfile).toHaveBeenCalledWith('marie', 'viewer-1');
  });

  it('serves anonymous visitors: no token means no viewer, and no authentication error', async () => {
    tokenService.getOptionalUserId.mockResolvedValue(undefined);

    await expect(resolver.userProfile('marie', contextWith() as never)).resolves.toEqual({
      handle: 'marie',
    });
    expect(profileService.getProfile).toHaveBeenCalledWith('marie', undefined);
  });

  it('treats an invalid token like an anonymous visitor', async () => {
    tokenService.getOptionalUserId.mockResolvedValue(undefined);

    await resolver.userProfile('marie', contextWith('Bearer expired') as never);

    expect(profileService.getProfile).toHaveBeenCalledWith('marie', undefined);
  });
});

describe('ProfileResolver.profileDirectory', () => {
  const profileService = { getProfile: jest.fn(), listProfiles: jest.fn() };
  const tokenService = { getOptionalUserId: jest.fn() };

  const contextWith = (authorization?: string) => ({ req: { headers: { authorization } } });

  let resolver: ProfileResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    profileService.listProfiles.mockResolvedValue({ items: [], total: 0, hasNextPage: false });
    resolver = new ProfileResolver(profileService as never, tokenService as never);
  });

  it('passes the signed-in viewer to the service, to exclude them from their own directory', async () => {
    tokenService.getOptionalUserId.mockResolvedValue('viewer-1');

    await resolver.profileDirectory(contextWith('Bearer valid') as never, { page: 1, limit: 20 });

    expect(profileService.listProfiles).toHaveBeenCalledWith({ page: 1, limit: 20 }, 'viewer-1');
  });

  it('serves anonymous visitors: no token means no viewer, and no authentication error', async () => {
    tokenService.getOptionalUserId.mockResolvedValue(undefined);

    await resolver.profileDirectory(contextWith() as never, { page: 1, limit: 20 });

    expect(profileService.listProfiles).toHaveBeenCalledWith({ page: 1, limit: 20 }, undefined);
  });

  it('defaults to page 1 / limit 20 when no input is given', async () => {
    tokenService.getOptionalUserId.mockResolvedValue(undefined);

    await resolver.profileDirectory(contextWith() as never, undefined);

    expect(profileService.listProfiles).toHaveBeenCalledWith({ page: 1, limit: 20 }, undefined);
  });
});
