#!/usr/bin/env python3
"""
Project Validation Script

This script validates that the Natural Speech project is properly set up
and all critical components are in place.

Usage:
    python validate_project.py
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import List, Tuple

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

class ValidationResult:
    def __init__(self, name: str, passed: bool, message: str = ""):
        self.name = name
        self.passed = passed
        self.message = message

def check_file_exists(filepath: str, description: str) -> ValidationResult:
    """Check if a file exists."""
    path = Path(filepath)
    exists = path.exists()
    message = f"{filepath} {'exists' if exists else 'missing'}"
    return ValidationResult(description, exists, message)

def check_directory_exists(dirpath: str, description: str) -> ValidationResult:
    """Check if a directory exists."""
    path = Path(dirpath)
    exists = path.exists() and path.is_dir()
    message = f"{dirpath} {'exists' if exists else 'missing'}"
    return ValidationResult(description, exists, message)

def check_python_import(module: str, description: str) -> ValidationResult:
    """Check if a Python module can be imported."""
    try:
        __import__(module)
        return ValidationResult(description, True, f"{module} can be imported")
    except ImportError as e:
        return ValidationResult(description, False, f"{module} import failed: {e}")

def check_node_module(module: str, description: str) -> ValidationResult:
    """Check if a Node.js module is installed."""
    try:
        result = subprocess.run(
            ['npm', 'list', module],
            cwd='frontend',
            capture_output=True,
            text=True,
            timeout=10
        )
        installed = result.returncode == 0
        message = f"{module} {'installed' if installed else 'not found'}"
        return ValidationResult(description, installed, message)
    except Exception as e:
        return ValidationResult(description, False, f"Error checking {module}: {e}")

def check_backend_structure() -> List[ValidationResult]:
    """Check backend structure."""
    results = []
    
    # Critical files
    results.append(check_file_exists("backend/main.py", "Backend main.py"))
    results.append(check_file_exists("backend/requirements.txt", "Backend requirements.txt"))
    results.append(check_file_exists("backend/config.py", "Backend config.py"))
    results.append(check_file_exists("backend/tts_service.py", "Backend TTS service"))
    results.append(check_file_exists("backend/avatar_service.py", "Backend avatar service"))
    results.append(check_file_exists("backend/.env.example", "Backend .env.example"))
    
    # Important modules
    results.append(check_file_exists("backend/exceptions.py", "Backend exceptions"))
    results.append(check_file_exists("backend/models.py", "Backend models"))
    results.append(check_file_exists("backend/security.py", "Backend security"))
    results.append(check_file_exists("backend/logger_config.py", "Backend logger config"))
    
    # Services
    results.append(check_file_exists("backend/job_tracker.py", "Backend job tracker"))
    results.append(check_file_exists("backend/cache_manager.py", "Backend cache manager"))
    results.append(check_file_exists("backend/background_tasks.py", "Backend background tasks"))
    results.append(check_file_exists("backend/cleanup_scheduler.py", "Backend cleanup scheduler"))
    
    # Tests
    results.append(check_directory_exists("backend/tests", "Backend tests directory"))
    results.append(check_file_exists("backend/tests/test_main.py", "Backend main tests"))
    
    return results

def check_frontend_structure() -> List[ValidationResult]:
    """Check frontend structure."""
    results = []
    
    # Critical files
    results.append(check_file_exists("frontend/package.json", "Frontend package.json"))
    results.append(check_file_exists("frontend/vite.config.js", "Frontend Vite config"))
    results.append(check_file_exists("frontend/src/App.jsx", "Frontend App.jsx"))
    results.append(check_file_exists("frontend/src/main.jsx", "Frontend main.jsx"))
    results.append(check_file_exists("frontend/.env.example", "Frontend .env.example"))
    
    # Components
    results.append(check_directory_exists("frontend/src/components", "Frontend components"))
    results.append(check_file_exists("frontend/src/components/Layout.jsx", "Layout component"))
    results.append(check_file_exists("frontend/src/components/TextInput.jsx", "TextInput component"))
    results.append(check_file_exists("frontend/src/components/Controls.jsx", "Controls component"))
    results.append(check_file_exists("frontend/src/components/AudioPlayer.jsx", "AudioPlayer component"))
    results.append(check_file_exists("frontend/src/components/VideoPlayer.jsx", "VideoPlayer component"))
    
    # API and context
    results.append(check_file_exists("frontend/src/api.js", "Frontend API client"))
    results.append(check_directory_exists("frontend/src/context", "Frontend context"))
    results.append(check_file_exists("frontend/src/context/AppContext.jsx", "App context"))
    
    # Tests
    results.append(check_directory_exists("frontend/e2e", "Frontend E2E tests"))
    results.append(check_file_exists("frontend/playwright.config.js", "Playwright config"))
    
    return results

def check_documentation() -> List[ValidationResult]:
    """Check documentation."""
    results = []
    
    results.append(check_file_exists("README.md", "Main README"))
    results.append(check_file_exists("QUICK_START.md", "Quick Start guide"))
    results.append(check_file_exists("COMPLETION_PLAN.md", "Completion plan"))
    results.append(check_file_exists("ARCHITECTURE.md", "Architecture docs"))
    results.append(check_file_exists("CONTRIBUTING.md", "Contributing guide"))
    
    results.append(check_directory_exists("docs", "Documentation directory"))
    results.append(check_file_exists("docs/API.md", "API documentation"))
    results.append(check_file_exists("docs/DEVELOPER_GUIDE.md", "Developer guide"))
    results.append(check_file_exists("docs/USER_GUIDE.md", "User guide"))
    
    return results

def check_configuration() -> List[ValidationResult]:
    """Check configuration files."""
    results = []
    
    results.append(check_file_exists(".gitignore", ".gitignore file"))
    results.append(check_file_exists("docker-compose.yml", "Docker Compose config"))
    results.append(check_file_exists("setup.sh", "Setup script (Linux/Mac)"))
    results.append(check_file_exists("setup.bat", "Setup script (Windows)"))
    results.append(check_file_exists("start.sh", "Start script (Linux/Mac)"))
    results.append(check_file_exists("start.bat", "Start script (Windows)"))
    
    return results

def check_imports() -> List[ValidationResult]:
    """Check critical Python imports."""
    results = []
    
    # Add backend to path
    sys.path.insert(0, 'backend')
    
    try:
        results.append(check_python_import("config", "Config module"))
        results.append(check_python_import("exceptions", "Exceptions module"))
        results.append(check_python_import("models", "Models module"))
        results.append(check_python_import("security", "Security module"))
    except Exception as e:
        results.append(ValidationResult("Python imports", False, f"Error checking imports: {e}"))
    
    return results

def print_results(results: List[ValidationResult], category: str):
    """Print validation results for a category."""
    print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{BLUE}{category}{RESET}")
    print(f"{BOLD}{BLUE}{'='*60}{RESET}\n")
    
    passed = 0
    failed = 0
    
    for result in results:
        if result.passed:
            print(f"{GREEN}✓{RESET} {result.name}")
            passed += 1
        else:
            print(f"{RED}✗{RESET} {result.name}")
            if result.message:
                print(f"  {YELLOW}→{RESET} {result.message}")
            failed += 1
    
    print(f"\n{BOLD}Summary:{RESET} {GREEN}{passed} passed{RESET}, {RED}{failed} failed{RESET}")
    return passed, failed

def main():
    """Main validation function."""
    print(f"{BOLD}{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{BLUE}Natural Speech Project Validation{RESET}")
    print(f"{BOLD}{BLUE}{'='*60}{RESET}")
    
    total_passed = 0
    total_failed = 0
    
    # Check backend
    backend_results = check_backend_structure()
    passed, failed = print_results(backend_results, "Backend Structure")
    total_passed += passed
    total_failed += failed
    
    # Check frontend
    frontend_results = check_frontend_structure()
    passed, failed = print_results(frontend_results, "Frontend Structure")
    total_passed += passed
    total_failed += failed
    
    # Check documentation
    docs_results = check_documentation()
    passed, failed = print_results(docs_results, "Documentation")
    total_passed += passed
    total_failed += failed
    
    # Check configuration
    config_results = check_configuration()
    passed, failed = print_results(config_results, "Configuration Files")
    total_passed += passed
    total_failed += failed
    
    # Check imports (optional - may fail if dependencies not installed)
    try:
        import_results = check_imports()
        passed, failed = print_results(import_results, "Python Imports (Optional)")
        # Don't count import failures as critical
    except Exception as e:
        print(f"\n{YELLOW}Note: Python import check skipped: {e}{RESET}")
    
    # Final summary
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}Final Summary{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")
    print(f"{GREEN}Total Passed: {total_passed}{RESET}")
    print(f"{RED}Total Failed: {total_failed}{RESET}")
    
    if total_failed == 0:
        print(f"\n{BOLD}{GREEN}✓ Project validation PASSED!{RESET}")
        return 0
    else:
        print(f"\n{BOLD}{YELLOW}⚠ Project validation completed with {total_failed} issue(s){RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(main())

