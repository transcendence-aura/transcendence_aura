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
	@$(COMPOSE) version > /dev/null 2>&1 || { \
		printf "$(RED)Error: the container engine is not responding.$(END)\n"; \
		printf "$(YELLOW)Make sure your container runtime is running.$(END)\n"; \
		printf "$(YELLOW)On WSL with Docker, you may need:$(END)\n"; \
		printf "    sudo service docker start\n"; \
		exit 1; \
	}

.PHONY: up
up: check-env check-certs check-engine
	@printf "$(YELLOW)Starting the stack...$(END)\n"
	@$(COMPOSE) up -d
	@printf "$(GREEN)Stack is up.$(END)\n"

.PHONY: down
down:
	@printf "$(YELLOW)Stopping the stack...$(END)\n"
	@$(COMPOSE) down
	@printf "$(GREEN)Stack is down.$(END)\n"

.PHONY: build
build: check-env check-engine
	@printf "$(BLUE)Building images...$(END)\n"
	@$(COMPOSE) build
	@printf "$(GREEN)Images built.$(END)\n"

.PHONY: logs
logs:
	@$(COMPOSE) logs -f
