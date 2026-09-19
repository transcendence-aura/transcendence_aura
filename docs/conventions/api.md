# REST API Conventions

The REST API (`/backend/src/api`) exists independently from the GraphQL API.

All REST endpoints must follow the conventions defined in this document to ensure consistency across the application.

## Base URL

All public REST API endpoints are prefixed with `/api`.

Examples:

```
/api/v1/products
/api/v1/users
/api/v1/wishlists
```

## Versioning

The REST API uses URI versioning.

```
/api/v1
/api/v2
```

A few guidelines:

- Breaking changes require a new version
- Multiple versions may coexist during migration periods
- Older versions will follow the project's deprecation policy

NestJS configuration example:

```typescript
app.enableVersioning({
  type: VersioningType.URI,
});
```

## URL Naming

Resources use plural nouns:

```
GET /products
GET /users
GET /wishlists
```

Use lowercase and hyphens:

```
/product-reviews
```

Nested resources (when a resource belongs to another resource):

```
GET /products/{productId}/reviews
GET /users/{userId}/wishlist
GET /users/{userId}/followers
```

## Pagination

Collection endpoints must support pagination.

Example:

```
GET /products?page=2&limit=50
```

If omitted, the defaults are:

- page = 1
- limit = 25

## Response Envelope

Every successful response should use a consistent envelope.

**Examples**

Single resource:

```json
{
  "success": true,
  "data": {
    "id": "prod_1",
    "name": "Vitamin C Serum"
  }
}
```

Collection:

```json
{
  "success": true,
  "data": [
    {
      "id": "prod_1",
      "name": "Vitamin C Serum"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 240,
    "totalPages": 12
  }
}
```

Error responses should follow a consistent response envelope.

Example:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "The requested product could not be found."
  }
}
```

## End-to-end example

Example Endpoint - Retrieve a product by its identifier.

### Request

```http
GET /api/v1/products/prod_1
```

### Response

Status

```text
200 OK
```

Body

```json
{
  "success": true,
  "data": {
    "id": "prod_1",
    "name": "Vitamin C Serum"
  }
}
```
