# GraphQL API

## Table of Contents

**Conventions**

- [Overview](#overview)
- [Endpoint](#endpoint)
- [Architecture](#architecture)
- [Development Tools](#development-tools)
- [Error Handling](#error-handling)
- [Adding a New Query](#adding-a-new-query)

**Query Reference**

- [product(slug)](#productslug) — Single product with images, variants, categories and badges
- [products(filter, pagination)](#productsfilter-pagination) — Paginated product list with filtering and full-text search
- [collections](#collections) — List of all active collections
- [collection(slug)](#collectionslug) — Single collection by slug

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

| Situation                 | Behavior                                            |
| ------------------------- | --------------------------------------------------- |
| Resource not found        | `NotFoundException` → clean GraphQL error, no crash |
| Invalid argument type     | GraphQL validation error (automatic)                |
| Missing required argument | GraphQL validation error (automatic)                |

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

## Adding a New Query

1. Create `backend/src/modules/<feature>/` with the 4-file structure.
2. Define `@ObjectType` classes in `<feature>.model.ts`.
3. Implement business logic in `<feature>.service.ts`.
4. Expose the query with `@Query()` in `<feature>.resolver.ts`.
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

| Field         | Type      | Nullable | Description                     |
| ------------- | --------- | -------- | ------------------------------- |
| `id`          | `String`  | No       | UUID                            |
| `label`       | `String`  | No       | Size/volume label (e.g. `50ml`) |
| `isAvailable` | `Boolean` | No       | Stock availability              |
| `price`       | `Float`   | No       | Price in euros                  |

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
      badge: "bestseller"
      sortByPrice: ASC
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
  -d '{"query":"{ products(filter: { search: \"vitamin c\", collectionSlug: \"clean-beauty-skincare\", categorySlug: \"face-care\", productFamilySlug: \"serum\", minPrice: 10, maxPrice: 50, badge: \"bestseller\", sortByPrice: ASC }, pagination: { page: 1, limit: 20 }) { total hasNextPage items { id slug name description badges minPrice primaryImage { id url altText isPrimary } media { id url altText position isPrimary } variants { id label isAvailable price } categories { id slug name } productFamilies { id slug name } collections { id slug name } } } }"}'  | jq
```

**curl example — sort by price descending**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(filter: { sortByPrice: DESC }, pagination: { page: 1, limit: 10 }) { total items { name minPrice } } }"}' | jq
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

| Field               | Type             | Description                                                                                    |
| ------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `collectionSlug`    | `String`         | Keep only products belonging to this collection                                                |
| `categorySlug`      | `String`         | Keep only products belonging to this category                                                  |
| `productFamilySlug` | `String`         | Keep only products belonging to this product family                                            |
| `badge`             | `String`         | Keep only products that have this badge (e.g. `"new"`, `"sale"`, `"bestseller"`)               |
| `minPrice`          | `Float`          | Keep only products with at least one available variant priced ≥ this value                     |
| `maxPrice`          | `Float`          | Keep only products with at least one available variant priced ≤ this value                     |
| `sortByPrice`       | `PriceSortOrder` | Sort results by min price — `ASC` (cheapest first) or `DESC` (most expensive first)            |
| `search`            | `String`         | Free-text search over product name and description — see [Full-text search](#full-text-search) |

All fields are optional and combinable. Omitting `filter` entirely returns all active products.

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

| Field         | Type            | Nullable | Description                                       |
| ------------- | --------------- | -------- | ------------------------------------------------- |
| `total`       | `Int`           | No       | Total number of products matching the filter      |
| `hasNextPage` | `Boolean`       | No       | `true` if more pages exist beyond the current one |
| `items`       | `[ProductType]` | No       | Products for the current page                     |

**`ProductType`** (each item in `items`)

| Field             | Type                      | Nullable | Description                                               |
| ----------------- | ------------------------- | -------- | --------------------------------------------------------- |
| `id`              | `String`                  | No       | UUID                                                      |
| `slug`            | `String`                  | No       | URL-friendly identifier                                   |
| `name`            | `String`                  | No       | Display name                                              |
| `description`     | `String`                  | Yes      | Long description                                          |
| `badges`          | `[String]`                | No       | Marketing badges (e.g. `"new"`, `"sale"`, `"bestseller"`) |
| `minPrice`        | `Float`                   | Yes      | Lowest price across available variants                    |
| `primaryImage`    | `ProductMediaType`        | Yes      | First media item (position 0) — used for catalogue cards  |
| `media`           | `[ProductMediaType]`      | No       | Full ordered image gallery                                |
| `variants`        | `[ProductVariantType]`    | No       | All size/volume options                                   |
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

| Field         | Type      | Nullable | Description                     |
| ------------- | --------- | -------- | ------------------------------- |
| `id`          | `String`  | No       | UUID                            |
| `label`       | `String`  | No       | Size/volume label (e.g. `50ml`) |
| `isAvailable` | `Boolean` | No       | Stock availability              |
| `price`       | `Float`   | No       | Price in euros                  |

**`ProductCategoryType`** / **`ProductFamilyType`** / **`ProductCollectionType`**

| Field  | Type     | Nullable | Description             |
| ------ | -------- | -------- | ----------------------- |
| `id`   | `String` | No       | UUID                    |
| `slug` | `String` | No       | URL-friendly identifier |
| `name` | `String` | No       | Display name            |

**Errors**

None — returns `{ total: 0, hasNextPage: false, items: [] }` when no products match.

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
