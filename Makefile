.PHONY: help install test lint format clean setup dev

# Default target
help:
	@echo "Natural Speech - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Initial project setup (backend + frontend)"
	@echo "  make install        - Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start both backend and frontend in development mode"
	@echo "  make dev-backend    - Start backend only"
	@echo "  make dev-frontend   - Start frontend only"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests (backend + frontend)"
	@echo "  make test-backend   - Run backend tests"
	@echo "  make test-frontend  - Run frontend tests"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint           - Run all linters"
	@echo "  make lint-backend   - Run backend linters"
	@echo "  make lint-frontend  - Run frontend linters"
	@echo "  make format         - Format all code"
	@echo "  make format-backend - Format backend code"
	@echo "  make format-frontend - Format frontend code"
	@echo ""
	@echo "Build:"
	@echo "  make build          - Build both backend and frontend"
	@echo "  make build-frontend - Build frontend for production"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          - Remove build artifacts and cache"
	@echo "  make clean-backend  - Clean backend artifacts"
	@echo "  make clean-frontend - Clean frontend artifacts"

# Setup
setup:
	@echo "Setting up Natural Speech..."
	@cd backend && python3 -m venv venv || true
	@cd backend && . venv/bin/activate && pip install -r requirements.txt && pip install -r requirements-dev.txt || echo "Backend setup complete"
	@cd frontend && npm install || echo "Frontend setup complete"
	@echo "Setup complete! Activate backend venv: source backend/venv/bin/activate"

install:
	@cd backend && pip install -r requirements.txt && pip install -r requirements-dev.txt
	@cd frontend && npm install

# Development
dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@make dev-backend & make dev-frontend

dev-backend:
	@cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	@cd frontend && npm run dev

# Testing
test:
	@echo "Running all tests..."
	@make test-backend
	@make test-frontend

test-backend:
	@cd backend && pytest -v

test-frontend:
	@cd frontend && npm test -- --run

test-coverage:
	@echo "Running tests with coverage..."
	@cd backend && pytest --cov=. --cov-report=html --cov-report=term
	@cd frontend && npm run test:coverage
	@echo "Coverage reports generated:"
	@echo "  Backend: backend/htmlcov/index.html"
	@echo "  Frontend: frontend/coverage/index.html"

# Linting
lint:
	@make lint-backend
	@make lint-frontend

lint-backend:
	@cd backend && echo "Running flake8..." && flake8 . --count --statistics
	@cd backend && echo "Running pylint..." && pylint *.py || true
	@cd backend && echo "Running mypy..." && mypy . --ignore-missing-imports || true

lint-frontend:
	@cd frontend && npm run lint

# Formatting
format:
	@make format-backend
	@make format-frontend

format-backend:
	@cd backend && black . && isort .

format-frontend:
	@cd frontend && npm run format

# Build
build:
	@make build-frontend

build-frontend:
	@cd frontend && npm run build

# Cleanup
clean:
	@make clean-backend
	@make clean-frontend

clean-backend:
	@cd backend && find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	@cd backend && find . -type f -name "*.pyc" -delete
	@cd backend && rm -rf .pytest_cache .coverage htmlcov .mypy_cache .ruff_cache
	@cd backend && rm -rf *.egg-info

clean-frontend:
	@cd frontend && rm -rf node_modules/.vite dist coverage .vite
	@cd frontend && find . -name "*.log" -delete

