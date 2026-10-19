#!/bin/bash
set -eu

source "scripts/vault.sh"

mkdir -p "$LOCAL_SECRETS_DIR"
chmod 0750 "$LOCAL_SECRETS_DIR"

wait_for_vault

status="$(vault_status_json)"

initialized="$(
  printf '%s\n' "$status" |
    sed -n 's/.*"initialized":[[:space:]]*\([^,}]*\).*/\1/p'
)"

if [[ "$initialized" == "true" ]]; then
  echo "Vault is already initialized."

  [[ -s "$VAULT_UNSEAL_KEY_FILE" ]] ||
    fail "Vault is initialized but the local unseal key is missing."

  [[ -s "$VAULT_ROOT_TOKEN_FILE" ]] ||
    fail "Vault is initialized but the local root token is missing."

  exit 0
fi

echo "Initializing Vault..."

init_output="$(
  vault_exec operator init \
    -key-shares=1 \
    -key-threshold=1 \
    -format=json
)"

compact_init_output="$(
  printf '%s' "$init_output" | tr -d '\n'
)"

unseal_key="$(
  printf '%s\n' "$compact_init_output" |
    sed -n 's/.*"unseal_keys_b64":[[:space:]]*\[[[:space:]]*"\([^"]*\)".*/\1/p'
)"

root_token="$(
  printf '%s\n' "$compact_init_output" |
    sed -n 's/.*"root_token":[[:space:]]*"\([^"]*\)".*/\1/p'
)"

[[ -n "$unseal_key" ]] ||
  fail "Could not extract Vault unseal key."

[[ -n "$root_token" ]] ||
  fail "Could not extract Vault root token."

umask 077

printf '%s' "$unseal_key" > "$VAULT_UNSEAL_KEY_FILE"
printf '%s' "$root_token" > "$VAULT_ROOT_TOKEN_FILE"

chmod 0600 "$VAULT_UNSEAL_KEY_FILE"
chmod 0600 "$VAULT_ROOT_TOKEN_FILE"

echo "Vault initialized."
echo "Vault initialization credentials stored in $LOCAL_SECRETS_DIR."
