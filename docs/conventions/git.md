# Git Conventions

## Branch naming

```
[login]/scope-branch_name
```

### Allowed scopes

`auth` `frontend` `backend` `devops` `security` `database` `design` `docs`

### Examples

```
login1/auth-implement-jwt
login2/frontend-product-card
login3/devops-docker-compose
login4/docs-update-readme
```

Always branch from `dev`. Never from `main`.

```bash
git checkout dev
git pull origin dev
git checkout -b login1/auth-implement-jwt
```

---

## Commit format

```
[type/scope] - short description [AUR-xx]
 - optional bullet for context

[AUR-xx] --> is the ticket ID to be specified from linear
```

### Allowed types

| Type       | Usage                                      |
| ---------- | ------------------------------------------ |
| `feat`     | New feature or functionality               |
| `fix`      | Bug fix on existing functionality          |
| `hotfix`   | Critical fix required immediately          |
| `chore`    | Maintenance, tooling, dependency update    |
| `refactor` | Code restructuring without behavior change |
| `docs`     | Documentation addition or update           |
| `test`     | Test addition or update                    |
| `style`    | Formatting or linting fix, no logic change |

### Examples

```
[feat/auth] - implement JWT access token [AUR-23]

[fix/frontend] - correct login form validation [AUR-31]
 - error message was not shown on empty email field

[chore/devops] - update docker-compose port mapping [AUR-18]

[refactor/backend] - extract user validation into service [AUR-44]
 - logic was duplicated across auth and user modules

[docs/setup] - add getting-started instructions [AUR-9]
```

### Bullet point rules

- Use bullets only when the title alone is not enough to understand context
- Never describe obvious things visible in the diff
- Never include code in bullets
- Maximum 4 bullets per commit

---

## PR rules

### branch → dev

- Minimum **1 review** required
- Any team member can merge after approval

### dev → main

- Minimum **2 reviews** required
- **Only Tech Lead or PM can merge**
- Happens at major milestones only — not daily

## PR description template

```markdown
## I. Context & Objective

What is the purpose of this PR?
What problem does it solve or what feature does it introduce?
Where does it fit in the overall architecture?

## II. Key Changes & Design Decisions

List the meaningful changes made.
For each non-obvious decision, explain WHY this approach was chosen
over alternatives. Focus on intent and trade-offs, not on restating
what the diff already shows.

Examples of good entries:

- Chose React Query over useEffect for data fetching — avoids
  stale closure issues and provides caching out of the box.
- Validation handled in DTO layer rather than controller — keeps
  controllers thin and makes validation reusable across endpoints.
- Used httpOnly cookie for refresh token — prevents XSS access
  to the token from JavaScript.

## III. Tests Performed

Describe how you verified your changes work correctly.
Include test output, screenshots, or curl commands where relevant.
If no tests exist yet, explain how to manually verify the feature.

## IV. Proof of Execution

Screenshot, terminal output, or screen recording showing the
feature working as expected.
For backend changes: paste the relevant request/response.
For frontend changes: attach a screenshot or short video.

## V. Checklist

### General

- [ ] Branch created from `dev`
- [ ] Commits follow `[type/scope] - description [AUR-xx]` format
- [ ] Linear ticket ID referenced in all commits
- [ ] `npm run lint` passing with zero errors
- [ ] `npm run format` applied
- [ ] `npm run typecheck` passing with zero errors
- [ ] Self-reviewed the diff before requesting review
- [ ] No `console.log` left in the code
- [ ] No `.env` or secret committed
- [ ] Branch will be deleted after merge

Few examples:

### scope: frontend

- [ ] Component works on mobile, tablet and desktop
- [ ] Loading state handled
- [ ] Error state handled
- [ ] No hardcoded strings or magic numbers
- [ ] New reusable components added to `components/ui/`
- [ ] `"use client"` used only where strictly necessary

### scope: backend

- [ ] Input validation implemented (DTO + class-validator)
- [ ] Correct HTTP status codes returned
- [ ] No stack trace or internal info exposed in error responses
- [ ] New endpoint documented in `docs/api/` if part of public API

### scope: security

- [ ] No sensitive data logged
- [ ] No secrets hardcoded anywhere
- [ ] Auth guard applied on all protected routes
- [ ] Input sanitized against XSS and injection

### scope: database

- [ ] Prisma migration created for schema changes
- [ ] No breaking changes to existing tables without team validation
- [ ] Relations and constraints properly defined in Prisma schema
- [ ] Seed updated if new required data is introduced

### scope: devops

- [ ] Docker build passes locally (`make build`)
- [ ] New environment variables added to `.env.example`
- [ ] CI pipeline passes on the PR branch

## VI. Linear ticket

[AUR-xx]
```

---

## After merge

1. Move your Linear ticket to **Done** manually
2. Delete your branch after merge
3. Never reuse a merged branch — always create a new one
