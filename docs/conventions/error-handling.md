# Error Handling Conventions

All error responses use one consistent shape across the REST API —
including validation errors, which NestJS formats differently by default.

## Error Response Shape

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "The requested product could not be found."
  }
}
```

- `error.code`: stable, machine-readable (`UPPER_SNAKE_CASE`).
- `error.message`: short, human-readable, safe to show to the user.
- Never include `stack`, `path`, or any other internal/ORM detail.

## HTTP Status vs. `error.code`

The HTTP status gives the category, `error.code` gives the precise
reason — several codes can share one status.

Example: `404` → `PRODUCT_NOT_FOUND`, `USER_NOT_FOUND`.
`409` → `USERNAME_TAKEN`, `EMAIL_ALREADY_EXISTS`.

| HTTP Status | Meaning                 | Example `error.code`                     |
| ----------- | ----------------------- | ---------------------------------------- |
| 400         | Validation failed       | `VALIDATION_ERROR`                       |
| 401         | Not authenticated       | `UNAUTHORIZED`                           |
| 403         | Not allowed             | `FORBIDDEN`                              |
| 404         | Not found               | `PRODUCT_NOT_FOUND`, `USER_NOT_FOUND`    |
| 409         | Conflict                | `USERNAME_TAKEN`, `EMAIL_ALREADY_EXISTS` |
| 500         | Unexpected server error | `INTERNAL_ERROR`                         |

## No Internal Detail Leaks

An unhandled exception must never crash the server or expose its
message/stack to the client. A global exception filter catches every
error and always responds with the shape above, defaulting to
`INTERNAL_ERROR` / 500 when nothing more specific applies.

## Validation Errors

NestJS's `ValidationPipe` returns its own default shape:

```json
{ "statusCode": 400, "message": ["email is invalid"], "error": "Bad Request" }
```

The global exception filter converts it to:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "email is invalid" } }
```

See [dto-validation.md](./dto-validation.md).
