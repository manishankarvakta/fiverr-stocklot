.PHONY: help build up down restart logs clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

logs-mongodb: ## Show MongoDB logs
	docker-compose logs -f mongodb

logs-minio: ## Show MinIO logs
	docker-compose logs -f minio

ps: ## Show running containers
	docker-compose ps

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

shell-backend: ## Open shell in backend container
	docker-compose exec backend bash

shell-mongodb: ## Open MongoDB shell
	docker-compose exec mongodb mongosh -u admin -p adminpassword

setup: ## Initial setup - copy env file
	@if [ ! -f docker.env ]; then \
		cp docker.env.example docker.env; \
		echo "Created docker.env from docker.env.example"; \
		echo "Please edit docker.env with your configuration"; \
	else \
		echo "docker.env already exists"; \
	fi

