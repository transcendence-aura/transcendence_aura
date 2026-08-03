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

- [product(slug)](#productslug) — Single product with images and variants
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

Returns a single product with its image gallery and size/volume variants. Feeds the product detail page.

**Source:** `backend/src/modules/products/`

**Query**

```graphql
query {
  product(slug: "purifying-gel-cleanser") {
    id
    slug
    name
    description
    media {
      id
      url
      altText
      position
    }
    variants {
      id
      label
      isAvailable
      price
    }
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ product(slug: \"purifying-gel-cleanser\") { id name description media { url altText position } variants { id label isAvailable price } } }"}' | jq
```

**Arguments**

| Argument | Type     | Required | Description                     |
| -------- | -------- | -------- | ------------------------------- |
| `slug`   | `String` | Yes      | URL-friendly product identifier |

**Response type: `ProductType`**

| Field         | Type                   | Nullable | Description                   |
| ------------- | ---------------------- | -------- | ----------------------------- |
| `id`          | `String`               | No       | UUID                          |
| `slug`        | `String`               | No       | URL-friendly identifier       |
| `name`        | `String`               | No       | Display name                  |
| `description` | `String`               | Yes      | Long description              |
| `media`       | `[ProductMediaType]`   | No       | Ordered image gallery         |
| `variants`    | `[ProductVariantType]` | No       | Available size/volume options |

**`ProductMediaType`**

| Field      | Type     | Nullable | Description                       |
| ---------- | -------- | -------- | --------------------------------- |
| `id`       | `String` | No       | UUID                              |
| `url`      | `String` | No       | Image URL                         |
| `altText`  | `String` | Yes      | Accessibility label               |
| `position` | `Int`    | No       | Gallery display order (ascending) |

**`ProductVariantType`**

| Field         | Type      | Nullable | Description                     |
| ------------- | --------- | -------- | ------------------------------- |
| `id`          | `String`  | No       | UUID                            |
| `label`       | `String`  | No       | Size/volume label (e.g. "50ml") |
| `isAvailable` | `Boolean` | No       | Stock availability              |
| `price`       | `Float`   | No       | Price in euros                  |

**Errors**

| Case                               | Message             |
| ---------------------------------- | ------------------- |
| Slug not found or product inactive | `PRODUCT_NOT_FOUND` |

---

## `collections`

Returns all active collections. Feeds the catalogue page collection tabs.

**Source:** `backend/src/modules/collections/`

**Query**

```graphql
query {
  collections {
    id
    slug
    name
    description
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ collections { id slug name description } }"}' | jq
```

**Arguments**

None.

**Response type: `[CollectionsType]`**

| Field         | Type     | Nullable | Description             |
| ------------- | -------- | -------- | ----------------------- |
| `id`          | `String` | No       | UUID                    |
| `slug`        | `String` | No       | URL-friendly identifier |
| `name`        | `String` | No       | Display name            |
| `description` | `String` | Yes      | Editorial description   |

**Errors**

None — returns an empty array `[]` when no active collections exist.

---

## `collection(slug)`

Returns a single active collection by slug.

**Source:** `backend/src/modules/collections/`

**Query**

```graphql
query {
  collection(slug: "clean-beauty-skincare") {
    id
    slug
    name
    description
  }
}
```

**curl example**

```bash
curl -k -X POST https://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ collection(slug: \"clean-beauty-skincare\") { id slug name description } }"}' | jq
```

**Arguments**

| Argument | Type     | Required | Description                        |
| -------- | -------- | -------- | ---------------------------------- |
| `slug`   | `String` | Yes      | URL-friendly collection identifier |

**Response type: `CollectionsType`**

| Field         | Type     | Nullable | Description             |
| ------------- | -------- | -------- | ----------------------- |
| `id`          | `String` | No       | UUID                    |
| `slug`        | `String` | No       | URL-friendly identifier |
| `name`        | `String` | No       | Display name            |
| `description` | `String` | Yes      | Editorial description   |

**Errors**

| Case                                  | Message                |
| ------------------------------------- | ---------------------- |
| Slug not found or collection inactive | `COLLECTION_NOT_FOUND` |
