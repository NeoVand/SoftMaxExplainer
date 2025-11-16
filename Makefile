.PHONY: help install dev build preview check check-watch format lint test test-e2e clean setup

# Default target
.DEFAULT_GOAL := help

## help: Display this help message
help:
	@echo "Available targets:"
	@echo ""
	@grep -E '^## ' Makefile | sed 's/^## /  /' | column -t -s ':' | sed 's/^/  /'
	@echo ""

## install: Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

## setup: Complete setup (install dependencies and prepare)
setup: install
	@echo "Running setup tasks..."
	npm run prepare
	@echo "Setup complete!"

## dev: Start development server
dev:
	@echo "Starting development server..."
	npm run dev

## build: Build the project for production
build:
	@echo "Building project..."
	npm run build

## preview: Preview production build locally
preview:
	@echo "Starting preview server..."
	npm run preview

## check: Run Svelte type checking
check:
	@echo "Running type checks..."
	npm run check

## check-watch: Run Svelte type checking in watch mode
check-watch:
	@echo "Running type checks in watch mode..."
	npm run check:watch

## format: Format code with Prettier
format:
	@echo "Formatting code..."
	npm run format

## lint: Run linter and format checker
lint:
	@echo "Running linter..."
	npm run lint

## test: Run all tests
test:
	@echo "Running tests..."
	npm test

## test-e2e: Run end-to-end tests
test-e2e:
	@echo "Running e2e tests..."
	npm run test:e2e

## test-ui: Run Playwright tests with UI
test-ui:
	@echo "Running e2e tests with UI..."
	npx playwright test --ui

## test-headed: Run e2e tests in headed mode
test-headed:
	@echo "Running e2e tests in headed mode..."
	npx playwright test --headed

## clean: Remove build artifacts and dependencies
clean:
	@echo "Cleaning build artifacts..."
	rm -rf build .svelte-kit node_modules
	@echo "Clean complete!"

## clean-build: Remove only build artifacts (keep dependencies)
clean-build:
	@echo "Cleaning build artifacts..."
	rm -rf build .svelte-kit
	@echo "Clean complete!"

## rebuild: Clean and rebuild the project
rebuild: clean-build build

## ci: Run checks for CI/CD pipeline (lint, type-check, build, test)
ci: lint check build test
	@echo "All CI checks passed!"

## update: Update dependencies
update:
	@echo "Updating dependencies..."
	npm update
	@echo "Update complete!"

