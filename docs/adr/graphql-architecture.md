# GraphQL Code-First & NestJS Architecture

## Context

GraphQL needs a schema. A schema is a typed contract. It lists every
query, mutation, and object type the API can serve.

NestJS supports two ways to build this schema.

**Schema-first.** Write the schema by hand, in a `.graphql` file:

```graphql
type HealthStatus {
  status: String!
}
type Query {
  health: HealthStatus!
}
```

Then write a resolver that matches it. The file and the TypeScript code
are two separate sources of truth. They must be kept in sync by hand.

**Code-first.** Write only TypeScript, with decorators:

```typescript
@ObjectType()
class HealthStatus {
  @Field()
  status!: string;
}
```

NestJS reads the decorators and generates the schema automatically. One
source of truth: the code.

A schema-first setup needs the `.graphql` file present at runtime. Inside
Docker, that file wasn't reliably there, and the backend failed to boot.

## Decision

**Use GraphQL Code-First.**

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true, // schema built in memory, no .graphql file
});
```

**Organize code by feature, not by technical layer.** Each feature gets
one folder, with a 4-file structure:

```
src/modules/<feature>/
  <feature>.model.ts     <- @ObjectType (the schema)
  <feature>.service.ts   <- business logic and Prisma queries
  <feature>.resolver.ts  <- @Resolver, @Query (entry points)
  <feature>.module.ts    <- NestJS wiring
```

`modules/health/` skips `health.service.ts` — it has no business logic
yet — but `modules/products/` follows the full 4-file shape. See
[graphQL_api.md](../conventions/graphQL_api.md) for the day-to-day guide
on adding a new query; this ADR only covers why the shape was chosen.

Shared infrastructure that isn't a feature (Prisma, etc.) lives outside
`modules/`.

**Keep REST and GraphQL separate.** `src/api/` (REST) and `src/modules/`
(GraphQL) share no logic.

## Consequences

**Positive**

- The schema can't drift from the code — it's generated from it.
- No schema file needed at boot. This avoids the bug that started this
  decision.
- Feature folders are easy to navigate: everything about one feature
  lives in one place.

**Trade-offs**

- Less control over the exact generated SDL, compared to writing it by
  hand.
- REST and GraphQL stay separate, so exposing the same data through
  both means writing it twice.
