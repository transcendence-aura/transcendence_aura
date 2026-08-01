# [Colors]
GREEN		= \033[1;32m
YELLOW		= \033[1;33m
BLUE		= \033[1;34m
RED			= \033[1;31m
END			= \033[0m

# [Compose command]
# Defaults to Docker, overridable for Podman:
#   make COMPOSE="podman-compose" up
COMPOSE ?= docker compose

# Pass primary group ID to Compose
HOST_GID := $(shell id -g)
COMPOSE_RUN = HOST_GID=$(HOST_GID) $(COMPOSE)

# Tooling Checks

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
		printf "$(YELLOW)Make sure your container runtime is running.$(END)\n"; \
		printf "$(YELLOW)On WSL with Docker, you may need:$(END)\n"; \
		printf "    sudo service docker start\n"; \
		exit 1; \
	}

# Report which required tools are missing but never installs anything.
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


# Setup & Installation

# Install every project dependency (root, frontend, backend) in one command.
.PHONY: setup
setup: check-env
	@printf "$(BLUE)Installing project dependencies...$(END)\n"
	@npm run install:all
	@printf "$(GREEN)Dependencies installed. Run 'make up' to start the stack.$(END)\n"

# Vault setup
.PHONY: vault-env
vault-env:
	@bash scripts/gen-vault-tokens.sh

# Stack main lifecycle command

.PHONY: up
up: check-env check-certs check-engine vault-env
	@printf "$(YELLOW)Starting the stack...$(END)\n"
	@$(COMPOSE_RUN) up -d
	@printf "$(GREEN)Stack is up.$(END)\n"

.PHONY: seed
seed: check-env check-engine
	@$(COMPOSE_RUN) ps --status running --services | grep -qx "backend" || { \
		printf "$(RED)Error: the backend service is not running.$(END)\n"; \
		printf "$(YELLOW)Start the stack with: make up$(END)\n"; \
		exit 1; \
	}
	@printf "$(YELLOW)Running database migrations...$(END)\n"
	@$(COMPOSE_RUN) exec -T backend npx prisma migrate deploy
	@printf "$(YELLOW)Executing database seed script...$(END)\n"
	@$(COMPOSE_RUN) exec -T backend npm run prisma:seed
	@printf "$(GREEN)Database seeded successfully.$(END)\n"

.PHONY: down
down:
	@printf "$(YELLOW)Stopping the stack...$(END)\n"
	@$(COMPOSE_RUN) down
	@printf "$(GREEN)Stack is down.$(END)\n"

.PHONY: build
build: check-env check-engine
	@printf "$(BLUE)Building images...$(END)\n"
	@$(COMPOSE_RUN) build
	@printf "$(GREEN)Images built.$(END)\n"

.PHONY: logs
logs:
	@$(COMPOSE_RUN) logs -f
