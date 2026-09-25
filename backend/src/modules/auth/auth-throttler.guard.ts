import { createHash } from 'node:crypto';
import { ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, throttlerMessage } from '@nestjs/throttler';
import type { Request, Response } from 'express';

// Limits and trackers are set per route with @Throttle(AUTH_RATE_LIMITS.x).
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext): { req: Request; res: Response } {
    if (context.getType<GqlContextType>() === 'graphql') {
      const { req, res } = GqlExecutionContext.create(context).getContext<{
        req: Request;
        res: Response;
      }>();
      return { req, res };
    }
    const http = context.switchToHttp();
    return { req: http.getRequest<Request>(), res: http.getResponse<Response>() };
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

  // The default key includes the class name, which would give the GraphQL and
  // REST login routes separate counters. Trackers hold emails and pending MFA
  // tokens, so they are hashed rather than kept as-is in the storage.
  protected generateKey(context: ExecutionContext, tracker: string, name: string): string {
    const hashedTracker = createHash('sha256').update(tracker).digest('hex');
    return `auth-rate-limit-${context.getHandler().name}-${name}-${hashedTracker}`;
  }
}
