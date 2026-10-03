#!/bin/bash
set -eu

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

VAULT_SERVICE="vault"

LOCAL_SECRETS_DIR="local-secrets"
VAULT_ROOT_TOKEN_FILE="$LOCAL_SECRETS_DIR/vault-root-token"
VAULT_UNSEAL_KEY_FILE="$LOCAL_SECRETS_DIR/vault-unseal-key"

HOST_GID="${HOST_GID:-$(id -g)}"

if [[ -n "${COMPOSE_CMD:-}" ]]; then
  read -r -a compose_command <<< "$COMPOSE_CMD"
elif command -v docker >/dev/null 2>&1 &&
  ! docker --version 2>/dev/null | grep -qi podman; then
  compose_command=(docker compose)
elif command -v podman >/dev/null 2>&1; then
  compose_command=(podman compose)
else
  fail "Docker or Podman is required."
fi

vault_exec() {
  "${compose_command[@]}" exec -T \
    -e VAULT_ADDR="http://127.0.0.1:8200" \
    "$VAULT_SERVICE" \
    vault "$@"
}

vault_exec_with_token() {
  local token

  [[ -s "$VAULT_ROOT_TOKEN_FILE" ]] ||
    fail "Vault root token is missing: $VAULT_ROOT_TOKEN_FILE"

  token="$(cat "$VAULT_ROOT_TOKEN_FILE")"

  "${compose_command[@]}" exec -T \
    -e VAULT_ADDR="http://127.0.0.1:8200" \
    -e VAULT_TOKEN="$token" \
    "$VAULT_SERVICE" \
    vault "$@"
}

vault_status_json() {
  vault_exec status -format=json 2>/dev/null || true
}

wait_for_vault() {
  local max_attempts=20
  local status_output

  echo "Waiting for Vault..."

  for ((attempt = 1; attempt <= max_attempts; attempt++)); do
    status_output="$(vault_status_json)"

    if [[ -n "$status_output" ]]; then
      echo "Vault is reachable."
      return 0
    fi

    if ((attempt == max_attempts)); then
      fail "Vault did not become reachable after ${max_attempts} attempts."
    fi

    sleep 1
  done
}
