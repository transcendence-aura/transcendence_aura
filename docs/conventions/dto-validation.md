# DTO Validation Conventions

All incoming API data must be validated before reaching the application. Our application uses:
 - `class-validator` for declarative validation rules
 - `class-transformer` for transforming incoming payloads into typed DTO instances
 - NestJS `ValidationPipe` for applying validation globally at the API boundary.

## Validation Responsibilities
DTOs define what data is valid.
Each DTO should:
 - declare expected fields
 - define validation rules using `class-validator` decorators
 - define transformation requirements using `class-transformer` where needed
 - represent the shape of data accepted by an endpoint

Example:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
	@IsEmail()
	email: string;

	@IsString()
	@MinLength(8)
	password: string;

	@IsString()
	displayName: string;
}
```

DTOs should not include:
 - business rules
 - database lookups
 - authorization checks
 - service calls
 - cross-resource validation

Nested DTO objects must use @ValidateNested() and @Type().
```typescript
@ValidateNested()
@Type(() => AddressDto)
address: AddressDto;
```

## ValidationPipe Responsibility
The NestJS `ValidationPipe` handles:
 - running DTO validation
 - transforming payloads into DTO instances
 - removing unknown properties
 - rejecting invalid requests
 - formatting validation errors

Example:

```typescript
app.useGlobalPipes (
	new ValidationPipe({
		transform: true,
		whitelist: true,
		forbidNonWhitelisted: true,
	}),
);
```

`transform: true` - all incoming request payloads are transformed into DTO instances

`whitelist: true` - properties without validation decorators are automatically removed.

`forbidNonWhitelisted: true` - unknown properties should cause a validation failure instead of being removed silently.

## Decorator Conventions
All request DTO properties must define validation decorators.

```typescript
export class CreateProductDto {
	@IsString()
	name: string;
}
```

## Common Decorator Usage
Required fields need to use `@IsDefined()` when a property must always exist.

`@IsOptional()` is used for optional request fields.

Integer
`@IsInt()`

Boolean `@IsBoolean()`

UUID `@IsUUID()`

Enum `@IsEnum()`

Array `@IsArray()` + item validation

Example:
```typescript
@IsArray()
@IsUUID('4', { each: true })
ids: string[];
```

## Request Lifecycle

HTTP Request --> Controller --> ValidationPipe --> DTO Validation --> Controller Method --> Service Layer --> Database

Example:
```typescript
@Post()
createUser(
	@Body() dto: CreateUserDto,
) {
	return this.usersService.create(dto);
}
```
## Validation Error Response
Validation failures return `400 Bad Request`.

Example:
```json
{
	"email": "invalid",
	"password": "abc123"
}
```

Response:
```json
{
	"statusCode": 400,
	"message": [
		"email is invalid",
		"password must be at least 8 characters"
	],
	"error": "Bad Request"
}
```

## Validation Error Format
Our application uses NestJS's default validation exception format.

Standard response:
```json
{
	"statusCode": 400,
	"message": [
		"field validation message"
	],
	"error": "Bad Request"
}
```
