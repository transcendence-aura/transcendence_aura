import { ProfileResolver } from './profile.resolver';

describe('ProfileResolver.userProfile', () => {
  const profileService = { getProfile: jest.fn() };
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
