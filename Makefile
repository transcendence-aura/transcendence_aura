# [Colors]
BOLD    = \033[1m
GREEN   = \033[1;32m
YELLOW  = \033[1;33m
BLUE    = \033[1;34m
RED     = \033[1;31m
END     = \033[0m

# [Compose command & Engine Auto-detection]
COMPOSE ?= $(shell if command -v docker >/dev/null 2>&1; then echo "docker compose"; elif command -v podman >/dev/null 2>&1; then echo "podman compose"; else echo "docker compose"; fi)
HOST_GID := $(shell id -g)
COMPOSE_RUN = HOST_GID=$(HOST_GID) $(COMPOSE)

# [Tooling Checks]

.PHONY: check-env
check-env:
	@test -f .env || { \
		printf "$(RED)Error: .env is missing.$(END)\n"; \
		printf "$(YELLOW)Copy .env.example to .env and fill in real values:$(END)\n"; \
		printf "    cp .env.example .env\n"; \
		exit 1; \
	}

.PHONY: check-certs
check-certs:
	@test -f nginx/ssl/server.crt || { \
		printf "$(RED)Error: SSL certificates are missing.$(END)\n"; \
		printf "$(YELLOW)Generate them by running:$(END)\n"; \
		printf "    bash scripts/gen-certs.sh\n"; \
		exit 1; \
	}

.PHONY: check-engine
check-engine:
	@$(COMPOSE_RUN) version > /dev/null 2>&1 || { \
		printf "$(RED)Error: the container engine is not responding.$(END)\n"; \
		printf "$(YELLOW)Make sure your container runtime (Docker or Podman) is running.$(END)\n"; \
		printf "$(YELLOW)On WSL with Docker, you may need:$(END)\n"; \
		printf "    sudo service docker start\n"; \
		exit 1; \
	}

.PHONY: check-tools
check-tools:
	@missing=0; \
	for tool in git make node; do \
		command -v $$tool >/dev/null 2>&1 \
			&& printf "$(GREEN)ok$(END)   %s\n" "$$tool" \
			|| { printf "$(RED)miss$(END) %s\n" "$$tool"; missing=1; }; \
	done; \
	if command -v docker >/dev/null 2>&1 || command -v podman >/dev/null 2>&1; then \
		printf "$(GREEN)ok$(END)   container runtime (docker or podman)\n"; \
	else \
		printf "$(RED)miss$(END) container runtime (docker or podman)\n"; missing=1; \
	fi; \
	if [ $$missing -eq 1 ]; then \
		printf "$(YELLOW)Some tools are missing. See docs/setup/prerequisites.md$(END)\n"; \
		exit 1; \
	fi; \
	printf "$(GREEN)All required tools are present.$(END)\n"

# [Setup & Installation]

.PHONY: setup
setup: check-env
	@printf "$(BLUE)Installing project dependencies...$(END)\n"
	@npm run install:all
	@printf "$(GREEN)Dependencies installed. Run 'make dev' or 'make start' to launch the stack.$(END)\n"

# [Vault Lifecycle]

.PHONY: vault-permissions
vault-permissions:
	@printf "$(YELLOW)Preparing Vault storage permissions$(END)\n"
	@$(COMPOSE_RUN) run --rm --no-deps \
		--user root \
		--entrypoint sh \
		vault -c 'chown -R vault:vault /vault/data 2>/dev/null || true && chmod 750 /vault/data 2>/dev/null || true'

.PHONY: vault-start
vault-start: vault-permissions
	@printf "$(YELLOW)Starting Vault$(END)\n"
	@$(COMPOSE_RUN) up -d vault

.PHONY: vault-init
vault-init: vault-start
	@printf "$(YELLOW)Initializing Vault$(END)\n"
	@COMPOSE_CMD='$(COMPOSE)' \
		HOST_GID='$(HOST_GID)' \
		bash scripts/init-vault.sh

.PHONY: vault-unseal
vault-unseal: vault-init
	@printf "$(YELLOW)Unsealing Vault$(END)\n"
	@COMPOSE_CMD='$(COMPOSE)' \
		HOST_GID='$(HOST_GID)' \
		bash scripts/unseal-vault.sh

.PHONY: vault-bootstrap
vault-bootstrap: vault-unseal
	@printf "$(YELLOW)Configuring backend Vault access$(END)\n"
	@COMPOSE_CMD='$(COMPOSE)' \
		HOST_GID='$(HOST_GID)' \
		bash scripts/bootstrap-vault-backend.sh

# [Stack Main Lifecycle]

.PHONY: up
up: check-env check-certs check-engine
	@$(MAKE) --no-print-directory vault-bootstrap
	@printf "$(YELLOW)Starting the stack...$(END)\n"
	@$(COMPOSE_RUN) up -d --build
	@printf "$(GREEN)Stack is up.$(END)\n"

.PHONY: down
down:
	@printf "$(YELLOW)Stopping the stack...$(END)\n"
	@$(COMPOSE_RUN) down
	@rm -f local-secrets/vault-secret-id
	@printf "$(GREEN)Stack is down.$(END)\n"

.PHONY: build
build: check-env check-engine
	@printf "$(BLUE)Building images...$(END)\n"
	@$(COMPOSE_RUN) build
	@printf "$(GREEN)Images built.$(END)\n"

.PHONY: ps
ps:
	@$(COMPOSE_RUN) ps

.PHONY: logs
logs:
	@$(COMPOSE_RUN) logs -f

# [Granular Rebuild & Service Operations]

.PHONY: front-rebuild
front-rebuild: check-env check-engine
	@printf "$(YELLOW)Rebuilding and restarting frontend...$(END)\n"
	@$(COMPOSE_RUN) up -d --build --no-deps frontend
	@printf "$(GREEN)Frontend rebuilt.$(END)\n"

.PHONY: back-rebuild
back-rebuild: check-env check-engine
	@$(MAKE) --no-print-directory vault-bootstrap
	@printf "$(YELLOW)Rebuilding and restarting backend...$(END)\n"
	@$(COMPOSE_RUN) up -d --build --no-deps backend
	@printf "$(GREEN)Backend rebuilt.$(END)\n"

.PHONY: nginx-rebuild
nginx-rebuild: check-certs check-engine
	@printf "$(YELLOW)Rebuilding and restarting nginx...$(END)\n"
	@$(COMPOSE_RUN) up -d --build --no-deps nginx
	@printf "$(GREEN)Nginx rebuilt.$(END)\n"

.PHONY: backend-restart
backend-restart: check-env check-engine
	@$(MAKE) --no-print-directory vault-bootstrap
	@printf "$(YELLOW)Restarting backend with a fresh Vault SecretID$(END)\n"
	@$(COMPOSE_RUN) up -d --force-recreate backend

.PHONY: front-logs
front-logs:
	@$(COMPOSE_RUN) logs -f frontend

.PHONY: back-logs
back-logs:
	@$(COMPOSE_RUN) logs -f backend

.PHONY: nginx-logs
nginx-logs:
	@$(COMPOSE_RUN) logs -f nginx

# [Database Operations]

.PHONY: seed
seed: check-env check-engine
	@$(COMPOSE_RUN) ps --status running --services | grep -qx "backend" || { \
		printf "$(RED)Error: the backend service is not running.$(END)\n"; \
		printf "$(YELLOW)Start the stack with: make up$(END)\n"; \
		exit 1; \
	}
	@printf "$(YELLOW)Purging database volume for clean seed state...$(END)\n"
	@$(COMPOSE_RUN) down -v postgres
	@$(COMPOSE_RUN) up -d postgres
	@printf "$(YELLOW)Waiting for PostgreSQL readiness...$(END)\n"
	@until $(COMPOSE_RUN) exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
	@printf "$(YELLOW)Running database migrations...$(END)\n"
	@$(COMPOSE_RUN) exec -T backend npx prisma migrate deploy
	@printf "$(YELLOW)Executing database seed script...$(END)\n"
	@$(COMPOSE_RUN) run --rm -T seed
	@printf "$(GREEN)Database seeded successfully.$(END)\n"

# [Cleanup & Infrastructure Reset]

.PHONY: clean
clean:
	@printf "$(YELLOW)Removing containers, networks, and attached volumes...$(END)\n"
	@$(COMPOSE_RUN) down -v --remove-orphans
	@rm -f local-secrets/vault-secret-id
	@printf "$(GREEN)Stack teardown completed.$(END)\n"

.PHONY: fclean
fclean: clean
	@printf "$(RED)Purging local project images and generated runtime artifacts...$(END)\n"
	@$(COMPOSE_RUN) down --rmi all -v --remove-orphans 2>/dev/null || true
	@rm -rf local-secrets/vault*
	@printf "$(GREEN)System purge completed.$(END)\n"

# Fast clean dev bootstrap: cleans runtime state, keeps image cache, boots stack & seeds DB
.PHONY: dev
dev: clean
	@printf "$(BLUE)Starting development environment with clean runtime state...$(END)\n"
	@$(MAKE) --no-print-directory up
	@$(MAKE) --no-print-directory seed
	@printf "$(GREEN)Environment ready for development at https://localhost$(END)\n"

# Full clean install: purge images/secrets from scratch, rebuild everything & seed
.PHONY: start
start: fclean
	@printf "$(BLUE)Initializing complete stack from clean state...$(END)\n"
	@$(MAKE) --no-print-directory up
	@$(MAKE) --no-print-directory seed
	@printf "$(GREEN)Deployment initialized and ready at https://localhost$(END)\n"

# [Help]

.PHONY: help
help:
	@printf "\n$(BLUE)$(BOLD)AURA — Transcendence Makefile$(END)\n\n"
	@printf "$(YELLOW)Tooling & Setup$(END)\n"
	@printf "  $(GREEN)make setup$(END)             Install workspace dependencies\n"
	@printf "  $(GREEN)make check-tools$(END)       Verify host tools (git, node, docker/podman)\n"
	@printf "  $(GREEN)make check-env$(END)         Ensure .env configuration file exists\n"
	@printf "  $(GREEN)make check-certs$(END)       Ensure SSL certificates exist\n\n"
	@printf "$(YELLOW)Stack Lifecycle$(END)\n"
	@printf "  $(GREEN)make dev$(END)               Fast dev restart (clean runtime state + up + seed)\n"
	@printf "  $(GREEN)make start$(END)             Full clean install (fclean + rebuild + seed)\n"
	@printf "  $(GREEN)make up$(END)                Bootstrap Vault and run the stack\n"
	@printf "  $(GREEN)make down$(END)              Stop stack and remove runtime networks\n"
	@printf "  $(GREEN)make build$(END)             Build or rebuild images\n"
	@printf "  $(GREEN)make ps$(END)                Display container status\n"
	@printf "  $(GREEN)make logs$(END)              Follow container logs\n\n"
	@printf "$(YELLOW)Service Operations$(END)\n"
	@printf "  $(GREEN)make front-rebuild$(END)     Rebuild and restart frontend container only\n"
	@printf "  $(GREEN)make back-rebuild$(END)      Rebuild and restart backend container only\n"
	@printf "  $(GREEN)make nginx-rebuild$(END)     Rebuild and restart Nginx proxy only\n"
	@printf "  $(GREEN)make backend-restart$(END)  Restart backend with fresh Vault credentials\n\n"
	@printf "$(YELLOW)Database$(END)\n"
	@printf "  $(GREEN)make seed$(END)              Purge DB volume, apply migrations, seed demo data\n\n"
	@printf "$(YELLOW)Cleanup$(END)\n"
	@printf "  $(GREEN)make clean$(END)             Remove containers and attached volumes\n"
	@printf "  $(GREEN)make fclean$(END)            Remove containers, volumes, secrets, and images\n\n"
