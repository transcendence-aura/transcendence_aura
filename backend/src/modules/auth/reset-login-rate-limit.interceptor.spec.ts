import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { AuthThrottlerStorage } from './auth-throttler.storage';
import { ResetLoginRateLimitInterceptor } from './reset-login-rate-limit.interceptor';

function loginContext(email: string): ExecutionContext {
  const req = { ip: '1.2.3.4', body: { email } };
  return {
    getType: () => 'http',
    getHandler: () => ({ name: 'login' }),
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({}) }),
  } as unknown as ExecutionContext;
}

describe('ResetLoginRateLimitInterceptor', () => {
  const reset = jest.fn();
  const interceptor = new ResetLoginRateLimitInterceptor({
    reset,
  } as unknown as AuthThrottlerStorage);

  beforeEach(() => reset.mockClear());

  it('clears the login counter once sign-in succeeds', async () => {
    const next: CallHandler = { handle: () => of({ accessToken: 'token' }) };

    await lastValueFrom(interceptor.intercept(loginContext('Jane@Aura.dev'), next));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(reset.mock.calls[0][0]).toMatch(/^auth-rate-limit-login-default-/);
  });

  it('uses the same key for any casing of the email', async () => {
    const next: CallHandler = { handle: () => of({}) };

    await lastValueFrom(interceptor.intercept(loginContext('Jane@Aura.dev'), next));
    await lastValueFrom(interceptor.intercept(loginContext(' jane@aura.dev'), next));

    expect(reset.mock.calls[0][0]).toBe(reset.mock.calls[1][0]);
  });

  it('keeps counting when sign-in fails', async () => {
    const next: CallHandler = { handle: () => throwError(() => new Error('Invalid credentials')) };

    await expect(
      lastValueFrom(interceptor.intercept(loginContext('jane@aura.dev'), next)),
    ).rejects.toThrow('Invalid credentials');
    expect(reset).not.toHaveBeenCalled();
  });
});
