# Makefile Reference Manual

This manual provides an overview and detailed breakdown of each target available in the root `Makefile`.

---

## 1. Engine Compatibility & Tooling Checks

### Container Engine Auto-Detection

The Makefile automatically detects whether `docker` or `podman` is present on the host system:

- Defaults to `docker compose`.
- Automatically falls back to `podman compose` if Docker is absent.
- Can be manually overridden via CLI: `make COMPOSE="podman compose" <target>`.

### `make check-env`

**Summary**: Ensures the local configuration file `.env` is present at the project root.

- **Commands & Details**:
  - `test -f .env` : checks file existence.
  - Halts execution with exit code `1` if missing.

### `make check-certs`

**Summary**: Ensures SSL certificates exist before starting the Nginx reverse proxy.

- **Commands & Details**:
  - `test -f nginx/ssl/server.crt` : confirms server certificate exists.
  - Prompts to run `bash scripts/gen-certs.sh` if absent.

### `make check-engine`

**Summary**: Confirms that the container engine daemon (Docker or Podman) is running.

- **Commands & Details**:
  - `$(COMPOSE_RUN) version` : pings the container engine API.
  - Alerts if the service daemon is stopped.

### `make check-tools`

**Summary**: Audits required CLI tools on the host system without making changes.

- **Commands & Details**:
  - Verifies presence of `git`, `make`, `node`, and container engine runtime (`docker` or `podman`).

---

## 2. Setup & Installation

### `make setup`

**Summary**: Installs project dependencies across root, frontend, and backend packages.

- **Commands & Details**:
  - Runs `check-env`.
  - `npm run install:all` : installs node dependencies across all workspaces concurrently.

---

## 3. Vault Lifecycle

### `make vault-permissions`

**Summary**: Configures storage directory permissions for HashiCorp Vault.

- **Commands & Details**:
  - Applies `chown -R vault:vault` and `chmod 750` on `/vault/data`.
  - Safe for rootless Podman user namespaces via non-blocking execution.

### `make vault-start`

**Summary**: Starts the HashiCorp Vault container in the background.

- **Commands & Details**:
  - Depends on `vault-permissions`.
  - `$(COMPOSE_RUN) up -d vault` : starts Vault service.

### `make vault-init`

**Summary**: Initializes a fresh Vault instance if not already initialized.

- **Commands & Details**:
  - Runs `scripts/init-vault.sh` to generate recovery keys and initial root tokens.

### `make vault-unseal`

**Summary**: Unseals Vault using stored threshold keys.

- **Commands & Details**:
  - Runs `scripts/unseal-vault.sh` to unlock storage encryption engines.

### `make vault-bootstrap`

**Summary**: Provisions backend AppRole authentication and writes runtime secrets.

- **Commands & Details**:
  - Runs `scripts/bootstrap-vault-backend.sh` and generates `local-secrets/vault-secret-id`.

---

## 4. Main Stack Lifecycle

### `make dev`

**Summary**: Fast clean start for everyday development without deleting cached container images.

- **Commands & Details**:
  - Runs `clean` to purge containers, networks, and persistent data volumes.
  - Starts services via `up` (reusing existing image build cache).
  - Automatically seeds PostgreSQL with demo fixtures via `seed`.
  - Leaves application ready at `https://localhost`.

### `make start`

**Summary**: Full clean install and setup from scratch (recommended for evaluation or first boot).

- **Commands & Details**:
  - Runs `fclean` to purge all containers, networks, volumes, image caches, and local secrets.
  - Runs `up` to rebuild all images from scratch and configure Vault.
  - Seeds PostgreSQL cleanly via `seed`.
  - Exposes ready application at `https://localhost`.

### `make up`

**Summary**: Starts the development stack with automated secrets provisioning.

- **Commands & Details**:
  - Runs prerequisite checks (`check-env`, `check-certs`, `check-engine`) and `vault-bootstrap`.
  - Builds missing images and starts all services in the background.

### `make down`

**Summary**: Gracefully stops all active services and removes runtime networks.

- **Commands & Details**:
  - Halts containers, tears down bridge networks, and removes temporary Vault secret IDs. Preserves volumes.

### `make build`

**Summary**: Builds or rebuilds all container images without launching the containers.

- **Commands & Details**:
  - Runs `$(COMPOSE_RUN) build`.

### `make ps`

**Summary**: Shows container status, health, and port bindings.

- **Commands & Details**:
  - Runs `$(COMPOSE_RUN) ps`.

### `make logs`

**Summary**: Streams live consolidated logs from all active containers.

- **Commands & Details**:
  - Runs `$(COMPOSE_RUN) logs -f`.

---

## 5. Granular Rebuild & Service Operations

### `make front-rebuild`

**Summary**: Rebuilds and restarts the Next.js frontend container exclusively.

- **Commands & Details**:
  - Runs `$(COMPOSE_RUN) up -d --build --no-deps frontend`.

### `make back-rebuild`

**Summary**: Refreshes Vault credentials and rebuilds the NestJS backend container exclusively.

- **Commands & Details**:
  - Runs `vault-bootstrap`, then `$(COMPOSE_RUN) up -d --build --no-deps backend`.

### `make nginx-rebuild`

**Summary**: Rebuilds and restarts the Nginx reverse proxy.

- **Commands & Details**:
  - Runs `$(COMPOSE_RUN) up -d --build --no-deps nginx`.

### `make backend-restart`

**Summary**: Recreates backend container with a refreshed Vault token.

- **Commands & Details**:
  - Runs `vault-bootstrap`, then `$(COMPOSE_RUN) up -d --force-recreate backend`.

### `make front-logs` / `make back-logs` / `make nginx-logs`

**Summary**: Streams logs isolated to a specific container service.

---

## 6. Database Operations

### `make seed`

**Summary**: Resets database storage cleanly, applies all migrations, and inserts demo seed fixtures.

- **Commands & Details**:
  - Verifies `backend` container is running.
  - Destroys and recreates `postgres` volume to eliminate duplicate key conflicts.
  - Polls `pg_isready` dynamically until PostgreSQL accepts incoming connections.
  - Runs Prisma migrations via `prisma migrate deploy`.
  - Executes demo dataset population via seed runner container.

---

## 7. Cleanup & Infrastructure Reset

### `make clean`

**Summary**: Stops running containers and destroys persistent data volumes and orphan resources.

- **Commands & Details**:
  - Runs `$(COMPOSE_RUN) down -v --remove-orphans` and deletes temporary runtime tokens.

### `make fclean`

**Summary**: Completely wipes containers, volumes, local secrets, and locally built project images.

- **Commands & Details**:
  - Executes `clean`, prunes all local images (`--rmi all`), and wipes `local-secrets/vault*`.

---

## 8. Help Menu

### `make help`

**Summary**: Displays a categorized summary of all available targets with descriptions.
