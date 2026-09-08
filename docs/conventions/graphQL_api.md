# GraphQL API

## Table of Contents

**Conventions**

- [Overview](#overview)
- [Endpoint](#endpoint)
- [Architecture](#architecture)
- [Development Tools](#development-tools)
- [Error Handling](#error-handling)
- [Authentication](#authentication)
- [Adding a New Query](#adding-a-new-query)

**Query Reference**

- [product(slug)](#productslug) — Single product with images, variants, categories and badges
- [products(filter, pagination)](#productsfilter-pagination) — Paginated product list with filtering and full-text search
- [collections](#collections) — List of all active collections
- [collection(slug)](#collectionslug) — Single collection by slug
- [wishlist](#wishlist) — Authenticated user's wishlist as full product cards
- [adminUsers(filter, pagination)](#adminusersfilter-pagination) — Paginated user list for the admin management table, filterable/sortable by role and status. Admin-only
- [adminUser(id)](#adminuserid) — Single user detail view. Admin-only
- [followersCount(userId)](#followerscountuserid) — Number of users following the given user
- [followingCount(userId)](#followingcountuserid) — Number of users the given user follows
- [userProfile(handle)](#userprofilehandle) — Public profile view: identity, bio, follower/following counts, recent activity
- [notifications(unreadOnly)](#notificationsunreadonly) — Authenticated user's notifications, all or unread-only
- [registrationsOverTime(period)](#registrationsovertimeperiod) — Registration counts bucketed over a period. Admin-only
- [messagesOverTime(period)](#messagesovertimeperiod) — Message-sent counts bucketed over a period. Admin-only
- [followsOverTime(period)](#followsovertimeperiod) — Follow counts bucketed over a period. Admin-only
- [activeUsersOverTime(period)](#activeusersovertimeperiod) — Distinct active users bucketed over a period. Admin-only
- [topProductsByWishlistAdds(period, limit)](#topproductsbywishlistaddsperiod-limit) — Most-wishlisted products over a period. Admin-only

**Mutation Reference**

- [addWishlistItem(input)](#addwishlistiteminput) — Add a product to the authenticated user's wishlist (idempotent)
- [removeWishlistItem(input)](#removewishlistiteminput) — Remove a product from the authenticated user's wishlist (idempotent)
- [followUser(input)](#followuserinput) — Follow another user (idempotent, self-follow rejected)
- [unfollowUser(input)](#unfollowuserinput) — Unfollow a user (idempotent)
- [markNotificationRead(input)](#marknotificationreadinput) — Mark a single notification as read (scoped to its owner)
- [markAllNotificationsRead](#markallnotificationsread) — Mark all of the caller's unread notifications as read, returns the count
- [adminSetUserRole(userId, role)](#adminsetuserroleuserid-role) — Change a user's role between `USER` and `ADMIN`. Admin-only, self-target rejected
- [adminSuspendUser(userId)](#adminsuspenduseruserid) — Suspend a user: blocks sign-in and revokes every active session. Admin-only, self-target rejected
- [adminReinstateUser(userId)](#adminreinstateuseruserid) — Reactivate a suspended user. Admin-only
- [adminDeleteUser(userId)](#admindeleteuseruserid) — Soft-delete a user. Admin-only, self-target rejected

---

## Overview

The GraphQL API is the primary data-fetching layer for the AURA platform. It is built with NestJS using the **code-first** approach: TypeScript decorators generate the schema automatically — `schema.gql` is never edited by hand.

---

## Endpoint

All GraphQL requests go to a single endpoint:

```
POST /graphql
```

The request body must include a `Content-Type: application/json` header and a JSON payload:

```json
{
  "query": "{ product(slug: \"purifying-gel-cleanser\") { name } }"
}
```

---

## Architecture

Each feature lives in `backend/src/modules/<feature>/` and follows a 4-file structure:

| File                    | Role                                           |
| ----------------------- | ---------------------------------------------- |
| `<feature>.model.ts`    | GraphQL `@ObjectType` definitions — the schema |
| `<feature>.service.ts`  | Business logic and Prisma queries              |
| `<feature>.resolver.ts` | GraphQL query/mutation entry points            |
| `<feature>.module.ts`   | NestJS module wiring                           |

The module must be imported in `app.module.ts` to be active.

---

## Development Tools

GraphiQL (interactive browser UI) is available when `NODE_ENV` is not `production`:

```
https://localhost/graphql
```

For curl-based testing (pipe to `jq` for readable JSON output):

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ product(slug: \"...\") { name } }"}' | jq
```

---

## Error Handling

| Situation                 | Behavior                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Resource not found        | `NotFoundException` → clean GraphQL error, no crash                                 |
| Invalid argument type     | GraphQL validation error (automatic)                                                |
| Missing required argument | GraphQL validation error (automatic)                                                |
| `minPrice` > `maxPrice`   | `BadRequestException` → `BAD_REQUEST`, message: `minPrice must not exceed maxPrice` |

GraphQL always returns **HTTP 200**, even for errors. The frontend must check the `errors` array in the response body, not the HTTP status code.

Not-found errors use NestJS `NotFoundException` and return:

```json
{
  "errors": [
    {
      "message": "PRODUCT_NOT_FOUND",
      "locations": [{ "line": 1, "column": 3 }],
      "path": ["product"],
      "extensions": {
        "code": "INTERNAL_SERVER_ERROR",
        "status": 404,
        "originalError": {
          "message": "PRODUCT_NOT_FOUND",
          "error": "Not Found",
          "statusCode": 404
        }
      }
    }
  ],
  "data": null
}
```

The frontend should read `extensions.originalError.statusCode` to determine the error category. The `extensions.code` field may say `INTERNAL_SERVER_ERROR` for non-500 errors — this is expected behavior with `NotFoundException`.

No stack traces are exposed in responses.

---

## Authentication

Most queries above (catalogue browsing) are public. Operations that act on a specific user's data — the `wishlist` query and the wishlist mutations below, and any future one following the same pattern — require a valid access token on every request:

```
Authorization: Bearer <accessToken>
```

Obtain a token via the `login` mutation (`backend/src/modules/auth/`). These are protected by `RolesGuard`, which verifies the token and re-reads the caller's role/status from the database on every call — see [authorization.md](./authorization.md) for the full guard behavior.

Some queries additionally restrict by role: `adminUsers` and `adminUser` below are **admin-only** — the caller's account must have `role: ADMIN`, enforced with `@Roles(UserRole.ADMIN)` on top of `RolesGuard`. A valid token belonging to a non-admin account is rejected with `403`, not `401`.

| Situation                                             | Result             |
| ----------------------------------------------------- | ------------------ |
| Missing, invalid or expired token                     | `401 Unauthorized` |
| Valid token, account suspended or deleted             | `401 Unauthorized` |
| Valid token, role not allowed for an admin-only query | `403 Forbidden`    |

---

## Adding a New Query

1. Create `backend/src/modules/<feature>/` with the 4-file structure.
2. Define `@ObjectType` classes in `<feature>.model.ts`.
3. Implement business logic in `<feature>.service.ts`.
4. Expose the query with `@Query()` (or `@Mutation()` for a write operation) in `<feature>.resolver.ts`.
5. Register the module in `app.module.ts`.
6. Rebuild the backend container so NestJS regenerates the schema.

---

# Query Reference

## `product(slug)`

Returns a single product with its image gallery, variants (sorted by price ascendant), badges, categories and product families. Feeds the product detail page and catalogue cards.

**Source:** `backend/src/modules/products/`

**Query**

```graphql
query {
  product(slug: "purifying-gel-cleanser") {
    id
    slug
    name
    description
    badges
    primaryImage {
      id
      url
      altText
    }
    media {
      id
      url
      altText
      position
      isPrimary
    }
    variants {
      id
      label
      isAvailable
      price
    }
    categories {
      id
      slug
      name
    }
    productFamilies {
      id
      slug
      name
    }
    collections {
      id
      slug
      name
    }
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ product(slug: \"purifying-gel-cleanser\") { id slug name description badges primaryImage { id url altText isPrimary } media { id url altText position isPrimary } variants { id label isAvailable price } categories { id slug name } productFamilies { id slug name } collections { id slug name } } }"}'  | jq .
```

**Arguments**

| Argument | Type     | Required | Description                     |
| -------- | -------- | -------- | ------------------------------- |
| `slug`   | `String` | Yes      | URL-friendly product identifier |

**Response type: `ProductType`**

| Field             | Type                      | Nullable | Description                                               |
| ----------------- | ------------------------- | -------- | --------------------------------------------------------- |
| `id`              | `String`                  | No       | UUID                                                      |
| `slug`            | `String`                  | No       | URL-friendly identifier                                   |
| `name`            | `String`                  | No       | Display name                                              |
| `description`     | `String`                  | Yes      | Long description                                          |
| `badges`          | `[String]`                | No       | Marketing badges (e.g. `"new"`, `"sale"`, `"bestseller"`) |
| `primaryImage`    | `ProductMediaType`        | Yes      | First media item (position 0) — used for catalogue cards  |
| `media`           | `[ProductMediaType]`      | No       | Full ordered image gallery                                |
| `variants`        | `[ProductVariantType]`    | No       | Available size/volume options                             |
| `categories`      | `[ProductCategoryType]`   | No       | Categories this product belongs to (M-N)                  |
| `productFamilies` | `[ProductFamilyType]`     | No       | Product families this product belongs to (M-N)            |
| `collections`     | `[ProductCollectionType]` | No       | Collections this product belongs to (M-N)                 |

**`ProductMediaType`**

| Field       | Type      | Nullable | Description                                        |
| ----------- | --------- | -------- | -------------------------------------------------- |
| `id`        | `String`  | No       | UUID                                               |
| `url`       | `String`  | No       | Image URL                                          |
| `altText`   | `String`  | Yes      | Accessibility label                                |
| `position`  | `Int`     | No       | Gallery display order (ascending)                  |
| `isPrimary` | `Boolean` | No       | `true` for the first image — used for cards/thumbs |

**`ProductVariantType`**

| Field                | Type      | Nullable | Description                                                                                                                |
| -------------------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`                 | `String`  | No       | UUID                                                                                                                       |
| `label`              | `String`  | No       | Size/volume label (e.g. `50ml`)                                                                                            |
| `isAvailable`        | `Boolean` | No       | Stock availability                                                                                                         |
| `price`              | `Float`   | No       | Base price in euros (before any discount)                                                                                  |
| `isOnSale`           | `Boolean` | No       | Whether this variant is currently on sale                                                                                  |
| `discountPercentage` | `Float`   | No       | Discount rate (0–100, two decimal places). The frontend computes the final price: `price * (1 - discountPercentage / 100)` |

**`ProductCategoryType`** / **`ProductFamilyType`** / **`ProductCollectionType`**

| Field  | Type     | Nullable | Description             |
| ------ | -------- | -------- | ----------------------- |
| `id`   | `String` | No       | UUID                    |
| `slug` | `String` | No       | URL-friendly identifier |
| `name` | `String` | No       | Display name            |

**Errors**

| Case                               | Message             |
| ---------------------------------- | ------------------- |
| Slug not found or product inactive | `PRODUCT_NOT_FOUND` |

---

## `products(filter, pagination)`

Returns a paginated list of active products. All filter arguments are optional and combinable. Feeds the catalogue page product grid.

Supports free-text search via the `search` field — see [Full-text search](#full-text-search) below.

**Source:** `backend/src/modules/products/`

**Query**

```graphql
query {
  products(
    filter: {
      search: "vitamin c"
      collectionSlug: "clean-beauty-skincare"
      categorySlug: "face-care"
      productFamilySlug: "serum"
      minPrice: 10
      maxPrice: 50
      onlyAvailable: true
      badge: "bestseller"
      sort: PRICE_ASC
    }
    pagination: { page: 1, limit: 20 }
  ) {
    total
    hasNextPage
    items {
      id
      slug
      name
      description
      badges
      minPrice
      primaryImage {
        id
        url
        altText
      }
      media {
        id
        url
        altText
        position
        isPrimary
      }
      variants {
        id
        label
        isAvailable
        price
      }
      categories {
        id
        slug
        name
      }
      productFamilies {
        id
        slug
        name
      }
      collections {
        id
        slug
        name
      }
    }
  }
}
```

**curl example — all filters combined**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(filter: { search: \"vitamin c\", collectionSlug: \"clean-beauty-skincare\", categorySlug: \"face-care\", productFamilySlug: \"serum\", minPrice: 10, maxPrice: 50, onlyAvailable: true, badge: \"bestseller\", sort: PRICE_ASC }, pagination: { page: 1, limit: 20 }) { total hasNextPage items { id slug name description badges minPrice popularityScore primaryImage { id url altText isPrimary } media { id url altText position isPrimary } variants { id label isAvailable price } categories { id slug name } productFamilies { id slug name } collections { id slug name } } } }"}'  | jq
```

**curl example — sort by price descending**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(filter: { sort: PRICE_DESC }, pagination: { page: 1, limit: 10 }) { total items { name minPrice } } }"}' | jq
```

**curl example — sort by popularity**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(filter: { sort: POPULARITY }, pagination: { page: 1, limit: 10 }) { total items { name popularityScore } } }"}' | jq
```

**curl example — filter by badge**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(filter: { badge: \"bestseller\" }, pagination: { page: 1, limit: 10 }) { total items { name badges } } }"}' | jq
```

**curl example — no filter, first page**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(pagination: { page: 1, limit: 10 }) { total hasNextPage items { id slug name badges minPrice primaryImage { url isPrimary } } } }"}'  | jq
```

**curl example — price range only**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(filter: { minPrice: 20, maxPrice: 50 }, pagination: { page: 1, limit: 10 }) { total items { name minPrice variants { label price isAvailable } } } }"}' | jq
```

**Arguments**

| Argument     | Type                      | Required | Description                                                     |
| ------------ | ------------------------- | -------- | --------------------------------------------------------------- |
| `filter`     | `ProductsFilterInput`     | No       | Filter and search criteria — all fields optional and combinable |
| `pagination` | `ProductsPaginationInput` | No       | Page and limit — defaults to page 1, limit 20                   |

**`ProductsFilterInput`**

| Field               | Type               | Description                                                                                                                                |
| ------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `collectionSlug`    | `String`           | Keep only products belonging to this collection                                                                                            |
| `categorySlug`      | `String`           | Keep only products belonging to this category                                                                                              |
| `productFamilySlug` | `String`           | Keep only products belonging to this product family                                                                                        |
| `badge`             | `String`           | Keep only products that have this badge (e.g. `"new"`, `"sale"`, `"bestseller"`)                                                           |
| `minPrice`          | `Float`            | Keep only products with at least one available variant priced ≥ this value                                                                 |
| `maxPrice`          | `Float`            | Keep only products with at least one available variant priced ≤ this value. Must be ≥ `minPrice` — see [Errors](#errors-1) below           |
| `onlyAvailable`     | `Boolean`          | When `true`, keep only products that have at least one available variant — regardless of price                                             |
| `sort`              | `ProductSortOrder` | Sort order — see [`ProductSortOrder`](#productsortorder) below. Defaults to relevance rank when `search` is set, insertion order otherwise |
| `search`            | `String`           | Free-text search over product name and description — see [Full-text search](#full-text-search)                                             |

All fields are optional and combinable. Omitting `filter` entirely returns all active products.

### `ProductSortOrder`

| Value        | Description                                                            |
| ------------ | ---------------------------------------------------------------------- |
| `PRICE_ASC`  | Cheapest first (based on the lowest available variant price)           |
| `PRICE_DESC` | Most expensive first (based on the lowest available variant price)     |
| `NEWEST`     | Most recently created first                                            |
| `POPULARITY` | Highest `popularityScore` first — score maintained by a background job |

### Full-text search

The `search` field performs PostgreSQL full-text search over `name` and `description`. It is distinct from the other filter fields: instead of an exact match, it scores documents by relevance and returns results ordered by that score (unless `sortByPrice` is also set, which takes priority).

**Behaviour**

- Matching is case-insensitive and accent-insensitive (`éléphant` matches `elephant`).
- Each word in the query is treated as a prefix — `sham` matches `shampoo`.
- Multi-word queries require all words to be present (implicit AND).
- An empty string (`""`) or absent `search` returns the unfiltered list.
- No matches returns `{ total: 0, items: [] }` — never an error.
- `search` is combinable with all other filter fields; they apply as AND conditions on top of the text match.
- Maximum length: 200 characters.

**Implementation notes**

- Uses `to_tsvector('simple', ...)` and `to_tsquery('simple', 'term:*')` with a GIN-friendly inline index expression.
- Accent stripping relies on the PostgreSQL `unaccent` extension (enabled via migration `20260808120000_enable_unaccent_extension`).
- Ranking uses `ts_rank`; results within a page are sorted by relevance. Cross-page rank consistency is not guaranteed when other filters are combined.

**curl example — basic search**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(filter: { search: \"serum\" } pagination: {}) { total items { name } } }"}' | jq
```

**curl example — partial word**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(filter: { search: \"sham\" } pagination: {}) { total items { name } } }"}' | jq
```

**curl example — search combined with category filter**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(filter: { search: \"oil\", collectionSlug: \"clean-beauty-skincare\" } pagination: {} ) { total items { name } } }"}' | jq
```

> **Note on price filtering:** `minPrice`/`maxPrice` filter on variant-level prices. A product appears in results if it has **at least one available variant** in the price range — not all its variants need to be in range.

**`ProductsPaginationInput`**

| Field   | Type  | Default | Description                  |
| ------- | ----- | ------- | ---------------------------- |
| `page`  | `Int` | `1`     | Page number (1-based, min 1) |
| `limit` | `Int` | `20`    | Items per page (min 1)       |

**Response type: `ProductPageType`**

| Field         | Type            | Nullable | Description                                                   |
| ------------- | --------------- | -------- | ------------------------------------------------------------- |
| `total`       | `Int`           | No       | Total number of products matching the filter across all pages |
| `hasNextPage` | `Boolean`       | No       | `true` if more pages exist beyond the current one             |
| `items`       | `[ProductType]` | No       | Products for the current page                                 |

**`ProductType`** (each item in `items`)

| Field             | Type                      | Nullable | Description                                                                 |
| ----------------- | ------------------------- | -------- | --------------------------------------------------------------------------- |
| `id`              | `String`                  | No       | UUID                                                                        |
| `slug`            | `String`                  | No       | URL-friendly identifier                                                     |
| `name`            | `String`                  | No       | Display name                                                                |
| `description`     | `String`                  | Yes      | Long description                                                            |
| `badges`          | `[String]`                | No       | Marketing badges (e.g. `"new"`, `"sale"`, `"bestseller"`)                   |
| `minPrice`        | `Float`                   | Yes      | Lowest price across available variants                                      |
| `popularityScore` | `Float`                   | No       | Denormalised score updated by a background job — used for `POPULARITY` sort |
| `primaryImage`    | `ProductMediaType`        | Yes      | First media item (position 0) — used for catalogue cards                    |
| `media`           | `[ProductMediaType]`      | No       | Full ordered image gallery                                                  |
| `variants`        | `[ProductVariantType]`    | No       | All size/volume options                                                     |
| `categories`      | `[ProductCategoryType]`   | No       | Categories this product belongs to (M-N)                                    |
| `productFamilies` | `[ProductFamilyType]`     | No       | Product families this product belongs to (M-N)                              |
| `collections`     | `[ProductCollectionType]` | No       | Collections this product belongs to (M-N)                                   |

**`ProductMediaType`**

| Field       | Type      | Nullable | Description                                        |
| ----------- | --------- | -------- | -------------------------------------------------- |
| `id`        | `String`  | No       | UUID                                               |
| `url`       | `String`  | No       | Image URL                                          |
| `altText`   | `String`  | Yes      | Accessibility label                                |
| `position`  | `Int`     | No       | Gallery display order (ascending)                  |
| `isPrimary` | `Boolean` | No       | `true` for the first image — used for cards/thumbs |

**`ProductVariantType`**

| Field                | Type      | Nullable | Description                                                                                                                |
| -------------------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`                 | `String`  | No       | UUID                                                                                                                       |
| `label`              | `String`  | No       | Size/volume label (e.g. `50ml`)                                                                                            |
| `isAvailable`        | `Boolean` | No       | Stock availability                                                                                                         |
| `price`              | `Float`   | No       | Base price in euros (before any discount)                                                                                  |
| `isOnSale`           | `Boolean` | No       | Whether this variant is currently on sale                                                                                  |
| `discountPercentage` | `Float`   | No       | Discount rate (0–100, two decimal places). The frontend computes the final price: `price * (1 - discountPercentage / 100)` |

**`ProductCategoryType`** / **`ProductFamilyType`** / **`ProductCollectionType`**

| Field  | Type     | Nullable | Description             |
| ------ | -------- | -------- | ----------------------- |
| `id`   | `String` | No       | UUID                    |
| `slug` | `String` | No       | URL-friendly identifier |
| `name` | `String` | No       | Display name            |

**Errors**

| Case                    | Message / behavior                                                     |
| ----------------------- | ---------------------------------------------------------------------- |
| No products match       | Returns `{ total: 0, hasNextPage: false, items: [] }` — never an error |
| `minPrice` > `maxPrice` | `BAD_REQUEST` — `minPrice must not exceed maxPrice`                    |

---

## `collections`

Returns all active collections with their categories and product families. Feeds the catalogue page collection tabs and navigation.

**Source:** `backend/src/modules/collections/`

**Query**

```graphql
query {
  collections {
    id
    slug
    heroImageUrl
    name
    description
    categories {
      id
      slug
      name
      description
      productFamilies {
        id
        slug
        name
      }
    }
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ collections { id slug heroImageUrl name description categories {id slug name description productFamilies { id slug name }} } }"}' | jq
```

**Arguments**

None.

**Response type: `[CollectionsType]`**

| Field          | Type                       | Nullable | Description                             |
| -------------- | -------------------------- | -------- | --------------------------------------- |
| `id`           | `String`                   | No       | UUID                                    |
| `slug`         | `String`                   | No       | URL-friendly identifier                 |
| `heroImageUrl` | `String`                   | No       | Banner image URL                        |
| `name`         | `String`                   | No       | Display name                            |
| `description`  | `String`                   | Yes      | Editorial description                   |
| `categories`   | `[CollectionCategoryType]` | No       | Categories belonging to this collection |

**`CollectionCategoryType`**

| Field             | Type                            | Nullable | Description                           |
| ----------------- | ------------------------------- | -------- | ------------------------------------- |
| `id`              | `String`                        | No       | UUID                                  |
| `slug`            | `String`                        | No       | URL-friendly identifier               |
| `name`            | `String`                        | No       | Display name                          |
| `description`     | `String`                        | Yes      | Editorial description                 |
| `productFamilies` | `[CollectionProductFamilyType]` | No       | Product families within this category |

**`CollectionProductFamilyType`**

| Field  | Type     | Nullable | Description             |
| ------ | -------- | -------- | ----------------------- |
| `id`   | `String` | No       | UUID                    |
| `slug` | `String` | No       | URL-friendly identifier |
| `name` | `String` | No       | Display name            |

**Errors**

None — returns an empty array `[]` when no active collections exist.

---

## `collection(slug)`

Returns a single active collection by slug, with its categories and product families.

**Source:** `backend/src/modules/collections/`

**Query**

```graphql
query {
  collection(slug: "clean-beauty-skincare") {
    id
    slug
    heroImageUrl
    name
    description
    categories {
      id
      slug
      name
      description
      productFamilies {
        id
        slug
        name
      }
    }
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ collection(slug: \"clean-beauty-skincare\") { id slug heroImageUrl name description categories { id slug name description productFamilies {id slug name } } } }"}' | jq
```

**Arguments**

| Argument | Type     | Required | Description                        |
| -------- | -------- | -------- | ---------------------------------- |
| `slug`   | `String` | Yes      | URL-friendly collection identifier |

**Response type: `CollectionsType`**

Same shape as a single item from [`collections`](#collections) — see field tables above.

**Errors**

| Case                                  | Message                |
| ------------------------------------- | ---------------------- |
| Slug not found or collection inactive | `COLLECTION_NOT_FOUND` |

---

## `wishlist`

Returns the authenticated user's wishlist as full product cards — the same `ProductType` shape as [`product(slug)`](#productslug), directly renderable by `ProductCard` on the frontend without transformation. Scoped strictly to the caller, ordered most-recently-added first. Returns an empty list (never an error) when the wishlist is empty. Products that have since been deactivated or deleted are silently dropped from the result rather than causing an error.

**Source:** `backend/src/modules/wishlist/`

**Requires authentication** — see [Authentication](#authentication).

**Query**

```graphql
query {
  wishlist {
    id
    slug
    name
    badges
    minPrice
    primaryImage {
      id
      url
      altText
      isPrimary
    }
    media {
      id
      url
      altText
      position
      isPrimary
    }
    variants {
      id
      label
      isAvailable
      price
      isOnSale
      discountPercentage
    }
    categories {
      id
      slug
      name
    }
    productFamilies {
      id
      slug
      name
    }
    collections {
      id
      slug
      name
    }
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ wishlist { id slug name badges minPrice primaryImage { id url altText isPrimary } media { id url altText position isPrimary } variants { id label isAvailable price isOnSale discountPercentage } categories { id slug name } productFamilies { id slug name } collections { id slug name } } }"}' | jq
```

**Arguments**

None — always scoped to the caller identified by the access token.

**Response type: `[ProductType]`**

Same shape as a single item returned by [`product(slug)`](#productslug) — see the field tables there.

**Errors**

| Case                              | Message / behavior            |
| --------------------------------- | ----------------------------- |
| Missing, invalid or expired token | `401 Unauthorized`            |
| Wishlist is empty                 | Returns `[]` — never an error |

---

## `adminUsers(filter, pagination)`

Returns a paginated list of users for the admin management table: identity (`id`, `name`, `email`, `handle`), `role`, `status` and join date. Excludes every sensitive field — no password hash, no tokens. **Admin-only.**

**Source:** `backend/src/modules/admin-user/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Query**

```graphql
query {
  adminUsers(
    filter: { role: ADMIN, status: ACTIVE, sort: JOINED_AT_DESC }
    pagination: { page: 1, limit: 20 }
  ) {
    total
    hasNextPage
    items {
      id
      name
      email
      handle
      role
      status
      joinedAt
    }
  }
}
```

**curl example — filtered and sorted**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ adminUsers(filter: { role: ADMIN, status: ACTIVE, sort: JOINED_AT_DESC }, pagination: { page: 1, limit: 20 }) { total hasNextPage items { id name email handle role status joinedAt } } }"}' | jq
```

**curl example — no arguments (defaults)**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ adminUsers { total hasNextPage items { name role status } } }"}' | jq
```

**Arguments**

| Argument     | Type                       | Required | Description                                                   |
| ------------ | -------------------------- | -------- | ------------------------------------------------------------- |
| `filter`     | `AdminUserFilterInput`     | No       | Filter and sort criteria — all fields optional and combinable |
| `pagination` | `AdminUserPaginationInput` | No       | Page and limit — defaults to page 1, limit 20                 |

**`AdminUserFilterInput`**

| Field    | Type                 | Description                                                                                      |
| -------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| `role`   | `UserRole`           | Keep only users with this role (`USER` or `ADMIN`)                                               |
| `status` | `UserStatus`         | Keep only users with this status (`ACTIVE`, `SUSPENDED` or `DELETED`)                            |
| `sort`   | `AdminUserSortOrder` | Sort order — see [`AdminUserSortOrder`](#adminusersortorder) below. Defaults to `JOINED_AT_DESC` |

All fields are optional and combinable. Omitting `filter` entirely returns every user.

### `AdminUserSortOrder`

| Value            | Description                          |
| ---------------- | ------------------------------------ |
| `NAME_ASC`       | Name, A→Z                            |
| `NAME_DESC`      | Name, Z→A                            |
| `ROLE_ASC`       | By role, ascending                   |
| `ROLE_DESC`      | By role, descending                  |
| `STATUS_ASC`     | By status, ascending                 |
| `STATUS_DESC`    | By status, descending                |
| `JOINED_AT_ASC`  | Oldest account first                 |
| `JOINED_AT_DESC` | Most recently joined first (default) |

> **Note on role/status ordering:** `ROLE_ASC`/`STATUS_ASC` order by the enum's **declaration order in the Prisma schema**, not alphabetically — `UserRole` is declared `USER` then `ADMIN` (so `ROLE_ASC` lists all `USER` accounts before `ADMIN`), and `UserStatus` is declared `ACTIVE`, `SUSPENDED`, `DELETED` (so `STATUS_ASC` lists `ACTIVE` first, `DELETED` last). `_DESC` reverses that order. Verified empirically — don't assume alphabetical.
>
> Every sort additionally applies `id ASC` as a tiebreaker, so users sharing the same role/status/name still get a stable, deterministic order across repeated calls and pages.

**`AdminUserPaginationInput`**

| Field   | Type  | Default | Description                     |
| ------- | ----- | ------- | ------------------------------- |
| `page`  | `Int` | `1`     | Page number (1-based, min 1)    |
| `limit` | `Int` | `20`    | Items per page (min 1, max 100) |

**Response type: `AdminUserPageType`**

| Field         | Type              | Nullable | Description                                                |
| ------------- | ----------------- | -------- | ---------------------------------------------------------- |
| `total`       | `Int`             | No       | Total number of users matching the filter across all pages |
| `hasNextPage` | `Boolean`         | No       | `true` if more pages exist beyond the current one          |
| `items`       | `[AdminUserType]` | No       | Users for the current page                                 |

**`AdminUserType`** (each item in `items`)

| Field      | Type         | Nullable | Description                        |
| ---------- | ------------ | -------- | ---------------------------------- |
| `id`       | `String`     | No       | UUID                               |
| `name`     | `String`     | No       | Display name                       |
| `email`    | `String`     | No       | Account email                      |
| `handle`   | `String`     | No       | Public handle                      |
| `role`     | `UserRole`   | No       | `USER` or `ADMIN`                  |
| `status`   | `UserStatus` | No       | `ACTIVE`, `SUSPENDED` or `DELETED` |
| `joinedAt` | `DateTime`   | No       | Account creation date              |

No other `User` field is exposed on this type — in particular no password hash, refresh tokens, API keys or bio.

**Errors**

| Case                               | Message / behavior                                                     |
| ---------------------------------- | ---------------------------------------------------------------------- |
| No users match the filter          | Returns `{ total: 0, hasNextPage: false, items: [] }` — never an error |
| Missing, invalid or expired token  | `401 Unauthorized`                                                     |
| Valid token, caller is not `ADMIN` | `403 Forbidden`                                                        |

---

## `adminUser(id)`

Returns a single user's admin detail view — the same field set as an item in [`adminUsers`](#adminusersfilter-pagination). **Admin-only.**

**Source:** `backend/src/modules/admin-user/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Query**

```graphql
query {
  adminUser(id: "00000000-0000-4000-8000-000000000002") {
    id
    name
    email
    handle
    role
    status
    joinedAt
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ adminUser(id: \"00000000-0000-4000-8000-000000000002\") { id name email handle role status joinedAt } }"}' | jq
```

**Arguments**

| Argument | Type            | Required | Description    |
| -------- | --------------- | -------- | -------------- |
| `id`     | `String` (UUID) | Yes      | Id of the user |

**Response type: `AdminUserType`**

Same shape as a single item from [`adminUsers`](#adminusersfilter-pagination) — see the field table above.

**Errors**

| Case                                     | Message / behavior                                         |
| ---------------------------------------- | ---------------------------------------------------------- |
| `id` does not reference an existing user | `USER_NOT_FOUND`                                           |
| `id` is not a valid UUID                 | `400 Bad Request` — `Validation failed (uuid is expected)` |
| Missing, invalid or expired token        | `401 Unauthorized`                                         |
| Valid token, caller is not `ADMIN`       | `403 Forbidden`                                            |

---

## `followersCount(userId)`

Returns the number of users following the given user. Public — no authentication required, returns only a count.

**Source:** `backend/src/modules/follows/`

**Query**

```graphql
query {
  followersCount(userId: "00000000-0000-4000-8000-000000000003")
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ followersCount(userId: \"00000000-0000-4000-8000-000000000003\") }"}' | jq
```

**Arguments**

| Argument | Type            | Required | Description             |
| -------- | --------------- | -------- | ----------------------- |
| `userId` | `String` (UUID) | Yes      | Id of the user to count |

**Response type: `Int`**

**Errors**

| Case                                         | Message / behavior                   |
| -------------------------------------------- | ------------------------------------ |
| `userId` does not reference an existing user | Returns `0` — never an error         |
| `userId` is not a valid UUID                 | GraphQL validation error (automatic) |

---

## `followingCount(userId)`

Returns the number of users the given user follows. Public — same behavior as [`followersCount`](#followerscountuserid), counted in the opposite direction.

**Source:** `backend/src/modules/follows/`

**Query**

```graphql
query {
  followingCount(userId: "00000000-0000-4000-8000-000000000003")
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ followingCount(userId: \"00000000-0000-4000-8000-000000000003\") }"}' | jq
```

**Arguments**

| Argument | Type            | Required | Description             |
| -------- | --------------- | -------- | ----------------------- |
| `userId` | `String` (UUID) | Yes      | Id of the user to count |

**Response type: `Int`**

**Errors**

| Case                                         | Message / behavior                   |
| -------------------------------------------- | ------------------------------------ |
| `userId` does not reference an existing user | Returns `0` — never an error         |
| `userId` is not a valid UUID                 | GraphQL validation error (automatic) |

---

## `userProfile(handle)`

Returns the public view of a user's profile: name, handle, bio, follower/following counts, and a small "recent activity" snapshot (last users followed, last products added to the wishlist). Public — no authentication required.

Suspended or deleted accounts have no public profile: the query behaves as if the handle didn't exist. The same visibility rule applies one level down — `followersCount`, `followingCount` and `recentFollows` only ever count or list accounts that are themselves `ACTIVE` and not deleted, so a suspended account silently drops out of everyone else's counts and activity the moment it's suspended.

**Source:** `backend/src/modules/profiles/`

**Query**

```graphql
query {
  userProfile(handle: "aura-fan") {
    id
    name
    handle
    bio
    followersCount
    followingCount
    recentFollows {
      id
      name
      handle
    }
    recentWishlistAdds {
      id
      slug
      name
      primaryImage {
        url
      }
    }
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ userProfile(handle: \"aura-fan\") { id name handle bio followersCount followingCount recentFollows { id name handle } recentWishlistAdds { id slug name } } }"}' | jq
```

**Arguments**

| Argument | Type     | Required | Description                        |
| -------- | -------- | -------- | ---------------------------------- |
| `handle` | `String` | Yes      | Public handle of the profile owner |

**Response type: `PublicProfileType`**

| Field                | Type                         | Nullable | Description                                             |
| -------------------- | ---------------------------- | -------- | ------------------------------------------------------- |
| `id`                 | `String`                     | No       | UUID                                                    |
| `name`               | `String`                     | No       | Display name                                            |
| `handle`             | `String`                     | No       | Public handle                                           |
| `bio`                | `String`                     | Yes      | Profile bio                                             |
| `followersCount`     | `Int`                        | No       | Number of active accounts following this user           |
| `followingCount`     | `Int`                        | No       | Number of active accounts this user follows             |
| `recentFollows`      | `[PublicProfileSummaryType]` | No       | Up to 5 most recently followed users, newest first      |
| `recentWishlistAdds` | `[ProductType]`              | No       | Up to 5 most recently wishlisted products, newest first |

No other `User` field is exposed — in particular no `email`, `role`, `status`, password hash, refresh tokens or API keys.

**`PublicProfileSummaryType`**

| Field    | Type     | Nullable | Description   |
| -------- | -------- | -------- | ------------- |
| `id`     | `String` | No       | UUID          |
| `name`   | `String` | No       | Display name  |
| `handle` | `String` | No       | Public handle |

**`recentWishlistAdds` response type**

Same `ProductType` shape as [`product(slug)`](#productslug) — see the field table there.

**Errors**

| Case                                                   | Message / behavior                      |
| ------------------------------------------------------ | --------------------------------------- |
| `handle` does not reference an existing user           | `USER_NOT_FOUND`                        |
| `handle` references a `SUSPENDED` or `DELETED` account | `USER_NOT_FOUND` — same as non-existent |

---

## `notifications(unreadOnly)`

Caller's notifications, newest first. `unreadOnly: true` filters to unread only. Requires authentication.

**Source:** `backend/src/modules/notifications/`

```graphql
query {
  notifications(unreadOnly: true) {
    id
    type
    actorId
    body
    readAt
    createdAt
  }
}
```

| Field     | Type               | Description                                     |
| --------- | ------------------ | ----------------------------------------------- |
| `type`    | `NotificationKind` | `MESSAGE` \| `FOLLOW` \| `WISHLIST` \| `SYSTEM` |
| `actorId` | `String?`          | Who triggered it, if anyone                     |
| `body`    | `String?`          | Truncated to 500 chars                          |
| `readAt`  | `DateTime?`        | `null` while unread                             |

**Errors:** `401` if unauthenticated.

---

## `AnalyticsPeriod`

Shared by every query below — one period drives every chart on the dashboard, and the bucket size (the granularity of each returned point) grows with the period so a chart never renders an unusable number of points.

| Value           | Range                 | Bucket size |
| --------------- | --------------------- | ----------- |
| `TODAY`         | Since midnight today  | Hour        |
| `LAST_WEEK`     | Last 7 days           | Day         |
| `LAST_MONTH`    | Last 1 month          | Day         |
| `LAST_6_MONTHS` | Last 6 months         | Week        |
| `ALL_TIME`      | Since the first event | Month       |

`bucket` in every response below is the start of that bucket (e.g. midnight for a day bucket, the 1st for a month bucket), truncated with Postgres `date_trunc`.

---

## `registrationsOverTime(period)`

Registration counts (`USER_REGISTERED` events), bucketed over the given period. **Admin-only.**

**Source:** `backend/src/modules/analytics-reports/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Query**

```graphql
query {
  registrationsOverTime(period: LAST_MONTH) {
    bucket
    count
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ registrationsOverTime(period: LAST_MONTH) { bucket count } }"}' | jq
```

**Arguments**

| Argument | Type              | Required | Description                                     |
| -------- | ----------------- | -------- | ----------------------------------------------- |
| `period` | `AnalyticsPeriod` | Yes      | See [`AnalyticsPeriod`](#analyticsperiod) above |

**Response type: `[AnalyticsTimeSeriesPointType]`**

| Field    | Type       | Nullable | Description                              |
| -------- | ---------- | -------- | ---------------------------------------- |
| `bucket` | `DateTime` | No       | Start of the bucket                      |
| `count`  | `Int`      | No       | Number of matching events in that bucket |

**Errors**

| Case                               | Message / behavior            |
| ---------------------------------- | ----------------------------- |
| No registrations in the period     | Returns `[]` — never an error |
| Missing, invalid or expired token  | `401 Unauthorized`            |
| Valid token, caller is not `ADMIN` | `403 Forbidden`               |

---

## `messagesOverTime(period)`

Message-sent counts (`MESSAGE_SENT` events), bucketed over the given period. Same shape and behavior as [`registrationsOverTime`](#registrationsovertimeperiod). **Admin-only.**

**Source:** `backend/src/modules/analytics-reports/`

**Requires ADMIN role** — see [Authentication](#authentication).

```graphql
query {
  messagesOverTime(period: LAST_WEEK) {
    bucket
    count
  }
}
```

**Response type:** `[AnalyticsTimeSeriesPointType]` — see [`registrationsOverTime`](#registrationsovertimeperiod).

**Errors:** same as [`registrationsOverTime`](#registrationsovertimeperiod).

---

## `followsOverTime(period)`

Follow counts (`USER_FOLLOWED` events), bucketed over the given period. Same shape and behavior as [`registrationsOverTime`](#registrationsovertimeperiod). **Admin-only.**

Only counts follows created after the event was wired up — see `docs/conventions/analytics-events.md`.

**Source:** `backend/src/modules/analytics-reports/`

**Requires ADMIN role** — see [Authentication](#authentication).

```graphql
query {
  followsOverTime(period: LAST_6_MONTHS) {
    bucket
    count
  }
}
```

**Response type:** `[AnalyticsTimeSeriesPointType]` — see [`registrationsOverTime`](#registrationsovertimeperiod).

**Errors:** same as [`registrationsOverTime`](#registrationsovertimeperiod).

---

## `activeUsersOverTime(period)`

Number of **distinct** users with at least one analytics event (of any type) in each bucket over the given period — not limited to a specific action. **Admin-only.**

**Source:** `backend/src/modules/analytics-reports/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Query**

```graphql
query {
  activeUsersOverTime(period: ALL_TIME) {
    bucket
    count
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ activeUsersOverTime(period: ALL_TIME) { bucket count } }"}' | jq
```

**Response type:** `[AnalyticsTimeSeriesPointType]` — see [`registrationsOverTime`](#registrationsovertimeperiod). Here `count` is `COUNT(DISTINCT actorId)` per bucket, not a raw event count.

**Errors:** same as [`registrationsOverTime`](#registrationsovertimeperiod).

---

## `topProductsByWishlistAdds(period, limit)`

Products ranked by number of `WISHLIST_ITEM_ADDED` events in the given period, highest first. **Admin-only.**

**Source:** `backend/src/modules/analytics-reports/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Query**

```graphql
query {
  topProductsByWishlistAdds(period: LAST_MONTH, limit: 5) {
    productId
    name
    slug
    wishlistAdds
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ topProductsByWishlistAdds(period: LAST_MONTH, limit: 5) { productId name slug wishlistAdds } }"}' | jq
```

**Arguments**

| Argument | Type              | Required | Description                                       |
| -------- | ----------------- | -------- | ------------------------------------------------- |
| `period` | `AnalyticsPeriod` | Yes      | See [`AnalyticsPeriod`](#analyticsperiod) above   |
| `limit`  | `Int`             | No       | Max number of products to return — defaults to 10 |

**Response type: `[TopWishlistedProductType]`**

| Field          | Type     | Nullable | Description                                 |
| -------------- | -------- | -------- | ------------------------------------------- |
| `productId`    | `String` | No       | UUID                                        |
| `name`         | `String` | No       | Product display name                        |
| `slug`         | `String` | No       | URL-friendly identifier                     |
| `wishlistAdds` | `Int`    | No       | Number of wishlist-add events in the period |

**Errors**

| Case                               | Message / behavior            |
| ---------------------------------- | ----------------------------- |
| No wishlist adds in the period     | Returns `[]` — never an error |
| Missing, invalid or expired token  | `401 Unauthorized`            |
| Valid token, caller is not `ADMIN` | `403 Forbidden`               |

---

# Mutation Reference

> All mutations below require an `Authorization: Bearer <accessToken>` header — see [Authentication](#authentication).

## `addWishlistItem(input)`

Adds a product to the authenticated user's wishlist. Scoped strictly to the caller — the target user is always the one identified by the access token, never a client-supplied id. Idempotent: adding an already-wishlisted product is a no-op that returns the existing entry instead of creating a duplicate or erroring.

**Source:** `backend/src/modules/wishlist/`

**Mutation**

```graphql
mutation {
  addWishlistItem(input: { productId: "20000000-0000-4000-8000-000000000005" }) {
    id
    productId
    createdAt
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { addWishlistItem(input: { productId: \"20000000-0000-4000-8000-000000000005\" }) { id productId createdAt } }"}' | jq
```

**Arguments**

| Argument | Type                | Required | Description |
| -------- | ------------------- | -------- | ----------- |
| `input`  | `WishlistItemInput` | Yes      | See below   |

**`WishlistItemInput`**

| Field       | Type            | Required | Description              |
| ----------- | --------------- | -------- | ------------------------ |
| `productId` | `String` (UUID) | Yes      | Id of the product to add |

**Response type: `WishlistItemType`**

| Field       | Type       | Nullable | Description                                                  |
| ----------- | ---------- | -------- | ------------------------------------------------------------ |
| `id`        | `String`   | No       | UUID of the wishlist entry                                   |
| `productId` | `String`   | No       | Id of the wishlisted product                                 |
| `createdAt` | `DateTime` | No       | When the product was first added — unchanged on repeat calls |

**Errors**

| Case                                               | Message                              |
| -------------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token                  | `401 Unauthorized`                   |
| `productId` does not reference an existing product | `PRODUCT_NOT_FOUND`                  |
| `productId` is not a valid UUID                    | GraphQL validation error (automatic) |

---

## `removeWishlistItem(input)`

Removes a product from the authenticated user's wishlist. Scoped strictly to the caller, same as `addWishlistItem`. Idempotent: removing a product that isn't currently wishlisted is also a no-op — it still returns `true`, since the desired end state ("not in the wishlist") is already satisfied.

**Source:** `backend/src/modules/wishlist/`

**Mutation**

```graphql
mutation {
  removeWishlistItem(input: { productId: "20000000-0000-4000-8000-000000000005" })
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { removeWishlistItem(input: { productId: \"20000000-0000-4000-8000-000000000005\" }) }"}' | jq
```

**Arguments**

Same `WishlistItemInput` as [`addWishlistItem`](#addwishlistiteminput).

**Response type: `Boolean`**

Always `true` once the call succeeds, whether the entry existed beforehand or not.

**Errors**

| Case                                               | Message                              |
| -------------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token                  | `401 Unauthorized`                   |
| `productId` does not reference an existing product | `PRODUCT_NOT_FOUND`                  |
| `productId` is not a valid UUID                    | GraphQL validation error (automatic) |

---

## `followUser(input)`

Follows another user. Scoped strictly to the caller — the follower is always the one identified by the access token, never a client-supplied id. Idempotent: following an already-followed user is a no-op that returns `true` without creating a duplicate relationship. Following yourself is rejected.

**Source:** `backend/src/modules/follows/`

**Mutation**

```graphql
mutation {
  followUser(input: { targetUserId: "00000000-0000-4000-8000-000000000003" })
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { followUser(input: { targetUserId: \"00000000-0000-4000-8000-000000000003\" }) }"}' | jq
```

**Arguments**

| Argument | Type          | Required | Description |
| -------- | ------------- | -------- | ----------- |
| `input`  | `FollowInput` | Yes      | See below   |

**`FollowInput`**

| Field          | Type            | Required | Description              |
| -------------- | --------------- | -------- | ------------------------ |
| `targetUserId` | `String` (UUID) | Yes      | Id of the user to follow |

**Response type: `Boolean`**

Always `true` once the call succeeds, whether the relationship was just created or already existed.

**Errors**

| Case                                               | Message                              |
| -------------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token                  | `401 Unauthorized`                   |
| `targetUserId` is the caller's own id              | `CANNOT_FOLLOW_SELF`                 |
| `targetUserId` does not reference an existing user | `USER_NOT_FOUND`                     |
| `targetUserId` is not a valid UUID                 | GraphQL validation error (automatic) |

---

## `unfollowUser(input)`

Unfollows a user. Scoped strictly to the caller, same as `followUser`. Idempotent: unfollowing a user you don't currently follow is also a no-op — it still returns `true`, since the desired end state ("not following") is already satisfied.

**Source:** `backend/src/modules/follows/`

**Mutation**

```graphql
mutation {
  unfollowUser(input: { targetUserId: "00000000-0000-4000-8000-000000000003" })
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { unfollowUser(input: { targetUserId: \"00000000-0000-4000-8000-000000000003\" }) }"}' | jq
```

**Arguments**

Same `FollowInput` as [`followUser`](#followuserinput).

**Response type: `Boolean`**

Always `true` once the call succeeds, whether the relationship existed beforehand or not.

**Errors**

| Case                               | Message                              |
| ---------------------------------- | ------------------------------------ |
| Missing, invalid or expired token  | `401 Unauthorized`                   |
| `targetUserId` is not a valid UUID | GraphQL validation error (automatic) |

---

## `markNotificationRead(input)`

Marks one notification as read. If it doesn't belong to the caller, returns `NOTIFICATION_NOT_FOUND` — same as if it didn't exist.

**Source:** `backend/src/modules/notifications/`

```graphql
mutation {
  markNotificationRead(input: { notificationId: "60000000-0000-4000-8000-000000000001" }) {
    id
    readAt
  }
}
```

Input: `{ notificationId: String! }`. Response: `NotificationType` (see [`notifications`](#notificationsunreadonly)), with `readAt` now set.

**Errors:** `401` unauthenticated · `NOTIFICATION_NOT_FOUND` unknown or not yours.

---

## `markAllNotificationsRead`

Marks all the caller's unread notifications as read. Returns the count marked (`0` if nothing was unread).

**Source:** `backend/src/modules/notifications/`

```graphql
mutation {
  markAllNotificationsRead
}
```

No arguments. Response: `Int`.

**Errors:** `401` if unauthenticated.

---

## `adminSetUserRole(userId, role)`

Changes a user's role between `USER` and `ADMIN`. **Admin-only.**

**Guardrail:** an admin can never change their own role through this mutation — rejected outright, regardless of the requested role. This is an explicit server-side guard, not just a frontend confirmation dialog, so a single admin account can't accidentally demote itself and lock everyone out.

**Source:** `backend/src/modules/admin-user/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminSetUserRole(userId: "00000000-0000-4000-8000-000000000003", role: ADMIN) {
    id
    name
    email
    role
    status
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminSetUserRole(userId: \"00000000-0000-4000-8000-000000000003\", role: ADMIN) { id name email role status } }"}' | jq
```

**Arguments**

| Argument | Type            | Required | Description                                |
| -------- | --------------- | -------- | ------------------------------------------ |
| `userId` | `String` (UUID) | Yes      | Id of the user whose role is being changed |
| `role`   | `UserRole`      | Yes      | New role to assign (`USER` or `ADMIN`)     |

**Response type: `AdminUserType`**

Same shape as a single item from [`adminUsers`](#adminusersfilter-pagination) — see the field table above.

**Errors**

| Case                                         | Message                              |
| -------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token            | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`           | `403 Forbidden`                      |
| `userId` is the caller's own id              | `CANNOT_CHANGE_OWN_ROLE`             |
| `userId` does not reference an existing user | `USER_NOT_FOUND`                     |
| Target user's status is `DELETED`            | `USER_DELETED`                       |
| `userId` is not a valid UUID                 | GraphQL validation error (automatic) |

---

## `adminSuspendUser(userId)`

Suspends a user account. A suspended user can no longer sign in (the `login` mutation rejects any account whose status isn't `ACTIVE`) and every one of their refresh-token sessions is revoked immediately — an already-issued refresh token stops working right away instead of only failing on its next natural rotation. **Admin-only.**

**Guardrail:** an admin can never suspend their own account through this mutation — rejected outright.

**Source:** `backend/src/modules/admin-user/` (session revocation delegates to `RefreshTokenService.revokeAllForUser` in `backend/src/modules/auth/refresh/`)

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminSuspendUser(userId: "00000000-0000-4000-8000-000000000004") {
    id
    email
    status
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminSuspendUser(userId: \"00000000-0000-4000-8000-000000000004\") { id email status } }"}' | jq
```

**Arguments**

| Argument | Type            | Required | Description               |
| -------- | --------------- | -------- | ------------------------- |
| `userId` | `String` (UUID) | Yes      | Id of the user to suspend |

**Response type: `AdminUserType`**

Same shape as a single item from [`adminUsers`](#adminusersfilter-pagination) — see the field table above.

**Errors**

| Case                                         | Message                              |
| -------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token            | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`           | `403 Forbidden`                      |
| `userId` is the caller's own id              | `CANNOT_SUSPEND_OWN_ACCOUNT`         |
| `userId` does not reference an existing user | `USER_NOT_FOUND`                     |
| Target user's status is already `SUSPENDED`  | `USER_ALREADY_SUSPENDED`             |
| Target user's status is `DELETED`            | `USER_DELETED`                       |
| `userId` is not a valid UUID                 | GraphQL validation error (automatic) |

---

## `adminReinstateUser(userId)`

Reactivates a suspended user, setting their status back to `ACTIVE` so they can sign in again. **Admin-only.**

Only valid for a user whose status is currently `SUSPENDED` — reinstating an already-active account, or a deleted one, is rejected rather than silently ignored. Deleted accounts are not meant to come back through this mutation.

**Source:** `backend/src/modules/admin-user/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminReinstateUser(userId: "00000000-0000-4000-8000-000000000004") {
    id
    email
    status
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminReinstateUser(userId: \"00000000-0000-4000-8000-000000000004\") { id email status } }"}' | jq
```

**Arguments**

| Argument | Type            | Required | Description                 |
| -------- | --------------- | -------- | --------------------------- |
| `userId` | `String` (UUID) | Yes      | Id of the user to reinstate |

**Response type: `AdminUserType`**

Same shape as a single item from [`adminUsers`](#adminusersfilter-pagination) — see the field table above.

**Errors**

| Case                                         | Message                              |
| -------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token            | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`           | `403 Forbidden`                      |
| `userId` does not reference an existing user | `USER_NOT_FOUND`                     |
| Target user's status is not `SUSPENDED`      | `USER_NOT_SUSPENDED`                 |
| `userId` is not a valid UUID                 | GraphQL validation error (automatic) |

---

## `adminDeleteUser(userId)`

Soft-deletes a user: status is set to `DELETED` and `deletedAt` is timestamped. Sign-in is blocked immediately and every refresh-token session is revoked, same as [`adminSuspendUser`](#adminsuspenduseruserid). The row itself is never removed — actual data cleanup is left to a future background job. **Admin-only.**

**Guardrail:** an admin can never delete their own account through this mutation — rejected outright.

**Source:** `backend/src/modules/admin-user/` (session revocation delegates to `RefreshTokenService.revokeAllForUser` in `backend/src/modules/auth/refresh/`)

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminDeleteUser(userId: "00000000-0000-4000-8000-000000000004") {
    id
    email
    status
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminDeleteUser(userId: \"00000000-0000-4000-8000-000000000004\") { id email status } }"}' | jq
```

**Arguments**

| Argument | Type            | Required | Description              |
| -------- | --------------- | -------- | ------------------------ |
| `userId` | `String` (UUID) | Yes      | Id of the user to delete |

**Response type: `AdminUserType`**

Same shape as a single item from [`adminUsers`](#adminusersfilter-pagination) — see the field table above.

**Errors**

| Case                                         | Message                              |
| -------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token            | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`           | `403 Forbidden`                      |
| `userId` is the caller's own id              | `CANNOT_DELETE_OWN_ACCOUNT`          |
| `userId` does not reference an existing user | `USER_NOT_FOUND`                     |
| Target user's status is already `DELETED`    | `USER_ALREADY_DELETED`               |
| `userId` is not a valid UUID                 | GraphQL validation error (automatic) |
