import { ExecutionContext, HttpException } from '@nestjs/common';
import { AuthThrottlerGuard } from './auth-throttler.guard';
import { AUTH_RATE_LIMITS } from './auth-rate-limit';

function httpContext(handlerName: string, req: unknown = {}, res: unknown = {}): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => ({ name: handlerName }),
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;
}

function graphqlContext(handlerName: string, input: unknown, req: unknown = {}, res: unknown = {}) {
  return {
    getType: () => 'graphql',
    getHandler: () => ({ name: handlerName }),
    getClass: () => ({ name: 'AuthResolver' }),
    // GqlExecutionContext reads the resolver arguments as (root, args, context, info).
    getArgs: () => [{}, { input }, { req, res }, {}],
    getArgByIndex: (index: number) => [{}, { input }, { req, res }, {}][index],
  } as unknown as ExecutionContext;
}

describe('AuthThrottlerGuard', () => {
  const guard = new AuthThrottlerGuard([], {} as never, {} as never) as unknown as {
    getRequestResponse(context: ExecutionContext): { req: unknown; res: unknown };
    generateKey(context: ExecutionContext, tracker: string, name: string): string;
    throwThrottlingException(): Promise<void>;
  };

  it('throws a 429 whose response carries statusCode, so GraphQL clients can see it', () => {
    expect.assertions(2);
    try {
      void guard.throwThrottlingException();
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(429);
      expect((error as HttpException).getResponse()).toMatchObject({ statusCode: 429 });
    }
  });

  it('reads req and res from the GraphQL context', () => {
    const req = { ip: '1.2.3.4' };
    const res = { header: jest.fn() };
    expect(guard.getRequestResponse(graphqlContext('login', {}, req, res))).toEqual({ req, res });
  });

  it('reads req and res from the HTTP context', () => {
    const req = { ip: '1.2.3.4' };
    const res = { header: jest.fn() };
    expect(guard.getRequestResponse(httpContext('login', req, res))).toEqual({ req, res });
  });

  it('shares one counter between the GraphQL and REST routes of the same handler', () => {
    const graphqlKey = guard.generateKey(graphqlContext('login', {}), 'ip:mail', 'default');
    const restKey = guard.generateKey(httpContext('login'), 'ip:mail', 'default');
    expect(graphqlKey).toBe(restKey);
  });

  it('keeps separate counters per handler and per tracker', () => {
    const key = guard.generateKey(httpContext('login'), 'ip:mail', 'default');
    expect(guard.generateKey(httpContext('register'), 'ip:mail', 'default')).not.toBe(key);
    expect(guard.generateKey(httpContext('login'), 'ip:other', 'default')).not.toBe(key);
  });

  it('does not keep the raw tracker in the storage key', () => {
    const key = guard.generateKey(httpContext('login'), '1.2.3.4:jane@aura.dev', 'default');
    expect(key).not.toContain('jane@aura.dev');
  });
});

describe('AUTH_RATE_LIMITS trackers', () => {
  const { login, verifyMfa, register } = AUTH_RATE_LIMITS;

  it('tracks login by IP and normalized email, over GraphQL and REST', () => {
    const req = { ip: '1.2.3.4', body: { email: ' Jane@Aura.dev ' } };
    expect(login.default.getTracker(req, httpContext('login', req))).toBe('1.2.3.4:jane@aura.dev');
    expect(
      login.default.getTracker(
        { ip: '1.2.3.4' },
        graphqlContext('login', { email: 'JANE@aura.dev' }),
      ),
    ).toBe('1.2.3.4:jane@aura.dev');
  });

  it('does not throw on a malformed login body', () => {
    const req = { ip: '1.2.3.4', body: { email: 42 } };
    expect(login.default.getTracker(req, httpContext('login', req))).toBe('1.2.3.4:');
    expect(login.default.getTracker({ ip: '1.2.3.4' }, graphqlContext('login', null))).toBe(
      '1.2.3.4:',
    );
  });

  it('tracks MFA verification by pending token', () => {
    const context = graphqlContext('verifyMfa', { mfaPendingToken: 'pending-1', code: '123456' });
    expect(verifyMfa.default.getTracker({ ip: '1.2.3.4' }, context)).toBe('pending-1');
  });

  it('tracks registration by IP only', () => {
    const req = { ip: '1.2.3.4', body: { email: 'jane@aura.dev' } };
    expect(register.default.getTracker(req, httpContext('register', req))).toBe('1.2.3.4');
  });
});
