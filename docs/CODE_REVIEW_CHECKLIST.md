# Code Review Checklist

Use this checklist when reviewing code changes in the Natural Speech project.

## General

- [ ] Code follows project style guidelines
- [ ] No debug code or console.logs (except error logging)
- [ ] No commented-out code
- [ ] No hardcoded values (use environment variables)
- [ ] Code is readable and well-structured
- [ ] Appropriate comments added where needed

## Backend (Python)

- [ ] Code formatted with Black
- [ ] Imports sorted with isort
- [ ] Passes flake8 linting
- [ ] Type hints added where appropriate
- [ ] Docstrings added for functions/classes
- [ ] Error handling is comprehensive
- [ ] No security vulnerabilities
- [ ] Tests added/updated
- [ ] Tests pass locally

## Frontend (JavaScript/React)

- [ ] Code formatted with Prettier
- [ ] Passes ESLint checks
- [ ] No unused imports or variables
- [ ] Components are properly structured
- [ ] Props are validated
- [ ] Error boundaries in place
- [ ] Accessibility considerations (ARIA labels, keyboard nav)
- [ ] Responsive design tested
- [ ] Tests added/updated
- [ ] Tests pass locally

## Testing

- [ ] Unit tests added for new functionality
- [ ] Integration tests updated if needed
- [ ] Test coverage maintained or improved
- [ ] Tests are clear and well-documented
- [ ] Edge cases are tested
- [ ] Error cases are tested

## Documentation

- [ ] API documentation updated (if API changes)
- [ ] Code comments added for complex logic
- [ ] README updated if needed
- [ ] User guide updated if UI changes
- [ ] Developer guide updated if architecture changes

## Security

- [ ] No sensitive data in code
- [ ] Input validation in place
- [ ] File uploads validated
- [ ] Rate limiting considered
- [ ] CORS properly configured
- [ ] No SQL injection risks
- [ ] No XSS vulnerabilities

## Performance

- [ ] No obvious performance issues
- [ ] Large files handled efficiently
- [ ] Database queries optimized (if applicable)
- [ ] Caching used where appropriate
- [ ] Memory leaks checked

## Error Handling

- [ ] Errors are caught and handled
- [ ] User-friendly error messages
- [ ] Errors are logged appropriately
- [ ] Error responses follow API standards

## Dependencies

- [ ] New dependencies are necessary
- [ ] Dependencies are up-to-date
- [ ] No security vulnerabilities in dependencies
- [ ] Requirements files updated

## Git

- [ ] Commit messages are clear and descriptive
- [ ] No large files committed
- [ ] .gitignore is up-to-date
- [ ] Branch is up-to-date with main

## Deployment

- [ ] Environment variables documented
- [ ] Migration scripts if database changes
- [ ] Backward compatibility considered
- [ ] Breaking changes documented

## Checklist for Specific Changes

### API Changes
- [ ] OpenAPI/Swagger docs updated
- [ ] Versioning considered
- [ ] Backward compatibility maintained
- [ ] Error responses documented

### Database Changes
- [ ] Migration scripts created
- [ ] Rollback plan documented
- [ ] Indexes considered

### UI Changes
- [ ] Responsive design tested
- [ ] Accessibility tested
- [ ] Browser compatibility checked
- [ ] Visual regression considered

### Feature Additions
- [ ] Feature documented
- [ ] Tests comprehensive
- [ ] User guide updated
- [ ] Breaking changes documented

## Review Process

1. **Initial Review:**
   - Check code style and structure
   - Verify tests are present
   - Check for obvious bugs

2. **Detailed Review:**
   - Review logic and implementation
   - Check error handling
   - Verify security considerations

3. **Testing:**
   - Run tests locally
   - Test manually if needed
   - Check edge cases

4. **Final Check:**
   - All checklist items reviewed
   - Approve or request changes
   - Provide constructive feedback

## Common Issues to Watch For

- **Security:** Hardcoded secrets, SQL injection, XSS
- **Performance:** N+1 queries, memory leaks, blocking operations
- **Error Handling:** Uncaught exceptions, unclear error messages
- **Testing:** Missing tests, flaky tests, poor coverage
- **Documentation:** Missing docs, outdated docs, unclear comments
- **Code Quality:** Duplication, complexity, maintainability

## Approval Criteria

Code should be approved when:
- ✅ All checklist items are satisfied
- ✅ Tests pass and coverage is maintained
- ✅ Code follows project standards
- ✅ No security or performance concerns
- ✅ Documentation is updated
- ✅ Reviewer understands the changes

