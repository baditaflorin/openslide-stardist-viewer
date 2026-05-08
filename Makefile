SHELL := /bin/bash

PROJECT := openslide-stardist-viewer
IMAGE := ghcr.io/baditaflorin/$(PROJECT)
VERSION := $(shell node -p "require('./package.json').version")
SHA := $(shell git rev-parse --short HEAD 2>/dev/null || echo dev)
CREATED := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
PYTHON ?= .venv/bin/python
PIP ?= .venv/bin/pip

.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview docker-build docker-push release compose-up compose-down clean hooks-pre-commit hooks-pre-push hooks-commit-msg backend-venv

help:
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-22s %s\n", $$1, $$2}'

install-hooks: ## Wire local git hooks.
	git config core.hooksPath .githooks
	chmod +x .githooks/*

backend-venv: ## Install backend development dependencies.
	test -x $(PYTHON) || python3 -m venv .venv
	$(PIP) install --upgrade pip
	$(PIP) install -r backend/requirements-dev.txt

dev: ## Run frontend and backend locally.
	@echo "Start backend: cd backend && ../$(PYTHON) -m uvicorn app.main:app --reload --host 127.0.0.1 --port 25342"
	npm run dev

build: ## Build frontend into docs/ for GitHub Pages.
	npm run build

data: ## Mode C has no static data pipeline.
	@echo "No static data pipeline in Mode C."

test: ## Run unit tests.
	npm run test
	cd backend && ../$(PYTHON) -m pytest

test-integration: ## Run integration tests.
	@echo "No separate integration suite yet; smoke covers the runtime path."

smoke: ## Build, serve, and run Playwright smoke tests.
	./scripts/smoke.sh

lint: ## Run linters and type checks.
	npm run lint
	npm run format:check
	npm run typecheck
	cd backend && ../$(PYTHON) -m ruff check .

fmt: ## Autoformat frontend and backend.
	npm run format
	cd backend && ../$(PYTHON) -m ruff check . --fix

pages-preview: ## Serve docs/ locally as GitHub Pages would.
	npm run pages-preview

docker-build: ## Build amd64 backend image.
	docker buildx build --platform linux/amd64 \
		--build-arg VERSION=$(VERSION) \
		--build-arg REVISION=$(SHA) \
		--build-arg CREATED=$(CREATED) \
		-t $(IMAGE):latest -t $(IMAGE):v$(VERSION) -t $(IMAGE):$(SHA) .

docker-push: ## Push amd64 backend image to GHCR.
	docker buildx build --platform linux/amd64 --push \
		--build-arg VERSION=$(VERSION) \
		--build-arg REVISION=$(SHA) \
		--build-arg CREATED=$(CREATED) \
		-t $(IMAGE):latest -t $(IMAGE):v$(VERSION) -t $(IMAGE):$(SHA) .

release: test build ## Tag a semver release and push tags.
	git tag -a v$(VERSION) -m "v$(VERSION)"
	git push origin v$(VERSION)

compose-up: ## Start local Docker stack.
	docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml up -d --build

compose-down: ## Stop local Docker stack.
	docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml down

hooks-pre-commit:
	.githooks/pre-commit

hooks-pre-push:
	.githooks/pre-push

hooks-commit-msg:
	.githooks/commit-msg .git/COMMIT_EDITMSG

clean: ## Remove local build outputs.
	rm -rf node_modules .venv .pytest_cache .ruff_cache backend/.pytest_cache backend/.ruff_cache playwright-report test-results tmp
