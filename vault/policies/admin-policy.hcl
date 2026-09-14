# Administrator policy for Aura development
# Administrators may:
# - create secrets
# - read secrets for verification
# - update and rotate secrets
# - partially update secrets
# - soft-delete secrets
#
# Rotation is performed by writing a new version to the same path.
#
# Administrators cannot:
# - list secret paths
# - access unrelated secrets
# - restore deleted versions
# - permanently destroy versions
# - manage or delete secret metadata

# --------------------------------------------------------------
# JWT
# --------------------------------------------------------------

path "secret/data/aura/development/jwt" {
  capabilities = ["create", "read", "update", "delete"]
}

# --------------------------------------------------------------
# Database
# --------------------------------------------------------------

path "secret/data/aura/development/database" {
  capabilities = ["create", "read", "update", "delete"]
}

# --------------------------------------------------------------
# Redis
# --------------------------------------------------------------

path "secret/data/aura/development/redis" {
  capabilities = ["create", "read", "update", "delete"]
}

# --------------------------------------------------------------
# OAuth
# --------------------------------------------------------------

path "secret/data/aura/development/oauth" {
  capabilities = ["create", "read", "update", "delete"]
}

# --------------------------------------------------------------
# SMTP
# --------------------------------------------------------------

path "secret/data/aura/development/smtp" {
  capabilities = ["create", "read", "update", "delete"]
}

# --------------------------------------------------------------
# TOTP
# --------------------------------------------------------------

path "secret/data/aura/development/totp/users/*" {
  capabilities = ["create", "read", "update", "delete"]
}
