# Analytics Events

`AnalyticsService.record(type, actorId, target?)`
(`backend/src/modules/analytics/analytics.service.ts`) is the only way
event rows get written. No handler should call
`prisma.analyticsEvent.create(...)` directly.

## Guarantee: recording never breaks the action it observes

`record()` wraps the write in a `try/catch` and only `logger.warn`s on
failure — it never throws. Every call site can therefore call it
without its own error handling, and a broken analytics write can never
turn a successful registration, login, view, wishlist add, or message
send into a failed request.

## Tracked event types

`AnalyticsEventType` (`analytics-event-type.enum.ts`) is the full list.
A type must be added there before any code is allowed to emit it.

| Type                  | Emitted when                                                                                                                | Actor                                | Target                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------- |
| `USER_REGISTERED`     | A new account is created                                                                                                    | The new user                         | none                      |
| `USER_LOGGED_IN`      | A login succeeds (non-MFA-pending)                                                                                          | The user                             | none                      |
| `PRODUCT_VIEWED`      | `product(slug)` query resolves                                                                                              | Caller, if authenticated (see below) | `PRODUCT` / product id    |
| `WISHLIST_ITEM_ADDED` | `addWishlistItem` mutation runs                                                                                             | The user                             | `PRODUCT` / product id    |
| `USER_FOLLOWED`       | Not emitted yet — no `follows` module exists (see `TODO(AUR-94)` in `conversation.service.ts`). Wire this up when it ships. | The follower                         | `USER` / followed user id |
| `MESSAGE_SENT`        | `sendMessage` mutation runs                                                                                                 | The sender                           | `MESSAGE` / message id    |

## Product views and anonymous browsing

`AnalyticsEvent.actorId` is required in the schema, but browsing the
catalogue (`product(slug)`) is intentionally public. `ProductResolver`
only records a `PRODUCT_VIEWED` event when the request carries a
valid, currently-verifiable access token — anonymous views are simply
not recorded. The query itself never requires authentication; this is
best-effort tracking layered on top, not an access-control change.

## No sensitive data

Only IDs and event types are ever recorded — never an email, a
password, a token, or message content. `targetType`/`targetId` are
strings by design; there's no field to put a payload in.
