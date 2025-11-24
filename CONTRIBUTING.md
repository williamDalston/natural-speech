# Contributing to Natural Speech

Thank you for your interest in contributing to Natural Speech! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** and clone your fork
2. **Read the documentation**:
   - [README.md](README.md) - Project overview
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
   - [AGENT_TASKS.md](AGENT_TASKS.md) - Development tasks

3. **Set up your development environment**:
   ```bash
   ./setup.sh  # or setup.bat on Windows
   ```

## Development Workflow

### Code Style

**Backend (Python):**
- Follow PEP 8 style guide
- Use type hints where possible
- Maximum line length: 100 characters
- Use `black` for formatting: `black backend/`
- Use `flake8` for linting: `flake8 backend/`

**Frontend (JavaScript/React):**
- Follow ESLint rules (configured in `eslint.config.js`)
- Use Prettier for formatting
- Use functional components with hooks
- Maximum line length: 100 characters

### Testing

Before submitting changes:
- Run backend tests: `pytest backend/tests/`
- Run frontend tests: `npm test` (in frontend directory)
- Test manually in development mode

### Commit Messages

Use clear, descriptive commit messages:
```
feat: Add new voice selection feature
fix: Resolve avatar generation timeout issue
docs: Update API documentation
refactor: Improve error handling in TTS service
```

### Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following code style guidelines

3. **Test your changes** thoroughly

4. **Update documentation** if needed

5. **Submit a pull request** with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots (for UI changes)

## Project Structure

- `backend/` - FastAPI backend code
- `frontend/` - React frontend code
- `docs/` - Additional documentation
- `AGENT_TASKS.md` - Development task breakdown
- `AGENT_PROGRESS.md` - Current development status

## Agent Tasks

This project uses an agent-based development approach. See [AGENT_TASKS.md](AGENT_TASKS.md) for:
- Task breakdown by agent
- Dependencies between tasks
- Completion criteria

## Areas for Contribution

### High Priority
- Bug fixes and error handling improvements
- Performance optimizations
- Documentation improvements
- Test coverage

### Medium Priority
- New features (see AGENT_TASKS.md)
- UI/UX improvements
- Accessibility enhancements
- Code refactoring

### Low Priority
- Code comments and documentation
- Code style improvements
- Dependency updates

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in discussions

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Celebrate contributions of all kinds

Thank you for contributing to Natural Speech! 🎉

