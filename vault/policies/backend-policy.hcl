# Backend policy for Aura development
#
# The backend may only read the required secrets.
#
# It cannot create, modify, rotate, list, or destroy secrets.

path "secret/data/aura/development/jwt" {
  capabilities = ["read"]
}

path "secret/data/aura/development/database" {
  capabilities = ["read"]
}

path "secret/data/aura/development/redis" {
  capabilities = ["read"]
}

path "secret/data/aura/development/oauth" {
  capabilities = ["read"]
}

path "secret/data/aura/development/smtp" {
  capabilities = ["read"]
}

path "secret/data/aura/development/totp" {
  capabilities = ["read"]
}

path "secret/data/aura-backend/development" {
  capabilities = ["read"]
}
