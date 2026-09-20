import { TokenService } from './token.service';

describe('TokenService.getOptionalUserId', () => {
  const jwtService = { verifyAsync: jest.fn() };
  const configService = {
    get: jest.fn().mockReturnValue({
      accessSecret: 'secret',
      issuer: 'issuer',
      accessAudience: 'audience',
    }),
  };

  let service: TokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TokenService(jwtService as never, configService as never);
  });

  it('returns undefined without an Authorization header, without verifying anything', async () => {
    await expect(service.getOptionalUserId(undefined)).resolves.toBeUndefined();
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('returns undefined when the header is not a Bearer token', async () => {
    await expect(service.getOptionalUserId('Basic abc123')).resolves.toBeUndefined();
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('returns the user id of a valid access token', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', tokenType: 'access' });

    await expect(service.getOptionalUserId('Bearer valid-token')).resolves.toBe('user-1');
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'valid-token',
      expect.objectContaining({ secret: 'secret', algorithms: ['HS256'] }),
    );
  });

  it('returns undefined, not an error, for an invalid or expired token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(service.getOptionalUserId('Bearer expired-token')).resolves.toBeUndefined();
  });

  it('does not treat a token of another type (e.g. MFA pending) as a signed-in viewer', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', tokenType: 'mfaPending' });

    await expect(service.getOptionalUserId('Bearer mfa-token')).resolves.toBeUndefined();
  });
});
