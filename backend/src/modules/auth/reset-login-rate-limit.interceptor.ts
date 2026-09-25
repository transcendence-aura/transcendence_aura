import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import {
  AUTH_THROTTLER_NAME,
  authRateLimitKey,
  getAuthRequestResponse,
  trackLogin,
} from './auth-rate-limit';
import { AuthThrottlerStorage } from './auth-throttler.storage';

// Only failed sign-ins should count towards the login limit: once the handler
// succeeds (the password was right, MFA step or not), its counter is cleared.
// Throwing handlers never reach tap, so failures keep counting.
@Injectable()
export class ResetLoginRateLimitInterceptor implements NestInterceptor {
  constructor(private readonly storage: AuthThrottlerStorage) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const { req } = getAuthRequestResponse(context);
        const tracker = trackLogin(req as unknown as Record<string, unknown>, context);
        this.storage.reset(authRateLimitKey(context, tracker, AUTH_THROTTLER_NAME));
      }),
    );
  }
}
