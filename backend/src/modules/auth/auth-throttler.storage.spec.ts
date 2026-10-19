import { AuthThrottlerStorage } from './auth-throttler.storage';

const TTL = 60_000;
const LIMIT = 5;

describe('AuthThrottlerStorage', () => {
  let storage: AuthThrottlerStorage;

  beforeEach(() => {
    jest.useFakeTimers();
    storage = new AuthThrottlerStorage();
  });

  afterEach(() => {
    storage.onModuleDestroy();
    jest.useRealTimers();
  });

  const hit = (key = 'key') => storage.increment(key, TTL, LIMIT, TTL);

  it('allows requests up to the limit, then blocks', async () => {
    for (let i = 1; i <= LIMIT; i++) {
      expect(await hit()).toMatchObject({ totalHits: i, isBlocked: false });
    }
    expect(await hit()).toMatchObject({ isBlocked: true, timeToBlockExpire: 60 });
  });

  it('does not extend the block while blocked', async () => {
    for (let i = 0; i <= LIMIT; i++) await hit();

    jest.advanceTimersByTime(TTL / 2);
    expect(await hit()).toMatchObject({ isBlocked: true, timeToBlockExpire: 30 });
  });

  it('lets requests through again once the block and the window have passed', async () => {
    for (let i = 0; i <= LIMIT; i++) await hit();

    jest.advanceTimersByTime(TTL);
    expect(await hit()).toMatchObject({ totalHits: 1, isBlocked: false });
  });

  it('forgets hits older than the window', async () => {
    await hit();
    jest.advanceTimersByTime(TTL);
    expect(await hit()).toMatchObject({ totalHits: 1 });
  });

  it('clears a counter on reset, block included', async () => {
    for (let i = 0; i <= LIMIT; i++) await hit();

    storage.reset('key');
    expect(await hit()).toMatchObject({ totalHits: 1, isBlocked: false });
  });

  it('keeps counters separate per key', async () => {
    for (let i = 0; i <= LIMIT; i++) await hit('a');

    expect(await hit('b')).toMatchObject({ totalHits: 1, isBlocked: false });
  });
});
