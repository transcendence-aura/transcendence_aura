# Runtime policy for Aura development.
#
# Allows the backend to store and retrieve per-user TOTP
# credentials. Does not permit listing the TOTP namespace.

path "secret/data/aura-backend/development/totp/users/+" {
  capabilities = ["create", "read", "update"]
}
