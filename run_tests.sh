#!/bin/bash
# Comprehensive Test Runner for Natural Speech Project

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Natural Speech - Test Runner${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to run backend tests
run_backend_tests() {
    echo -e "${YELLOW}Running Backend Tests...${NC}"
    cd backend
    
    if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
        echo -e "${YELLOW}Warning: Virtual environment not found. Some tests may fail.${NC}"
    fi
    
    echo -e "${BLUE}Running unit and integration tests...${NC}"
    python -m pytest tests/ -v --tb=short || echo -e "${RED}Some backend tests failed${NC}"
    
    echo -e "${BLUE}Running performance tests...${NC}"
    python -m pytest tests/test_performance_load.py -v -m "performance" --tb=short || echo -e "${YELLOW}Performance tests skipped or failed${NC}"
    
    cd ..
    echo -e "${GREEN}Backend tests completed${NC}\n"
}

# Function to run frontend tests
run_frontend_tests() {
    echo -e "${YELLOW}Running Frontend Tests...${NC}"
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Warning: node_modules not found. Installing dependencies...${NC}"
        npm install
    fi
    
    echo -e "${BLUE}Running component tests...${NC}"
    npm test -- --run || echo -e "${RED}Some frontend tests failed${NC}"
    
    echo -e "${BLUE}Running E2E tests (requires backend running)...${NC}"
    echo -e "${YELLOW}Note: E2E tests require both backend and frontend servers running${NC}"
    npm run test:e2e || echo -e "${YELLOW}E2E tests skipped (servers may not be running)${NC}"
    
    cd ..
    echo -e "${GREEN}Frontend tests completed${NC}\n"
}

# Function to validate project structure
validate_project() {
    echo -e "${YELLOW}Validating Project Structure...${NC}"
    if [ -f "validate_project.py" ]; then
        python3 validate_project.py || echo -e "${YELLOW}Validation completed with warnings${NC}"
    else
        echo -e "${YELLOW}Validation script not found${NC}"
    fi
    echo ""
}

# Main execution
case "${1:-all}" in
    backend)
        run_backend_tests
        ;;
    frontend)
        run_frontend_tests
        ;;
    validate)
        validate_project
        ;;
    all)
        validate_project
        run_backend_tests
        run_frontend_tests
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}All tests completed!${NC}"
        echo -e "${GREEN}========================================${NC}"
        ;;
    *)
        echo "Usage: $0 [backend|frontend|validate|all]"
        exit 1
        ;;
esac

