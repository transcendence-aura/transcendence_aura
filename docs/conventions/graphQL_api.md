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
- [adminCollections(filter)](#admincollectionsfilter) — Flat list of every collection, active and inactive, for admin pickers. Admin-only
- [adminCategories(filter)](#admincategoriesfilter) — Flat list of every category, active and inactive, optionally scoped to a collection, for admin pickers. Admin-only
- [adminProductFamilies(filter)](#adminproductfamiliesfilter) — Flat list of every product family, active and inactive, optionally scoped to a category, for admin pickers. Admin-only
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
- [adminCreateProduct(input)](#admincreateproductinput) — Create a product; slug is auto-generated from `name`. Admin-only
- [adminUpdateProduct(id, input)](#adminupdateproductid-input) — Partially update a product; renaming regenerates the slug. Admin-only
- [adminDeleteProduct(id)](#admindeleteproductid) — Soft-delete a product (`isActive: false`), reversible. Admin-only
- [adminAddProductVariant(productId, input)](#adminaddproductvariantproductid-input) — Add a size/format variant to a product. Admin-only
- [adminUpdateProductVariant(variantId, input)](#adminupdateproductvariantvariantid-input) — Partially update a variant. Admin-only
- [adminDeleteProductVariant(variantId)](#admindeleteproductvariantvariantid) — Permanently delete a variant (hard delete). Admin-only
- [POST /api/v1/admin/products/:productId/images](#post-apiv1adminproductsproductidimages) — Upload a product image (REST, not GraphQL). Admin-only
- [adminReorderProductImages(productId, input)](#adminreorderproductimagesproductid-input) — Reorder a product's images; the first id becomes primary. Admin-only
- [adminSetPrimaryProductImage(productId, imageId)](#adminsetprimaryproductimageproductid-imageid) — Make one image the primary image. Admin-only
- [adminDeleteProductImage(productId, imageId)](#admindeleteproductimageproductid-imageid) — Permanently delete a product image (hard delete + file removal). Admin-only

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

## `adminCollections(filter)`

Returns every collection — active **and** inactive — as a flat, unpaginated list. Used by the admin panel to populate a collection picker (e.g. when creating a category). Read-only: there is no mutation to create, edit or delete a `Collection` — the catalog taxonomy (`Collection`/`Category`/`ProductFamily`) is exclusively managed via `backend/prisma/seed.ts`. **Admin-only.**

**Source:** `backend/src/modules/admin-collection/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Query**

```graphql
query {
  adminCollections(filter: { isActive: true }) {
    id
    slug
    name
    description
    heroImageUrl
    isActive
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ adminCollections { id slug name description heroImageUrl isActive } }"}' | jq
```

**curl example — only active collections**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ adminCollections(filter: { isActive: true }) { id name } }"}' | jq
```

**Arguments**

| Argument | Type                         | Required | Description                                                                    |
| -------- | ---------------------------- | -------- | ------------------------------------------------------------------------------ |
| `filter` | `AdminCollectionFilterInput` | No       | Optional filter — omitting it (or `isActive`) returns both active and inactive |

**`AdminCollectionFilterInput`**

| Field      | Type      | Description                                                          |
| ---------- | --------- | -------------------------------------------------------------------- |
| `isActive` | `Boolean` | Keep only collections with this active state. Omitted → returns both |

**Response type: `[AdminCollectionType]`**

| Field          | Type      | Nullable | Description                                |
| -------------- | --------- | -------- | ------------------------------------------ |
| `id`           | `String`  | No       | UUID                                       |
| `slug`         | `String`  | No       | URL-friendly identifier                    |
| `name`         | `String`  | No       | Display name                               |
| `description`  | `String`  | Yes      | Editorial description                      |
| `heroImageUrl` | `String`  | No       | Banner image URL                           |
| `isActive`     | `Boolean` | No       | Whether the collection is currently active |

**Errors**

| Case                               | Message / behavior            |
| ---------------------------------- | ----------------------------- |
| No collection matches the filter   | Returns `[]` — never an error |
| Missing, invalid or expired token  | `401 Unauthorized`            |
| Valid token, caller is not `ADMIN` | `403 Forbidden`               |

---

## `adminCategories(filter)`

Returns every category — active **and** inactive — as a flat list, optionally scoped to one collection. Used by the admin panel to populate a category picker (e.g. when creating a product or a product family). Read-only — no mutation exists to create, edit or delete a `Category`. **Admin-only.**

**Source:** `backend/src/modules/admin-category/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Query**

```graphql
query {
  adminCategories(filter: { collectionId: "10000000-0000-4000-8000-000000000001" }) {
    id
    slug
    name
    description
    isActive
    collectionId
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ adminCategories { id slug name isActive collectionId } }"}' | jq
```

**curl example — scoped to one collection**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ adminCategories(filter: { collectionId: \"10000000-0000-4000-8000-000000000001\" }) { id name } }"}' | jq
```

**Arguments**

| Argument | Type                       | Required | Description                                              |
| -------- | -------------------------- | -------- | -------------------------------------------------------- |
| `filter` | `AdminCategoryFilterInput` | No       | Optional filter — omitting a field drops that constraint |

**`AdminCategoryFilterInput`**

| Field          | Type            | Description                                       |
| -------------- | --------------- | ------------------------------------------------- |
| `collectionId` | `String` (UUID) | Keep only categories belonging to this collection |
| `isActive`     | `Boolean`       | Keep only categories with this active state       |

**Response type: `[AdminCategoryType]`**

| Field          | Type      | Nullable | Description                              |
| -------------- | --------- | -------- | ---------------------------------------- |
| `id`           | `String`  | No       | UUID                                     |
| `slug`         | `String`  | No       | URL-friendly identifier                  |
| `name`         | `String`  | No       | Display name                             |
| `description`  | `String`  | Yes      | Editorial description                    |
| `isActive`     | `Boolean` | No       | Whether the category is currently active |
| `collectionId` | `String`  | No       | Id of the parent collection              |

**Errors**

| Case                               | Message / behavior                   |
| ---------------------------------- | ------------------------------------ |
| No category matches the filter     | Returns `[]` — never an error        |
| Missing, invalid or expired token  | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN` | `403 Forbidden`                      |
| `collectionId` is not a valid UUID | GraphQL validation error (automatic) |

---

## `adminProductFamilies(filter)`

Returns every product family — active **and** inactive — as a flat list, optionally scoped to one category. Used by the admin panel to populate a product-family picker (e.g. when creating a product). Read-only — no mutation exists to create, edit or delete a `ProductFamily`. **Admin-only.**

**Source:** `backend/src/modules/admin-product-family/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Query**

```graphql
query {
  adminProductFamilies(filter: { categoryId: "11000000-0000-4000-8000-000000000001" }) {
    id
    slug
    name
    description
    isActive
    categoryId
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ adminProductFamilies { id slug name isActive categoryId } }"}' | jq
```

**curl example — scoped to one category**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"{ adminProductFamilies(filter: { categoryId: \"11000000-0000-4000-8000-000000000001\" }) { id name } }"}' | jq
```

**Arguments**

| Argument | Type                            | Required | Description                                              |
| -------- | ------------------------------- | -------- | -------------------------------------------------------- |
| `filter` | `AdminProductFamilyFilterInput` | No       | Optional filter — omitting a field drops that constraint |

**`AdminProductFamilyFilterInput`**

| Field        | Type            | Description                                           |
| ------------ | --------------- | ----------------------------------------------------- |
| `categoryId` | `String` (UUID) | Keep only product families belonging to this category |
| `isActive`   | `Boolean`       | Keep only product families with this active state     |

**Response type: `[AdminProductFamilyType]`**

| Field         | Type      | Nullable | Description                                    |
| ------------- | --------- | -------- | ---------------------------------------------- |
| `id`          | `String`  | No       | UUID                                           |
| `slug`        | `String`  | No       | URL-friendly identifier                        |
| `name`        | `String`  | No       | Display name                                   |
| `description` | `String`  | Yes      | Editorial description                          |
| `isActive`    | `Boolean` | No       | Whether the product family is currently active |
| `categoryId`  | `String`  | No       | Id of the parent category                      |

**Errors**

| Case                                 | Message / behavior                   |
| ------------------------------------ | ------------------------------------ |
| No product family matches the filter | Returns `[]` — never an error        |
| Missing, invalid or expired token    | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`   | `403 Forbidden`                      |
| `categoryId` is not a valid UUID     | GraphQL validation error (automatic) |

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

---

## `adminCreateProduct(input)`

Creates a new product. **Admin-only.**

**Slug generation:** `slug` is not an input field — it is always derived from `name` server-side (lowercased, accents stripped, non-alphanumeric characters collapsed to `-`). If the generated slug is already taken by another product, a numeric suffix (`-2`, `-3`, ...) is appended automatically until a free one is found — creating two products with the same `name` never fails.

**Associations:** `categoryIds`, `productFamilyIds` and `collectionIds` only **assign** existing categories/product families/collections by id — this mutation never creates catalog taxonomy on the fly (see [`adminCategories`](#admincategoriesfilter) / [`adminProductFamilies`](#adminproductfamiliesfilter) / [`adminCollections`](#admincollectionsfilter) to look up ids for a picker). Every id is validated to exist before the product is created; if any doesn't, nothing is created.

**Guardrail:** a product always starts inactive (`isActive: false`) — it has no variant yet ([`adminAddProductVariant`](#adminaddproductvariantproductid-input) runs afterwards, since a variant needs an existing `productId`), so it can never go live with no size/price to sell. `isActive` isn't even an input field here (a client trying to send it gets a GraphQL schema validation error, not a business error) — activate the product later with [`adminUpdateProduct`](#adminupdateproductid-input) once it has at least one variant.

**Source:** `backend/src/modules/admin-product/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminCreateProduct(
    input: {
      name: "Green Tea Serum"
      description: "A lightweight antioxidant serum."
      badges: ["NEW"]
      categoryIds: ["11000000-0000-4000-8000-000000000001"]
      productFamilyIds: ["12000000-0000-4000-8000-000000000002"]
      collectionIds: ["10000000-0000-4000-8000-000000000001"]
    }
  ) {
    id
    slug
    name
    description
    badges
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
  -d '{"query":"mutation { adminCreateProduct(input: { name: \"Green Tea Serum\", categoryIds: [\"11000000-0000-4000-8000-000000000001\"] }) { id slug name categories { id slug } } }"}' | jq
```

**Arguments**

| Argument | Type                      | Required | Description  |
| -------- | ------------------------- | -------- | ------------ |
| `input`  | `AdminCreateProductInput` | Yes      | Product data |

**`AdminCreateProductInput`**

| Field              | Type               | Required | Description                                                                    |
| ------------------ | ------------------ | -------- | ------------------------------------------------------------------------------ |
| `name`             | `String`           | Yes      | Display name (max 160 characters). Also the source for the auto-generated slug |
| `description`      | `String`           | No       | Long description                                                               |
| `badges`           | `[String]`         | No       | Marketing badges (each max 50 characters). Defaults to `[]`                    |
| `categoryIds`      | `[String]` (UUIDs) | No       | Categories to assign — every id must already exist                             |
| `productFamilyIds` | `[String]` (UUIDs) | No       | Product families to assign — every id must already exist                       |
| `collectionIds`    | `[String]` (UUIDs) | No       | Collections to assign — every id must already exist                            |

**Response type: `ProductType`**

Same shape as [`product(slug)`](#productslug) — see the field table there. `variants` is always `[]` right after creation; add variants with [`adminAddProductVariant`](#adminaddproductvariantproductid-input). Note: `isActive` is **not** a queryable field on `ProductType` — the response can't directly confirm the active state; check `products()`/search instead.

**Errors**

| Case                                                              | Message                              |
| ----------------------------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token                                 | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`                                | `403 Forbidden`                      |
| `name` is empty or longer than 160 characters                     | GraphQL validation error (automatic) |
| A `categoryIds` entry does not reference an existing category     | `CATEGORY_NOT_FOUND`                 |
| A `productFamilyIds` entry does not reference an existing family  | `PRODUCT_FAMILY_NOT_FOUND`           |
| A `collectionIds` entry does not reference an existing collection | `COLLECTION_NOT_FOUND`               |
| `name` slugifies to an empty string (e.g. only symbols/emoji)     | `PRODUCT_NAME_INVALID`               |

---

## `adminUpdateProduct(id, input)`

Partial update of an existing product — every `input` field is optional, only the ones provided are changed. **Admin-only.**

**Slug regeneration:** the slug is only recalculated when `name` is present in `input` **and** differs from the product's current stored name — omitting `name`, or resubmitting the same value, leaves the slug untouched. Renaming re-runs the same auto-dedup logic as [`adminCreateProduct`](#admincreateproductinput).

**Associations:** `categoryIds`/`productFamilyIds`/`collectionIds`, if provided, **replace** the full set of assignments (an empty array `[]` clears them). Omitting the field entirely leaves existing assignments untouched — this is a different behavior from `[]`.

**Guardrail:** `isActive: true` is rejected if the product currently has zero variants — add at least one with [`adminAddProductVariant`](#adminaddproductvariantproductid-input) first. This is the only way a product ever becomes active, since [`adminCreateProduct`](#admincreateproductinput) always creates it inactive.

**Source:** `backend/src/modules/admin-product/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminUpdateProduct(
    id: "20000000-0000-4000-8000-000000000001"
    input: { name: "Green Tea Serum - Reformulated", badges: ["SALE"] }
  ) {
    id
    slug
    name
    badges
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminUpdateProduct(id: \"20000000-0000-4000-8000-000000000001\", input: { description: \"Updated description\" }) { id name slug description } }"}' | jq
```

**curl example — clear all category assignments**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminUpdateProduct(id: \"20000000-0000-4000-8000-000000000001\", input: { categoryIds: [] }) { id categories { id } } }"}' | jq
```

**Arguments**

| Argument | Type                      | Required | Description                     |
| -------- | ------------------------- | -------- | ------------------------------- |
| `id`     | `String` (UUID)           | Yes      | Id of the product to update     |
| `input`  | `AdminUpdateProductInput` | Yes      | Fields to change — all optional |

**`AdminUpdateProductInput`**

Same fields as [`AdminCreateProductInput`](#admincreateproductinput), all optional (no field is required to update just one thing), plus one Update-only field:

| Field      | Type      | Description                                                                                                                      |
| ---------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `isActive` | `Boolean` | Rejected (`CANNOT_ACTIVATE_PRODUCT_WITHOUT_VARIANTS`) if set to `true` while the product has zero variants - see Guardrail above |

**Response type: `ProductType`**

Same shape as [`product(slug)`](#productslug) — see the field table there. `isActive` is not a queryable field on this type, same as [`adminCreateProduct`](#admincreateproductinput) — the response can't directly confirm the active state.

**Errors**

| Case                                                              | Message                                    |
| ----------------------------------------------------------------- | ------------------------------------------ |
| Missing, invalid or expired token                                 | `401 Unauthorized`                         |
| Valid token, caller is not `ADMIN`                                | `403 Forbidden`                            |
| `id` does not reference an existing product                       | `PRODUCT_NOT_FOUND`                        |
| `isActive: true` requested but the product has zero variants      | `CANNOT_ACTIVATE_PRODUCT_WITHOUT_VARIANTS` |
| A `categoryIds` entry does not reference an existing category     | `CATEGORY_NOT_FOUND`                       |
| A `productFamilyIds` entry does not reference an existing family  | `PRODUCT_FAMILY_NOT_FOUND`                 |
| A `collectionIds` entry does not reference an existing collection | `COLLECTION_NOT_FOUND`                     |
| `id` is not a valid UUID                                          | GraphQL validation error (automatic)       |

---

## `adminDeleteProduct(id)`

Soft-deletes a product: sets `isActive` to `false` server-side. The row itself, its variants, media and any wishlist entries pointing at it are left untouched — nothing is deleted, nothing is left dangling. **Admin-only.**

**Effect:** an inactive product disappears from the public [`products`](#productsfilter-pagination) listing/search, from other users' [`wishlist`](#wishlist) results, and from direct lookup via [`product(slug)`](#productslug) — all three now consistently return `PRODUCT_NOT_FOUND`. The action is reversible: call [`adminUpdateProduct`](#adminupdateproductid-input) with `{ isActive: true }` to reactivate. Calling this mutation twice on the same product is not an error — it's idempotent.

**Source:** `backend/src/modules/admin-product/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminDeleteProduct(id: "20000000-0000-4000-8000-000000000001") {
    id
    name
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminDeleteProduct(id: \"20000000-0000-4000-8000-000000000001\") { id name } }"}' | jq
```

**Arguments**

| Argument | Type            | Required | Description                      |
| -------- | --------------- | -------- | -------------------------------- |
| `id`     | `String` (UUID) | Yes      | Id of the product to soft-delete |

**Response type: `ProductType`**

Same shape as [`product(slug)`](#productslug) — see the field table there. `isActive` is not a queryable field on this type, so the response cannot directly confirm the new state — check [`products`](#productsfilter-pagination)/search instead.

**Errors**

| Case                                        | Message                              |
| ------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token           | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`          | `403 Forbidden`                      |
| `id` does not reference an existing product | `PRODUCT_NOT_FOUND`                  |
| `id` is not a valid UUID                    | GraphQL validation error (automatic) |

---

## `adminAddProductVariant(productId, input)`

Adds a size/format variant to an existing product. **Admin-only.**

**Source:** `backend/src/modules/admin-product/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminAddProductVariant(
    productId: "20000000-0000-4000-8000-000000000001"
    input: { label: "50ml", price: 24.99 }
  ) {
    id
    label
    price
    isAvailable
    isOnSale
    discountPercentage
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminAddProductVariant(productId: \"20000000-0000-4000-8000-000000000001\", input: { label: \"50ml\", price: 24.99 }) { id label price isAvailable } }"}' | jq
```

**Arguments**

| Argument    | Type                             | Required | Description                             |
| ----------- | -------------------------------- | -------- | --------------------------------------- |
| `productId` | `String` (UUID)                  | Yes      | Id of the product to add the variant to |
| `input`     | `AdminCreateProductVariantInput` | Yes      | Variant data                            |

**`AdminCreateProductVariantInput`**

| Field                | Type      | Required | Description                                                              |
| -------------------- | --------- | -------- | ------------------------------------------------------------------------ |
| `label`              | `String`  | Yes      | Size/volume label (max 50 characters), e.g. `"50ml"`. Unique per product |
| `price`              | `Float`   | Yes      | Base price in euros, ≥ 0, max 2 decimal places                           |
| `isAvailable`        | `Boolean` | No       | Defaults to `true`                                                       |
| `isOnSale`           | `Boolean` | No       | Defaults to `false`                                                      |
| `discountPercentage` | `Float`   | No       | 0–100, max 2 decimal places. Defaults to `0`                             |

**Response type: `ProductVariantType`**

Same shape as an item in `product(slug).variants` — see `ProductVariantType` under [`product(slug)`](#productslug).

**Errors**

| Case                                                        | Message                              |
| ----------------------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token                           | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`                          | `403 Forbidden`                      |
| `productId` does not reference an existing product          | `PRODUCT_NOT_FOUND`                  |
| `label` already used by another variant of the same product | `VARIANT_LABEL_TAKEN`                |
| `price` is negative or has more than 2 decimal places       | GraphQL validation error (automatic) |
| `productId` is not a valid UUID                             | GraphQL validation error (automatic) |

---

## `adminUpdateProductVariant(variantId, input)`

Partial update of an existing variant — every `input` field is optional. **Admin-only.**

**Source:** `backend/src/modules/admin-product/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminUpdateProductVariant(
    variantId: "30000000-0000-4000-8000-000000000001"
    input: { price: 19.99, isOnSale: true, discountPercentage: 15 }
  ) {
    id
    label
    price
    isOnSale
    discountPercentage
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminUpdateProductVariant(variantId: \"30000000-0000-4000-8000-000000000001\", input: { price: 19.99 }) { id label price } }"}' | jq
```

**Arguments**

| Argument    | Type                             | Required | Description                     |
| ----------- | -------------------------------- | -------- | ------------------------------- |
| `variantId` | `String` (UUID)                  | Yes      | Id of the variant to edit       |
| `input`     | `AdminUpdateProductVariantInput` | Yes      | Fields to change — all optional |

**`AdminUpdateProductVariantInput`**

| Field                | Type      | Description                                                            |
| -------------------- | --------- | ---------------------------------------------------------------------- |
| `label`              | `String`  | New label (max 50 characters). Must stay unique for the parent product |
| `price`              | `Float`   | New base price, ≥ 0, max 2 decimal places                              |
| `isAvailable`        | `Boolean` | New availability                                                       |
| `isOnSale`           | `Boolean` | New sale flag                                                          |
| `discountPercentage` | `Float`   | New discount rate, 0–100, max 2 decimal places                         |

Omitted fields are left unchanged.

**Response type: `ProductVariantType`**

Same shape as an item in `product(slug).variants` — see `ProductVariantType` under [`product(slug)`](#productslug).

**Errors**

| Case                                                        | Message                              |
| ----------------------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token                           | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`                          | `403 Forbidden`                      |
| `variantId` does not reference an existing variant          | `VARIANT_NOT_FOUND`                  |
| `label` already used by another variant of the same product | `VARIANT_LABEL_TAKEN`                |
| `variantId` is not a valid UUID                             | GraphQL validation error (automatic) |

---

## `adminDeleteProductVariant(variantId)`

Permanently deletes a variant. Unlike products, this is a **hard delete** — not reversible, and not soft. **Admin-only.**

**Guardrail:** refuses to delete a product's last remaining variant — a product with zero variants would have no size/price left to sell. Delete the whole product with [`adminDeleteProduct`](#admindeleteproductid) instead, or add a replacement variant first.

**Source:** `backend/src/modules/admin-product/`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminDeleteProductVariant(variantId: "30000000-0000-4000-8000-000000000001")
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminDeleteProductVariant(variantId: \"30000000-0000-4000-8000-000000000001\") }"}' | jq
```

**Arguments**

| Argument    | Type            | Required | Description                 |
| ----------- | --------------- | -------- | --------------------------- |
| `variantId` | `String` (UUID) | Yes      | Id of the variant to delete |

**Response type: `Boolean`**

`true` on success. The mutation throws rather than returning `false`, so a resolved response is always `true`.

**Errors**

| Case                                                                          | Message                              |
| ----------------------------------------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token                                             | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`                                            | `403 Forbidden`                      |
| `variantId` is the product's last remaining variant                           | `CANNOT_DELETE_LAST_VARIANT`         |
| `variantId` does not reference an existing variant (incl. calling this twice) | `VARIANT_NOT_FOUND`                  |
| `variantId` is not a valid UUID                                               | GraphQL validation error (automatic) |

---

## `POST /api/v1/admin/products/:productId/images`

Uploads one product image. This is a **plain REST endpoint**, not a GraphQL mutation — multipart file upload isn't wired up over GraphQL in this app (no `graphql-upload`). Ordering/primary/deletion of images stay as GraphQL mutations below, consistent with the rest of admin-product. **Admin-only.**

**Validation:**

- Only `image/jpeg` is accepted — checked against the real file content (via `image-size`), not just the client-supplied `Content-Type` or file extension, which are both spoofable.
- The image must be **square** (`width === height`) — anything else is rejected.
- Max file size: 5 MB (`nginx.conf`'s `/api/` location raises `client_max_body_size` to 6 MB so it doesn't reject legitimate uploads below the app-level limit itself). A file over 5 MB gets Nest/multer's own `413 "File too large"` — no custom handling needed, it's already clean.
- The uploaded filename is never used to build a path — the server always generates its own `<uuid>.jpeg`, so path traversal via a crafted filename isn't possible.

**Storage:** files are written under a persistent Docker volume (`product_uploads`, see `docker-compose.yml`) at `uploads/public/products/<productId>/<uuid>.jpeg`, and served back publicly (no auth) at `/api/uploads/products/<productId>/<uuid>.jpeg` via `NestExpressApplication.useStaticAssets()` — product images are public by design.

`MediaStorageService` (`backend/src/common/media/media-storage.service.ts`) also implements a `visibility: 'private'` mode that writes to a sibling root (`uploads/private/`) never registered with `useStaticAssets()`, so files saved that way can't be reached by any URL today. This is groundwork for the upcoming avatar upload feature - kept intentionally, not yet wired to any serving route.

**Ordering:** the new image is appended after the product's current highest `position`. The first upload for a product (position `0`) becomes primary automatically, per the existing `position === 0 → primary` convention (see [`ProductMediaType`](#productmediatype)).

**Source:** `backend/src/modules/admin-product/admin-product-image.controller.ts`

**Requires ADMIN role** — see [Authentication](#authentication).

**curl example**

```bash
curl -k -X POST https://localhost/api/v1/admin/products/20000000-0000-4000-8000-000000000001/images \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@./serum-front.jpeg;type=image/jpeg"
```

**Request**

| Field  | Type   | Required | Description                     |
| ------ | ------ | -------- | ------------------------------- |
| `file` | binary | Yes      | Multipart form field, one image |

**Response**

`200 OK` with just the created image, as plain JSON (`ProductMediaType` shape - `id`, `url`, `altText`, `position`, `isPrimary`) - not the whole product, callers only need to know what got uploaded.

**Errors**

| Case                                               | Response                                                                    |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| Missing, invalid or expired token                  | `401 Unauthorized`                                                          |
| Valid token, caller is not `ADMIN`                 | `403 Forbidden`                                                             |
| No `file` field in the request                     | `400` `IMAGE_FILE_REQUIRED`                                                 |
| `Content-Type` isn't `image/jpeg`                  | `400` `IMAGE_TYPE_NOT_ALLOWED`                                              |
| File content isn't actually a valid JPEG           | `400` `IMAGE_TYPE_NOT_ALLOWED`                                              |
| Image width and height differ                      | `400` `IMAGE_MUST_BE_SQUARE`                                                |
| File larger than 5 MB                              | `413` `"File too large"` (Nest/multer's default `PayloadTooLargeException`) |
| `productId` does not reference an existing product | `404` `PRODUCT_NOT_FOUND`                                                   |
| `productId` is not a valid UUID                    | `400` (GraphQL-style validation error via `ParseUUIDPipe`)                  |

---

## `adminReorderProductImages(productId, input)`

Reorders every image of a product in one call. Takes the **full** ordered list of that product's image ids — the first id becomes primary (`position: 0`). **Admin-only.**

**Source:** `backend/src/modules/admin-product/admin-product-image.service.ts`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminReorderProductImages(
    productId: "20000000-0000-4000-8000-000000000001"
    input: {
      imageIds: ["40000000-0000-4000-8000-000000000002", "40000000-0000-4000-8000-000000000001"]
    }
  ) {
    id
    media {
      id
      position
      isPrimary
    }
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminReorderProductImages(productId: \"20000000-0000-4000-8000-000000000001\", input: { imageIds: [\"40000000-0000-4000-8000-000000000002\", \"40000000-0000-4000-8000-000000000001\"] }) { id media { id position isPrimary } } }"}' | jq
```

**Arguments**

| Argument    | Type                             | Required | Description                                  |
| ----------- | -------------------------------- | -------- | -------------------------------------------- |
| `productId` | `String` (UUID)                  | Yes      | Id of the product whose images are reordered |
| `input`     | `AdminReorderProductImagesInput` | Yes      | Full ordered list of the product's image ids |

**`AdminReorderProductImagesInput`**

| Field      | Type               | Required | Description                                               |
| ---------- | ------------------ | -------- | --------------------------------------------------------- |
| `imageIds` | `[String]` (UUIDs) | Yes      | Every image id belonging to the product, in desired order |

**Response type: `ProductType`**

Same shape as [`product(slug)`](#productslug) — see the field table there.

**Errors**

| Case                                                                                                      | Message                              |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token                                                                         | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`                                                                        | `403 Forbidden`                      |
| `productId` does not reference an existing product                                                        | `PRODUCT_NOT_FOUND`                  |
| `imageIds` doesn't contain exactly the product's current image ids (missing, extra, or duplicate entries) | `IMAGE_ORDER_MISMATCH`               |
| `productId`/an `imageIds` entry is not a valid UUID                                                       | GraphQL validation error (automatic) |

---

## `adminSetPrimaryProductImage(productId, imageId)`

Convenience mutation to make one existing image primary without resubmitting the full order — internally moves it to `position: 0` and shifts the rest, preserving their relative order. **Admin-only.**

**Source:** `backend/src/modules/admin-product/admin-product-image.service.ts`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminSetPrimaryProductImage(
    productId: "20000000-0000-4000-8000-000000000001"
    imageId: "40000000-0000-4000-8000-000000000002"
  ) {
    id
    primaryImage {
      id
      url
    }
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminSetPrimaryProductImage(productId: \"20000000-0000-4000-8000-000000000001\", imageId: \"40000000-0000-4000-8000-000000000002\") { id primaryImage { id url } } }"}' | jq
```

**Arguments**

| Argument    | Type            | Required | Description                     |
| ----------- | --------------- | -------- | ------------------------------- |
| `productId` | `String` (UUID) | Yes      | Id of the product               |
| `imageId`   | `String` (UUID) | Yes      | Id of the image to make primary |

**Response type: `ProductType`**

Same shape as [`product(slug)`](#productslug) — see the field table there.

**Errors**

| Case                                      | Message                              |
| ----------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token         | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`        | `403 Forbidden`                      |
| `imageId` does not belong to `productId`  | `IMAGE_NOT_FOUND`                    |
| `productId`/`imageId` is not a valid UUID | GraphQL validation error (automatic) |

---

## `adminDeleteProductImage(productId, imageId)`

Permanently deletes a product image — **hard delete**, not reversible: removes the `Media` row and the underlying file, then re-sequences the remaining images' `position` values so they stay contiguous from `0`. **Admin-only.**

**Source:** `backend/src/modules/admin-product/admin-product-image.service.ts`

**Requires ADMIN role** — see [Authentication](#authentication).

**Mutation**

```graphql
mutation {
  adminDeleteProductImage(
    productId: "20000000-0000-4000-8000-000000000001"
    imageId: "40000000-0000-4000-8000-000000000002"
  ) {
    id
    media {
      id
      position
      isPrimary
    }
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"mutation { adminDeleteProductImage(productId: \"20000000-0000-4000-8000-000000000001\", imageId: \"40000000-0000-4000-8000-000000000002\") { id media { id position isPrimary } } }"}' | jq
```

**Arguments**

| Argument    | Type            | Required | Description               |
| ----------- | --------------- | -------- | ------------------------- |
| `productId` | `String` (UUID) | Yes      | Id of the product         |
| `imageId`   | `String` (UUID) | Yes      | Id of the image to delete |

**Response type: `ProductType`**

Same shape as [`product(slug)`](#productslug) — see the field table there.

**Errors**

| Case                                      | Message                              |
| ----------------------------------------- | ------------------------------------ |
| Missing, invalid or expired token         | `401 Unauthorized`                   |
| Valid token, caller is not `ADMIN`        | `403 Forbidden`                      |
| `imageId` does not belong to `productId`  | `IMAGE_NOT_FOUND`                    |
| `productId`/`imageId` is not a valid UUID | GraphQL validation error (automatic) |
