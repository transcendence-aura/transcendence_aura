# Branch protection

`main` is a protected branch.

- No direct pushes. All changes reach `main` through a pull request.
- CI must pass before merge: the lint, typecheck and build checks are required,
  and the Docker build check is required on pull requests targeting `main`.
- The branch must be up to date with `main` before merging.
- Force pushes are blocked.

The team works on feature branches off `dev`, opens pull requests into `dev`,
and merges `dev` into `main` only when a phase is complete.
See[../../CONTRIBUTING.md](../../CONTRIBUTING.md) for the full workflow.
