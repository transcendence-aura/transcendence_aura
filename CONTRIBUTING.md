# Contributing to AURA

Read this document before making your first commit.

---

## Prerequisites

- Node.js 20+
- Docker + Docker Compose **or** Podman + Podman Compose
- npm *(no yarn, no pnpm)*
- Git

## Getting started

See `docs/setup/getting-started.md` for full installation steps.

---

## Daily workflow

```bash
# 1. Pick a Todo ticket in Linear (current Cycle)

# 2. Branch from dev
git checkout dev
git pull origin dev
git checkout -b [your-login]/scope-branch_name

# 3. Implement your changes

# 4. Before committing
npm run lint
npm run format
npm run typecheck

# 5. Commit
[type/scope] - short description [AUR-xx]

# 6. Push
git push origin [your-login]/scope-branch_name

# 7. Open a PR on GitHub targeting dev
# 8. Request review from at least one team member
# 9. Address review comments
# 10. Once approved → any member can merge branch → dev
#     Only Tech Lead or PM can merge dev → main
# 11. Move your Linear ticket to Done manually
# 12. Delete your branch after merge
```

---

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
* Chose React Query over useEffect for data fetching — avoids
  stale closure issues and provides caching out of the box.
* Validation handled in DTO layer rather than controller — keeps
  controllers thin and makes validation reusable across endpoints.
* Used httpOnly cookie for refresh token — prevents XSS access
  to the token from JavaScript.

## III. Tests Performed
Describe how you verified your changes work correctly.
Include test output, screenshots, or curl commands where relevant.
If no automated tests exist yet, explain how to manually verify.

## IV. Proof of Execution
Screenshot, terminal output, or screen recording showing the
feature working as expected.
Backend changes: paste the relevant request/response.
Frontend changes: attach a screenshot or short video.

## V. Checklist

### General — all PRs
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
- [ ] Podman build passes if tested (`make up-podman`)
- [ ] New environment variables added to `.env.example`
- [ ] CI pipeline passes on the PR branch

## VI. Linear ticket
[AUR-xx]
```

---

## What not to do

- Never push directly to `main` or `dev`
- Never commit `.env` files
- Never merge your own PR without a review
- Never use `git push --force` on shared branches
- Never leave a PR open for more than 48h without an update
- Never start a new feature while a PR is waiting for your review
