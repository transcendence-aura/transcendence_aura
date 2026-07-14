# Code Style Conventions

## Tools

| Tool       | Purpose                          | Config location         |
| ---------- | -------------------------------- | ----------------------- |
| ESLint     | Static analysis, error detection | `/.eslintrc.js`         |
| Prettier   | Automatic formatting             | `/.prettierrc`          |
| TypeScript | Type safety (strict mode)        | `tsconfig.json`         |
| Husky      | Git hooks enforcement            | `/.husky/`              |
| Commitlint | Commit message validation        | `/commitlint.config.js` |

## Running locally

```bash
npm run lint          # ESLint on all files
npm run lint:fix      # auto-fix ESLint errors
npm run format        # Prettier on all files
npm run typecheck     # TypeScript check without emit
```

`lint` and `format` must both pass with zero errors before opening a PR.

---

## Naming conventions

Applies to both frontend and backend.

| Element            | Convention       | Example                   |
| ------------------ | ---------------- | ------------------------- |
| Files              | kebab-case       | `user-profile.tsx`        |
| React components   | PascalCase       | `UserProfile`             |
| Functions          | camelCase        | `getUserById`             |
| Variables          | camelCase        | `isLoading`               |
| Constants          | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`           |
| DB models          | PascalCase       | `User`, `WishlistItem`    |
| Hooks              | use + camelCase  | `useAuth`, `useProducts`  |
| Types / Interfaces | PascalCase       | `UserProfile`, `ApiError` |
| Enums              | PascalCase       | `UserRole`, `OrderStatus` |
| NestJS services    | PascalCase       | `AuthService`             |
| NestJS controllers | PascalCase       | `AuthController`          |
| NestJS modules     | PascalCase       | `AuthModule`              |
| NestJS DTOs        | PascalCase       | `CreateUserDto`           |
| NestJS guards      | PascalCase       | `JwtAuthGuard`            |

---

## TypeScript rules

Applies to both frontend and backend.

- `strict: true` enforced in all `tsconfig.json` files
- All functions must have explicit return types
- No `any` — use `unknown` when type is truly unknown
- No `any` exception: must be justified with an inline comment
- No non-null assertions (`!`) without an explanation comment
  — they bypass the compiler and can cause silent runtime crashes
- Prefer `interface` for object shapes (extendable, mergeable)
- Prefer `type` for unions, intersections, and primitives
- No implicit `undefined` — handle null cases explicitly

---

## General rules

Applies to both frontend and backend.

- No unused variables or imports (ESLint enforced)
- No `console.log` in committed code — use a logger service
- Max line length: **100 characters** (configured in `.prettierrc`)
- Trailing commas: **enabled** (ES5)
- Single quotes for strings (JS/TS convention — differs from C/C++)
- Semicolons: **enabled**
- No default exports except for Next.js pages and layouts
- Prefer named exports everywhere else
- No magic numbers — extract them as named constants
- One responsibility per function — if a function name needs "and",
  split it into two functions

---

## Frontend

### Folder structure

Feature-based. A component used in one feature stays in that feature.
A component shared across features moves to `components/ui/`.

```
src/
├── app/                    # Next.js App Router (routes, layouts, pages)
│   ├── (auth)/
│   ├── (shop)/
│   ├── (account)/
│   ├── (admin)/
│   ├── layout.tsx
│   └── page.tsx
│
├── features/               # One folder per domain
│   └── [feature]/
│       ├── components/     # Components scoped to this feature
│       ├── hooks/          # Hooks scoped to this feature
│       ├── services/       # API calls for this feature
│       └── types/          # Types scoped to this feature
│
├── components/
│   ├── ui/                 # Shared design system components
│   └── layout/             # Navbar, Footer, Sidebar
│
├── hooks/                  # Global reusable hooks
├── lib/                    # API client, Socket.io, React Query config
├── store/                  # Zustand global state
├── types/                  # Global TypeScript types
└── utils/                  # Pure utility functions
```

### React / Next.js best practices

- **Prefer Server Components by default** in App Router
  — they run on the server, reduce JS sent to the client, and can
  fetch data directly without exposing API keys to the browser
- Use `"use client"` only when strictly necessary
  — required for: hooks, event handlers, browser APIs
- **Never use `useEffect` to fetch data**
  — use Server Components for server-side data, React Query for
  client-side data. `useEffect` fetching causes empty flash,
  has no cache, and is prone to race conditions
- Co-locate component styles, tests, and types in the same folder
- One component per file
- Extract custom hooks for any reusable stateful logic
- Use `loading.tsx` and `error.tsx` at route level for states

### Import order

Enforced automatically by ESLint. Must follow this order:

1. Node built-ins (`fs`, `path`...)
2. External packages (`react`, `next`...)
3. Internal aliases (`@/components`, `@/features`...)
4. Relative imports (`./utils`, `../hooks`...)

---

## Backend

### Folder structure

_(To be defined in Phase 2 with the backend team.
The structure will follow NestJS module conventions
and will be documented here once validated.)_

---

### NestJS best practices

- One module per domain — never mix responsibilities across modules
- Controllers handle HTTP only — no business logic in controllers
- Services contain all business logic
- DTOs validate all incoming data (class-validator + class-transformer)
- Never access Prisma directly from a controller — always via a service
- Use `@Injectable()` and dependency injection — never instantiate
  services manually
- Use NestJS built-in exception classes (`NotFoundException`,
  `UnauthorizedException`, etc.) — never throw raw errors
- Use `ConfigService` for all environment variables — never use
  `process.env` directly outside of config files

### Error handling

- Always return appropriate HTTP status codes
- Never expose stack traces or internal error messages to the client
- Use global exception filters for consistent error responses
- Error response format (to be finalized in Phase 2):

```typescript
// Standard error response shape
{
  statusCode: number;
  message: string;
  error: string;
}
```

### Import order

Enforced automatically by ESLint. Must follow this order:

1. Node built-ins (`fs`, `path`...)
2. External packages (`@nestjs/...`, `prisma`...)
3. Internal aliases if configured
4. Relative imports (`./auth.service`, `../common/guards`...)

---

## Database (Prisma)

_(To be defined in Phase 2 — naming conventions for models,
fields, relations, and migration naming strategy.)_

---

## WebSocket / Real-Time

_(To be defined in Phase 7 — event naming conventions,
payload structure, and error handling for Socket.io.)_
