#!/bin/bash
# Generate Vault tokens
set -eu

ENV_FILE=".env"

dev_token_exists=false
client_token_exists=false

grep -q '^VAULT_DEV_ROOT_TOKEN_ID=.\+' "$ENV_FILE" 2>/dev/null && dev_token_exists=true

grep -q '^VAULT_TOKEN=.\+' "$ENV_FILE" 2>/dev/null && client_token_exists=true

if "$dev_token_exists" && "$client_token_exists"; then
	echo "Vault development tokens already exist in $ENV_FILE"
	exit 0
fi

if  "$dev_token_exists" || "$client_token_exists"; then
	echo "Error: Only one Vault token is configured."
	echo "Remove the existing Vault token, then run this script."
	exit 1
fi

token="$(openssl rand -hex 32)"

printf '\nVAULT_DEV_ROOT_TOKEN_ID=%s\nVAULT_TOKEN=%s\n' \
	"$token" "$token" >> "$ENV_FILE"

echo "Generated Vault development tokens in $ENV_FILE"
