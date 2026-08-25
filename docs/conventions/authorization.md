# Authorization Conventions

Role-based access control is enforced by one guard, applied
declaratively. No handler should ever check `user.role` by hand.

## Roles

`UserRole` (Prisma enum): `USER` | `ADMIN`. New accounts default to
`USER` — `ADMIN` is granted manually, never at registration.

## Protecting a route or resolver

```ts
import { UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Get('admin/users')
listUsers() {
  ...
}
```

- `@Roles(...roles)` only sets metadata — `RolesGuard` reads it via
  `Reflector`. Works identically on REST controllers and GraphQL
  resolvers/fields.
- `@UseGuards(RolesGuard)` with **no** `@Roles()` still requires a
  valid, active-account token — it just doesn't restrict by role.
  Use this on any route that only needs "logged in", not "logged in
  as admin".
- Never gate a route on role inside the handler body (`if (user.role
!== 'ADMIN') throw ...`). If you find yourself writing that, add
  `@Roles()` instead — that's the whole point of this guard.

## What `RolesGuard` actually does

1. Extracts the `Bearer <token>` from the `Authorization` header
   (works for both REST and GraphQL requests — it detects the
   execution context type and reads `req` accordingly).
2. Verifies the token via `TokenService.verifyAccessToken` (the same
   method `GqlAuthGuard` and the WebSocket gateway use) — unless an
   upstream guard already ran and attached `request.userId` (see
   [Composing with an upstream auth guard](#composing-with-an-upstream-auth-guard)).
3. **Re-reads the role from the database** using the token's `sub`
   (or the pre-attached `userId`) — the role is never taken from the
   token payload or trusted from the client. This means a role change
   (e.g. revoking admin) takes effect on the very next request, not
   only once the old token expires.
4. Also rejects suspended or soft-deleted accounts (`status !==
ACTIVE` or `deletedAt !== null`), even with an otherwise valid
   token.
5. Compares the fresh role against the roles required by `@Roles()`.

## Response codes

| Situation                                             | Result                    |
| ----------------------------------------------------- | ------------------------- |
| No/invalid/expired token                              | `401 Unauthorized`        |
| Valid token, account suspended or deleted             | `401 Unauthorized`        |
| Valid token, role not in the required list            | `403 Forbidden` (generic) |
| Valid token, role allowed (or no `@Roles()` declared) | request proceeds          |

`403` responses never include which role was expected or any other
detail about the protected resource — an unauthorized caller gets a
clean rejection, nothing else.

## Composing with an upstream auth guard

If another guard already authenticated the request and attached
`request.userId` before `RolesGuard` runs (this is exactly what
`GqlAuthGuard` does on GraphQL resolvers), `RolesGuard` trusts that
id and skips re-verifying the token — only the database role lookup
still happens. This is safe because `request.userId` can only be set
by server-side guard code, never by the client.

This lets `GqlAuthGuard` (authentication-only, GraphQL-only) be
composed in front of `RolesGuard` without double-verifying the same
JWT twice — e.g. an admin resolver could use
`@UseGuards(GqlAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)`. On
REST, or any GraphQL resolver where only `RolesGuard` is applied,
`RolesGuard` still authenticates the token itself — nothing else
does it there.

## Reading the current user in a handler

`RolesGuard` always sets both `request.userId` (string) and
`request.user: { id, role }`, whether it authenticated the token
itself or trusted an upstream guard. Because `request.userId` is the
same field `GqlAuthGuard` sets, the existing `@CurrentUser()`
decorator (`modules/auth/current-user.decorator.ts`) works on any
GraphQL resolver protected by `RolesGuard` too — no need for a
separate decorator. On REST, read `request.userId` via `@Req()`.

This is how a resolver/controller identifies "which user" for
ownership checks (e.g. a wishlist query scoping to `userId:
request.userId`, or verifying a mutation's target belongs to the
caller) — `RolesGuard` only enforces role membership, not per-resource
ownership; the handler still has to compare `request.userId` against
the resource's owner itself.

## Testing

`backend/src/common/guards/roles.guard.spec.ts` covers every branch
above (missing/invalid/foreign-typed token, suspended/deleted
account, role mismatch, role match, no `@Roles()`, pre-attached
`userId` from an upstream guard, stale/forged role claim on the token
being ignored). Run with:

```bash
npm test -- roles.guard
```
