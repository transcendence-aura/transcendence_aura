import { ExecutionContext, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectThrottlerOptions, ThrottlerGuard, throttlerMessage } from '@nestjs/throttler';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { authRateLimitKey, getAuthRequestResponse } from './auth-rate-limit';
import { AuthThrottlerStorage } from './auth-throttler.storage';

// Limits and trackers are set per route with @Throttle(AUTH_RATE_LIMITS.x).
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  // The parent class declares its storage with @InjectThrottlerStorage(), and
  // that declaration is inherited: without an explicit @Inject here, Nest
  // would still hand this guard the global storage instead of ours.
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @Inject(AuthThrottlerStorage) storage: AuthThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storage, reflector);
  }

  protected getRequestResponse(context: ExecutionContext): { req: Request; res: Response } {
    return getAuthRequestResponse(context);
  }

  // ThrottlerException's response is a bare string, which the Apollo driver
  // doesn't recognise as an HTTP error: the client would get a generic
  // INTERNAL_SERVER_ERROR. The object form keeps statusCode in
  // extensions.originalError, like every other HttpException.
  protected throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: throttlerMessage,
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  protected generateKey(context: ExecutionContext, tracker: string, name: string): string {
    return authRateLimitKey(context, tracker, name);
  }
}
