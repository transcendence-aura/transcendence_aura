import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import {
  AUTH_THROTTLER_NAME,
  authRateLimitKey,
  getAuthRequestResponse,
  trackLogin,
} from './auth-rate-limit';
import { AuthThrottlerStorage } from './auth-throttler.storage';

// Only failed sign-ins should count towards the login limit, so a completed
// sign-in clears its counter. Throwing handlers never reach tap, so failures
// keep counting.
//
// A right password on an MFA account (requiresMfa: true) must NOT clear it:
// the verifyMfa limit relies on every new pending token going through the
// login limit, otherwise login -> 5 codes -> login -> 5 codes... never stops
// and the 6-digit code can be brute-forced.
function isCompletedSignIn(result: unknown): boolean {
  return (
    typeof result === 'object' &&
    result !== null &&
    (result as { requiresMfa?: unknown }).requiresMfa === false
  );
}

@Injectable()
export class ResetLoginRateLimitInterceptor implements NestInterceptor {
  constructor(private readonly storage: AuthThrottlerStorage) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap((result) => {
        if (!isCompletedSignIn(result)) return;

        const { req } = getAuthRequestResponse(context);
        const tracker = trackLogin(req as unknown as Record<string, unknown>, context);
        this.storage.reset(authRateLimitKey(context, tracker, AUTH_THROTTLER_NAME));
      }),
    );
  }
}
