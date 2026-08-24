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
2. Verifies the JWT (signature, expiry, issuer, audience) — unless an
   upstream guard already ran and attached `request.user.id` (see
   [Composing with an upstream auth guard](#composing-with-an-upstream-auth-guard)).
3. **Re-reads the role from the database** using the token's `sub`
   (or the pre-attached id) — the role is never taken from the token
   payload or trusted from the client. This means a role change
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
`request.user = { id }` before `RolesGuard` runs (e.g.
`@UseGuards(SomeAuthGuard, RolesGuard)`), `RolesGuard` trusts that id
and skips re-verifying the token — only the database role lookup
still happens. This is safe because `request.user` can only be set
by server-side guard code, never by the client.

This lets a future authentication-only guard be composed in front of
`RolesGuard` without double-verifying the same JWT twice.

## Reading the current user in a handler

`RolesGuard` attaches `request.user: { id, role }`. There is
currently no `@CurrentUser()` decorator in this codebase — read
`request.user` from the REST `@Req()` request or the GraphQL
context until one exists.

## Testing

`backend/src/common/guards/roles.guard.spec.ts` covers every branch
above (missing/invalid/foreign-typed token, suspended/deleted
account, role mismatch, role match, no `@Roles()`, pre-attached id
from an upstream guard, stale/forged role claim on the token being
ignored). Run with:

```bash
npm test -- roles.guard
```
