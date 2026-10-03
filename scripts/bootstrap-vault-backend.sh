#!/bin/bash
set -eu

source "scripts/vault.sh"

ROLE_NAME="aura-backend"
POLICY_NAME="backend-policy"
RUNTIME_POLICY_NAME="backend-runtime-policy"
POLICY_FILE="/vault/aura/policies/backend-policy.hcl"
RUNTIME_POLICY_FILE="/vault/aura/policies/backend-runtime-policy.hcl"
SECRET_ID_OUTPUT="local-secrets/vault-secret-id"
ENV_FILE=".env"

SECRET_PATH="aura-backend/development"

read_value() {
  local file="$1"
  local key="$2"

  sed -n "s/^${key}=//p" "$file" | tail -n 1
}

write_env_value() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i.bak \
      "s|^${key}=.*|${key}=${value}|" \
      "$ENV_FILE"

    rm -f "${ENV_FILE}.bak"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

[[ -f "$ENV_FILE" ]] ||
  fail "$ENV_FILE does not exist."

[[ -s "$VAULT_ROOT_TOKEN_FILE" ]] ||
  fail "Vault root token is missing."

POSTGRES_USER="$(read_value "$ENV_FILE" POSTGRES_USER)"
POSTGRES_PASSWORD="$(read_value "$ENV_FILE" POSTGRES_PASSWORD)"
POSTGRES_DB="$(read_value "$ENV_FILE" POSTGRES_DB)"
POSTGRES_PORT="$(read_value "$ENV_FILE" POSTGRES_PORT)"
POSTGRES_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:${POSTGRES_PORT}/${POSTGRES_DB}"

existing_jwt_access_secret="$(
  vault_exec_with_token kv get \
    -mount=secret \
    -field=JWT_ACCESS_SECRET \
    "$SECRET_PATH" \
    2>/dev/null || true
)"

if [[ -n "$existing_jwt_access_secret" ]]; then
  JWT_ACCESS_SECRET="$existing_jwt_access_secret"
else
  JWT_ACCESS_SECRET="$(openssl rand -hex 32)"
fi

: "${POSTGRES_URL:?POSTGRES_URL is required}"
: "${JWT_ACCESS_SECRET:?JWT_ACCESS_SECRET is required}"

echo "Configuring Vault..."

if ! vault_exec_with_token secrets list -format=json |
  grep -q '"secret/"'; then

  echo "Enabling KV v2 secret engine..."

  vault_exec_with_token secrets enable \
    -path=secret \
    -version=2 \
    kv
fi

vault_exec_with_token policy write \
  "$POLICY_NAME" \
  "$POLICY_FILE"

vault_exec_with_token policy write \
  "$RUNTIME_POLICY_NAME" \
  "$RUNTIME_POLICY_FILE"

if ! vault_exec_with_token auth list -format=json |
  grep -q '"approle/"'; then

  echo "Enabling AppRole..."

  vault_exec_with_token auth enable approle
fi

vault_exec_with_token write \
  "auth/approle/role/$ROLE_NAME" \
  token_policies="$POLICY_NAME,$RUNTIME_POLICY_NAME" \
  token_no_default_policy=true \
  token_type="batch" \
  token_ttl="5m" \
  token_max_ttl="15m" \
  secret_id_ttl="0" \
  secret_id_num_uses=0

secret_exists=false

if vault_exec_with_token kv metadata get \
  -mount=secret \
  "$SECRET_PATH" \
  >/dev/null 2>&1; then

  secret_exists=true
fi


echo "Seeding Vault application secrets..."

if [[ "$secret_exists" == "true" ]]; then
  vault_exec_with_token kv patch \
    -mount=secret \
    "$SECRET_PATH" \
    POSTGRES_URL="$POSTGRES_URL" \
    JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET"
else
  vault_exec_with_token kv put \
    -mount=secret \
    "$SECRET_PATH" \
    POSTGRES_URL="$POSTGRES_URL" \
    JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET"
fi

unset two_factor_key
unset existing_two_factor_key

echo "Vault application secrets configured."

# RoleID
role_id="$(
  vault_exec_with_token read \
    -field=role_id \
    "auth/approle/role/$ROLE_NAME/role-id"
)"

write_env_value VAULT_ROLE_ID "$role_id"

# SecretID
# Reuse the existing local SecretID where possible.
if [[ ! -s "$SECRET_ID_OUTPUT" ]]; then
  echo "Generating backend SecretID..."

  secret_id="$(
    vault_exec_with_token write \
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

  unset secret_id

  echo "Backend SecretID generated."
else
  echo "Existing backend SecretID found."
fi

echo "Backend AppRole configured."
echo "RoleID written to $ENV_FILE."
echo "Vault bootstrap complete."
