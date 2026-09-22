# Backend Vault configuration

## Overview

HashiCorp Vault is used to load sensitive backend application configuration during startup.

Vault runs as a persistent single-node server using integrated Raft storage rather than development mode. This allows Vault-managed secrets and configuration to survive normal `make down` / `make up` cycles.

Vault initialization, unsealing, AppRole configuration, policy setup, and secret bootstrapping are handled automatically before the backend starts.

The backend does not receive Vault administrative credentials. It authenticates using AppRole and is restricted to the secret paths and capabilities required by the application.

Vault authentication and required-secret validation are completed before NestJS initializes. If Vault authentication fails or a required secret is missing, startup is aborted and the backend does not accept requests.

The current Vault configuration is intended for local development and evaluation. It uses a single node, local unseal material, and TLS-disabled internal communication.
It should not be treated as a production Vault deployment.

## Startup sequence

```text
Start Vault
→ Initialize Vault if required
→ Unseal Vault if required
→ Configure KV v2, policies, AppRole, and application secrets
→ Read non-secret Vault bootstrap configuration
→ Read the AppRole SecretID from the mounted secret file
→ Authenticate to Vault using the RoleID and SecretID
→ Receive a short-lived Vault token
→ Read the configured KV v2 secret
→ Validate every required secret
→ Build the typed application configuration
→ Initialize NestJS
→ Start the HTTP listener
```

## Required application secrets

The following keys must exist in Vault:

| Key                     | Purpose                      |
| ----------------------- | ---------------------------- |
| `POSTGRES_URL`          | Prisma PostgreSQL connection |
| `JWT_ACCESS_SECRET`     | Access-token signing         |
| `REDIS_URL`             | Redis connection             |
| `TWO_FACTOR_ENCRYPTION` | 2FA encryption key           |

Secret values must never be committed to source control or included in application logs.

## Vault paths

The local development configuration uses:

```text
KV mount: secret
Secret path: aura-backend/development
```

The Vault CLI path is:

```text
secret/aura-backend/development
```

The KV v2 HTTP API and policy path is:

```text
secret/data/aura-backend/development
```

## Backend environment variables

The backend receives only the non-secret values required to locate and authenticate to Vault.

| Variable                   | Required | Description                                         |
| -------------------------- | -------: | --------------------------------------------------- |
| `VAULT_ADDR`               |      Yes | Vault address accessible from the backend container |
| `VAULT_ROLE_ID`            |      Yes | AppRole RoleID                                      |
| `VAULT_SECRET_ID_FILE`     |      Yes | Path to the mounted SecretID file                   |
| `VAULT_SECRET_PATH`        |      Yes | KV secret path without the mount or `/data/` prefix |
| `VAULT_KV_MOUNT`           |       No | KV mount name; defaults to `secret`                 |
| `VAULT_AUTH_PATH`          |       No | AppRole auth mount; defaults to `approle`           |
| `VAULT_REQUEST_TIMEOUT_MS` |       No | Vault request timeout in milliseconds               |
| `VAULT_NAMESPACE`          |       No | Vault Enterprise namespace, when applicable         |

## Files excluded from source control

```gitignore
/local-secrets/
local-secrets/vault-root-token
local-secrets/vault-secret-id
local-secrets/vault-unseal-key
```

## AppRole policy

The backend policy grants read access only to the application’s KV v2 secret:

```hcl
path "secret/data/aura-backend/development" {
  capabilities = ["read"]
}
```

The path must exactly match the secret path used by the seed command and backend configuration.

## AppRole configuration

The local backend AppRole is configured with a short-lived batch token and a reusable SecretID:

```bash
vault_exec write \
  "auth/approle/role/$ROLE_NAME" \
  token_policies="$POLICY_NAME" \
  token_no_default_policy=true \
  token_type="batch" \
  token_ttl="5m" \
  token_max_ttl="15m" \
  secret_id_ttl="0" \
  secret_id_num_uses=0
```

| Setting                   |            Value | Purpose                                                  |
| ------------------------- | ---------------: | -------------------------------------------------------- |
| `token_policies`          | `backend-policy` | Attaches the least-privilege backend policy              |
| `token_no_default_policy` |           `true` | Prevents the default policy from being attached          |
| `token_type`              |          `batch` | Issues lightweight, non-renewable startup tokens         |
| `token_ttl`               |             `5m` | Sets the issued token lifetime                           |
| `token_max_ttl`           |            `15m` | Sets the maximum token lifetime                          |
| `secret_id_ttl`           |              `0` | SecretID does not expire for development                 |
| `secret_id_num_uses`      |              `0` | Allows unlimited authentications during the SecretID TTL |

For local-development convenience, `secret_id_num_uses=0` means that Vault does not enforce a use-count limit.

Batch tokens are not explicitly revoked by the backend. Their exposure is limited through:

- A short token lifetime.
- A least-privilege policy.
- Exclusion of Vault’s default policy.
- Use only during backend startup.

## Development secret seeding

Secrets are seeded from the host to the Vault CLI during bootstrap and input redirection is performed by the host shell.

## SecretID delivery

The bootstrap script generates a SecretID and writes it to:

```text
local-secrets/vault-secret-id
```

Compose mounts it into the backend at:

```text
/run/secrets/vault_secret_id
```

The backend reads it from:

```text
VAULT_SECRET_ID_FILE=/run/secrets/vault_secret_id
```

The SecretID is written atomically:

- Create a temporary file.
- Write the generated SecretID.
- Apply restrictive ownership and permissions.
- Move the completed file to its final location.

The SecretID file must never be printed during debugging.

## Local startup flow

```bash
make up
```

### Command summary

| Command                | Purpose                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `make vault-env`       | Generate the development Vault root token when missing                                |
| `make vault-start`     | Generate the token when needed and start Vault                                        |
| `make vault-bootstrap` | Start Vault, configure policy/AppRole, seed secrets, and generate backend credentials |
| `make up`              | Bootstrap Vault and start the complete stack                                          |
| `make backend-restart` | Bootstrap Vault, generate fresh backend credentials, and force-recreate the backend   |

## Backend restart behavior

The backend may reuse its mounted SecretID for multiple AppRole authentications while the SecretID remains within its ten-minute TTL.

A normal restart may therefore succeed:

```bash
make backend-restart
```

After the SecretID expires, authentication fails closed. Generate a fresh SecretID and recreate the backend:

```bash
make backend-restart
make up
```

Automatic restart policies are compatible with the reusable SecretID during its TTL.
When this expires, repeated automatic restarts will continue to fail until a new SecretID is generated.

## Logging requirements

Logs must never include:

- Vault root tokens
- AppRole SecretIDs
- Vault client tokens
- Application secret values
- Request bodies
- Authorization headers
- Complete Vault responses
- Database or Redis connection URLs

## Production

A production deployment must have a Vault environment that includes:

- TLS.
- Persistent storage.
- Secure initialization and unseal handling.
- Audit logging.
- Backup and recovery procedures.
- Secure workload-identity delivery.
- An environment-appropriate authentication mechanism.
- Credential rotation and lease-management procedures.
- Production application secrets must not be seeded from a developer workstation.
