import { ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGetTrackerFunction } from '@nestjs/throttler';

const MINUTE_MS = 60_000;

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
const trackLogin: ThrottlerGetTrackerFunction = (req, context) => {
  const email = readInputField(req, context, 'email').trim().toLowerCase();
  return `${clientIp(req)}:${email}`;
};

// A pending token belongs to a single sign-in, so each one only gets a few
// guesses at the 6-digit code; a fresh token means going through login's limit.
const trackMfa: ThrottlerGetTrackerFunction = (req, context) =>
  readInputField(req, context, 'mfaPendingToken');

const trackRegister: ThrottlerGetTrackerFunction = (req) => clientIp(req);

// Passed to @Throttle on each route guarded by AuthThrottlerGuard.
export const AUTH_RATE_LIMITS = {
  login: { default: { limit: 5, ttl: 15 * MINUTE_MS, getTracker: trackLogin } },
  verifyMfa: { default: { limit: 5, ttl: 5 * MINUTE_MS, getTracker: trackMfa } },
  register: { default: { limit: 3, ttl: 60 * MINUTE_MS, getTracker: trackRegister } },
};
