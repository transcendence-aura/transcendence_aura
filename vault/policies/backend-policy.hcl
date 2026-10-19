# Backend policy for Aura development
#
# The backend may only read the required secrets.
#
# It cannot create, modify, rotate, list, or destroy secrets.


path "secret/data/aura-backend/development" {
  capabilities = ["read"]
}
