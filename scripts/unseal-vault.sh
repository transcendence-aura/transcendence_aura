#!/bin/bash
set -eu

source "scripts/vault.sh"

wait_for_vault

status="$(vault_status_json)"

initialized="$(
  printf '%s\n' "$status" |
    sed -n 's/.*"initialized":[[:space:]]*\([^,}]*\).*/\1/p'
)"

sealed="$(
  printf '%s\n' "$status" |
    sed -n 's/.*"sealed":[[:space:]]*\([^,}]*\).*/\1/p'
)"

[[ "$initialized" == "true" ]] ||
  fail "Vault is not initialized."

if [[ "$sealed" == "false" ]]; then
  echo "Vault is already unsealed."
  exit 0
fi

[[ -s "$VAULT_UNSEAL_KEY_FILE" ]] ||
  fail "Vault unseal key is missing: $VAULT_UNSEAL_KEY_FILE"

echo "Unsealing Vault..."

unseal_key="$(cat "$VAULT_UNSEAL_KEY_FILE")"

vault_exec operator unseal "$unseal_key" >/dev/null

status="$(vault_status_json)"

sealed="$(
  printf '%s\n' "$status" |
    sed -n 's/.*"sealed":[[:space:]]*\([^,}]*\).*/\1/p'
)"

[[ "$sealed" == "false" ]] ||
  fail "Vault remained sealed after the unseal operation."

echo "Vault unsealed."
