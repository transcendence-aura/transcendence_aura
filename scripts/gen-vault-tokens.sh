#!/bin/bash
# Generate Vault tokens
set -eu

ENV_FILE=".env"

root_token_exists=false

if grep -q '^VAULT_DEV_ROOT_TOKEN_ID=.\+' "$ENV_FILE" 2>/dev/null; then
  echo "Vault development root token already exists."
  exit 0
fi

root_token="$(openssl rand -hex 32)"

printf '\nVAULT_DEV_ROOT_TOKEN_ID=%s\n' \
    "$root_token" >> "$ENV_FILE"

echo "Generated Vault development root token in $ENV_FILE"
