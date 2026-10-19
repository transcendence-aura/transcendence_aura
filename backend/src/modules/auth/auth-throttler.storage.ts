import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';

// The package doesn't re-export its record type from the entry point.
type ThrottlerStorageRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>;

const SWEEP_INTERVAL_MS = 60_000;

interface Entry {
  hits: number[];
  ttl: number;
  blockedUntil: number;
}

// In-memory storage for the auth routes only (the public API keeps the
// library's default one). It exists because the default storage has no way to
// clear a counter, and a successful sign-in must reset it: otherwise running
// the seed a few times, or simply logging in often, gets a user throttled.
@Injectable()
export class AuthThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  private readonly entries = new Map<string, Entry>();
  private readonly sweepTimer = setInterval(() => this.evictExpired(), SWEEP_INTERVAL_MS);

  constructor() {
    this.sweepTimer.unref();
  }

  increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): Promise<ThrottlerStorageRecord> {
    const now = Date.now();
    const entry = this.entries.get(key) ?? { hits: [], ttl, blockedUntil: 0 };

    entry.ttl = ttl;
    entry.hits = entry.hits.filter((hit) => hit > now - ttl);

    // Requests rejected while blocked don't extend the block.
    if (entry.blockedUntil <= now) {
      entry.blockedUntil = 0;
      entry.hits.push(now);

      if (entry.hits.length > limit) {
        entry.blockedUntil = now + blockDuration;
      }
    }

    this.entries.set(key, entry);

    const oldestHit = entry.hits[0] ?? now;

    return Promise.resolve({
      totalHits: entry.hits.length,
      timeToExpire: Math.ceil((oldestHit + ttl - now) / 1000),
      isBlocked: entry.blockedUntil > now,
      timeToBlockExpire: Math.max(0, Math.ceil((entry.blockedUntil - now) / 1000)),
    });
  }

  reset(key: string): void {
    this.entries.delete(key);
  }

  onModuleDestroy(): void {
    clearInterval(this.sweepTimer);
  }

  private evictExpired(now = Date.now()): void {
    for (const [key, entry] of this.entries) {
      const lastHit = entry.hits[entry.hits.length - 1] ?? 0;

      if (entry.blockedUntil <= now && lastHit + entry.ttl <= now) {
        this.entries.delete(key);
      }
    }
  }
}
