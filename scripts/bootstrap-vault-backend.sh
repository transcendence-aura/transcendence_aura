#!/bin/bash
set -eu

ROLE_NAME="aura-backend"
POLICY_NAME="backend-policy"

POLICY_FILE="/vault/aura/policies/backend-policy.hcl"

SECRET_ID_OUTPUT="local-secrets/vault-secret-id"
ENV_FILE=".env"

HOST_GID="${HOST_GID:-$(id -g)}"

read -r -a compose_command <<< "${COMPOSE_CMD:-docker compose}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE does not exist."
  exit 1
fi

VAULT_DEV_ROOT_TOKEN_ID="$(
  sed -n 's/^VAULT_DEV_ROOT_TOKEN_ID=//p' "$ENV_FILE" |
    tail -n 1
)"
: "${VAULT_DEV_ROOT_TOKEN_ID:?VAULT_DEV_ROOT_TOKEN_ID is required}"

vault_exec() {
  HOST_GID="$HOST_GID" \
    "${compose_command[@]}" exec -T \
      -e VAULT_ADDR="http://127.0.0.1:8200" \
      -e VAULT_TOKEN="$VAULT_DEV_ROOT_TOKEN_ID" \
      vault \
      vault "$@"
}

echo "Waiting for Vault..."

readonly max_attempts=20

for ((attempt = 1; attempt <= max_attempts; attempt++)); do
  if vault_exec status >/dev/null 2>&1; then
    break
  fi

  if ((attempt == max_attempts)); then
    fail "Vault did not become ready after ${max_attempts} attempts."
  fi

  sleep 1
done

echo "Configuring backend Vault access..."

vault_exec policy write \
  "$POLICY_NAME" \
  "$POLICY_FILE"

if ! vault_exec auth list -format=json |
  grep -q '"approle/"'; then
  vault_exec auth enable approle
fi

vault_exec write \
  "auth/approle/role/$ROLE_NAME" \
  token_policies="$POLICY_NAME" \
  token_no_default_policy=true \
  token_type="batch" \
  token_ttl="5m" \
  token_max_ttl="15m" \
  secret_id_ttl="10m" \
  secret_id_num_uses=0

SEED_FILE="local-secrets/vault-seed.json"
SECRET_PATH="aura-backend/development"

if [[ ! -r "$SEED_FILE" ]]; then
  fail "Vault seed file is missing or unreadable: $SEED_FILE"
fi

echo "Seeding Vault development secrets..."

"${compose_command[@]}" exec -T \
  -e VAULT_ADDR="http://127.0.0.1:8200" \
  -e VAULT_TOKEN="$VAULT_DEV_ROOT_TOKEN_ID" \
  vault \
  vault kv put \
    -mount=secret \
    "$SECRET_PATH" \
    - < "$SEED_FILE"

echo "Vault development secrets seeded."

role_id="$(
  vault_exec read \
    -field=role_id \
    "auth/approle/role/$ROLE_NAME/role-id"
)"

secret_id="$(
  vault_exec write \
    -field=secret_id \
    -f \
    "auth/approle/role/$ROLE_NAME/secret-id"
)"

secret_directory="$(dirname "$SECRET_ID_OUTPUT")"

mkdir -p "$secret_directory"
chmod 0750 "$secret_directory"

temporary_secret_file="$(
  mktemp "${secret_directory}/vault-secret-id.tmp.XXXXXX"
)"

cleanup() {
  rm -f "$temporary_secret_file"
}

trap cleanup EXIT

printf '%s' "$secret_id" > "$temporary_secret_file"

chgrp "$HOST_GID" "$temporary_secret_file"
chmod 0640 "$temporary_secret_file"

mv -f "$temporary_secret_file" "$SECRET_ID_OUTPUT"

trap - EXIT

if grep -q '^VAULT_ROLE_ID=' "$ENV_FILE"; then
  sed -i.bak \
    "s|^VAULT_ROLE_ID=.*|VAULT_ROLE_ID=$role_id|" \
    "$ENV_FILE"

  rm -f "${ENV_FILE}.bak"
else
  printf '\nVAULT_ROLE_ID=%s\n' "$role_id" >> "$ENV_FILE"
fi

echo "Backend AppRole configured."
echo "RoleID written to $ENV_FILE."
echo "SecretID written to $SECRET_ID_OUTPUT."
