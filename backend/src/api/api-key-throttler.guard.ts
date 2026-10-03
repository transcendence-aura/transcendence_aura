import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthenticatedRequest } from '../common/types/authenticated-request';

// Must run after ApiKeyGuard, which sets request.apiKey.
@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: AuthenticatedRequest): Promise<string> {
    return req.apiKey?.id ?? '';
  }

  // The default key includes the route, which would give each endpoint its
  // own counter; the limit is meant to be shared across the whole API.
  protected generateKey(_context: ExecutionContext, tracker: string, name: string): string {
    return `api-rate-limit-${name}-${tracker}`;
  }
}
