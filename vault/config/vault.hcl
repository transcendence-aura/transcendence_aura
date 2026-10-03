# Raft data lives in /vault/file: the image ships this directory owned by the
# vault user, so both Docker and rootless Podman give the named volume mounted
# there the right ownership (a directory missing from the image stays root-owned
# under Podman and Vault cannot open it).
storage "raft" {
  path = "/vault/file"
  node_id = "aura-vault-1"
}

# Recommended by HashiCorp with raft storage. Also required on rootless Podman,
# where the memlock limit cannot be raised.
disable_mlock = true

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true
}

api_addr = "http://vault:8200"
cluster_addr= "http://vault:8201"
