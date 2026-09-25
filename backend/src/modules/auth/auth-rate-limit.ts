import { createHash } from 'node:crypto';
import { ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import type { Request, Response } from 'express';

const MINUTE_MS = 60_000;

// The name @Throttle({ default: ... }) gives the limits in AUTH_RATE_LIMITS.
export const AUTH_THROTTLER_NAME = 'default';

export function getAuthRequestResponse(context: ExecutionContext): {
  req: Request;
  res: Response;
} {
  if (context.getType<GqlContextType>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext<{ req: Request; res: Response }>();
  }
  const http = context.switchToHttp();
  return { req: http.getRequest<Request>(), res: http.getResponse<Response>() };
}

// Keyed by handler name rather than class, so the GraphQL and REST login
// routes share one counter. Trackers hold emails and pending MFA tokens, so
// they are hashed rather than kept as-is in the storage.
export function authRateLimitKey(
  context: ExecutionContext,
  tracker: string,
  throttlerName: string,
): string {
  const hashedTracker = createHash('sha256').update(tracker).digest('hex');
  return `auth-rate-limit-${context.getHandler().name}-${throttlerName}-${hashedTracker}`;
}

// Guards run before the ValidationPipe, so the arguments are still untrusted
// here: GraphQL mutations take them under `input`, REST routes in the body.
function readInputField(
  req: Record<string, unknown>,
  context: ExecutionContext,
  field: string,
): string {
  const input: unknown =
    context.getType<GqlContextType>() === 'graphql'
      ? GqlExecutionContext.create(context).getArgs<{ input?: unknown }>().input
      : req.body;

  if (typeof input !== 'object' || input === null) return '';

  const value = (input as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}

function clientIp(req: Record<string, unknown>): string {
  return typeof req.ip === 'string' ? req.ip : '';
}

// Tracking login by IP alone would put everyone behind a shared NAT (the 42
// campus) on one counter; by email alone would let anyone lock a victim out.
export function trackLogin(req: Record<string, unknown>, context: ExecutionContext): string {
  const email = readInputField(req, context, 'email').trim().toLowerCase();
  return `${clientIp(req)}:${email}`;
}

// A pending token belongs to a single sign-in, so each one only gets a few
// guesses at the 6-digit code; a fresh token means going through login's limit.
function trackMfa(req: Record<string, unknown>, context: ExecutionContext): string {
  return readInputField(req, context, 'mfaPendingToken');
}

// Passed to @Throttle on each route guarded by AuthThrottlerGuard.
export const AUTH_RATE_LIMITS = {
  login: { default: { limit: 5, ttl: 15 * MINUTE_MS, getTracker: trackLogin } },
  verifyMfa: { default: { limit: 5, ttl: 5 * MINUTE_MS, getTracker: trackMfa } },
};
