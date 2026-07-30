# Local Development

This page describes how to run the frontend and backend directly on your
machine, outside of containers. Running an app on its own is useful for fast
iteration and for isolating whether an issue comes from the app itself or from
the surrounding infrastructure.

## Prerequisites

- Node.js (version pinned in `.nvmrc` at the repo root; run `nvm use` to match).
- Dependencies installed for both apps: `npm run install:all` from the repo root.

## Running the apps

Each app is started from the repo root with a dedicated script. Run each one in
its own terminal so their logs stay separate and stopping one does not stop the
other.

| App      | Port | Start command          |
| -------- | ---- | ---------------------- |
| Frontend | 3000 | `npm run dev:frontend` |
| Backend  | 3001 | `npm run dev:backend`  |

The backend port is configurable through the `PORT` environment variable and
falls back to 3001 when unset. The frontend uses Next.js' default port 3000.

## Health check

Once the backend is running, confirm it responds:

```
curl -i http://localhost:3001/health
# HTTP/1.1 200 OK
# {"status":"ok"}
```

## Notes

- There is no single command that runs both apps at once. This is intentional:
  separate processes keep logs readable and make each app independently
  restartable.
- These port values are the reference used across the project's configuration.
  Keep them consistent wherever the apps are exposed or proxied.

# Seed the database

The stack must be running before executing `make seed`.
Start the stack by executing `make up` and then `make seed`
to run the Prisma seed script inside the running `backend` service.
