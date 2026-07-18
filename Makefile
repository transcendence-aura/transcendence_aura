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

.PHONY: check-env
check-env:
	@test -f .env || { \
		printf "$(RED)Error: .env is missing.$(END)\n"; \
		printf "$(YELLOW)Copy .env.example to .env and fill in real values:$(END)\n"; \
		printf "    cp .env.example .env\n"; \
		exit 1; \
	}

.PHONY: up
up: check-env
	@printf "$(YELLOW)Starting the stack...$(END)\n"
	@$(COMPOSE) up -d
	@printf "$(GREEN)Stack is up.$(END)\n"

.PHONY: down
down:
	@printf "$(YELLOW)Stopping the stack...$(END)\n"
	@$(COMPOSE) down
	@printf "$(GREEN)Stack is down.$(END)\n"

.PHONY: build
build: check-env
	@printf "$(BLUE)Building images...$(END)\n"
	@$(COMPOSE) build
	@printf "$(GREEN)Images built.$(END)\n"

.PHONY: logs
logs:
	@$(COMPOSE) logs -f
