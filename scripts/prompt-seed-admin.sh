#!/bin/bash
set -eu

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

LOCAL_SECRETS_DIR="local-secrets"
EMAIL_FILE="$LOCAL_SECRETS_DIR/seed-admin-email"
PASSWORD_FILE="$LOCAL_SECRETS_DIR/seed-admin-password"
MIN_PASSWORD_LENGTH=8

# The seed container reads these as bind-mounted Compose secrets, running as
# the fixed nestjs UID/GID from the image - never the host user. Group-read
# access (below) is what lets it open them, same as local-secrets/vault-secret-id.
HOST_GID="${HOST_GID:-$(id -g)}"

[[ -t 0 ]] ||
  fail "No interactive terminal to read admin credentials from."

mkdir -p "$LOCAL_SECRETS_DIR"
chmod 0750 "$LOCAL_SECRETS_DIR"

admin_email=""
while [[ -z "$admin_email" ]]; do
  read -r -p "Seed admin email: " admin_email
done

admin_password=""
while true; do
  read -r -s -p "Seed admin password (min ${MIN_PASSWORD_LENGTH} chars): " admin_password
  echo

  if ((${#admin_password} < MIN_PASSWORD_LENGTH)); then
    echo "Password must be at least ${MIN_PASSWORD_LENGTH} characters."
    admin_password=""
    continue
  fi

  read -r -s -p "Confirm password: " admin_password_confirm
  echo

  if [[ "$admin_password" != "$admin_password_confirm" ]]; then
    echo "Passwords do not match, try again."
    admin_password=""
    continue
  fi

  break
done

umask 077

printf '%s' "$admin_email" > "$EMAIL_FILE"
printf '%s' "$admin_password" > "$PASSWORD_FILE"

chgrp "$HOST_GID" "$EMAIL_FILE" "$PASSWORD_FILE"
chmod 0640 "$EMAIL_FILE" "$PASSWORD_FILE"

unset admin_email admin_password admin_password_confirm

echo "Admin credentials captured for this seed run."
