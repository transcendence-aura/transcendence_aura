#!/bin/bash
# Generate a self-signed certificate for local development.
# Not tracked by Git.
# set -e to catch errors
set -e

mkdir -p nginx/ssl

# Generate a 1-year self-signed certificate.
# Unencrypted key (-nodes) allows unattended Nginx startup.
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/server.key \
  -out nginx/ssl/server.crt \
  -subj "/C=FR/ST=IDF/L=Paris/O=Transcendence/OU=Aura/CN=localhost"

# Make server.key readable by nginx user.
# For development only. This will be handled by Vault later.
chmod 644 nginx/ssl/server.key

echo "[Success] : Self-signed certificates generated in nginx/ssl/"
