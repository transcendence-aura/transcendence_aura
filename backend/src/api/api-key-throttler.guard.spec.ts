import { ApiKeyThrottlerGuard } from './api-key-throttler.guard';

describe('ApiKeyThrottlerGuard', () => {
  const guard = new ApiKeyThrottlerGuard([], {} as never, {} as never) as unknown as {
    getTracker(req: unknown): Promise<string>;
    generateKey(context: unknown, tracker: string, name: string): string;
  };

  it('tracks requests by API key id', async () => {
    const tracker = await guard.getTracker({ apiKey: { id: 'key-1', ownerId: 'o', scopes: [] } });
    expect(tracker).toBe('key-1');
  });

  it('shares one counter across routes for the same key', () => {
    const a = guard.generateKey({ getHandler: () => ({ name: 'a' }) }, 'key-1', 'default');
    const b = guard.generateKey({ getHandler: () => ({ name: 'b' }) }, 'key-1', 'default');
    expect(a).toBe(b);
    expect(guard.generateKey({}, 'key-2', 'default')).not.toBe(a);
  });
});
