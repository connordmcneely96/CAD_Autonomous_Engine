# CLAUDE.md - AI Assistant Guide for CAD Autonomous Engine

## Project Overview

**CAD_Autonomous_Engine** is an autonomous Computer-Aided Design (CAD) engine project. This repository is currently in its initial setup phase.

**Last Updated:** 2025-11-17
**Repository Status:** Fresh initialization - no existing codebase yet

---

## Table of Contents

1. [Repository Structure](#repository-structure)
2. [Development Workflows](#development-workflows)
3. [Code Conventions](#code-conventions)
4. [Git Workflow](#git-workflow)
5. [Testing Strategy](#testing-strategy)
6. [Documentation Standards](#documentation-standards)
7. [AI Assistant Guidelines](#ai-assistant-guidelines)
8. [Dependencies and Environment](#dependencies-and-environment)

---

## Repository Structure

As this is a new repository, the following structure is recommended:

```
CAD_Autonomous_Engine/
├── .github/              # GitHub workflows, issue templates
│   ├── workflows/        # CI/CD pipelines
│   └── ISSUE_TEMPLATE/   # Issue templates
├── docs/                 # Project documentation
│   ├── architecture/     # Architecture decision records
│   ├── api/             # API documentation
│   └── guides/          # User and developer guides
├── src/                 # Source code
│   ├── core/            # Core engine functionality
│   ├── models/          # Data models and schemas
│   ├── services/        # Service layer
│   ├── utils/           # Utility functions
│   └── api/             # API endpoints
├── tests/               # Test suite
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/            # End-to-end tests
├── scripts/             # Build and utility scripts
├── config/              # Configuration files
├── examples/            # Example usage and demos
├── .gitignore           # Git ignore rules
├── README.md            # Project overview and setup
├── CLAUDE.md            # This file - AI assistant guide
├── CONTRIBUTING.md      # Contribution guidelines
├── LICENSE              # Project license
└── package.json         # Project dependencies (if Node.js)
```

---

## Development Workflows

### Initial Setup

When starting work on this project:

1. **Check the current branch**: Always verify you're on the correct feature branch
2. **Pull latest changes**: `git pull origin <branch-name>` before starting work
3. **Understand the context**: Review recent commits and open issues
4. **Plan your work**: Use TODO tracking for complex tasks

### Making Changes

1. **Research first**: Understand existing patterns before implementing
2. **Follow conventions**: Maintain consistency with existing code style
3. **Write tests**: Include tests for new functionality
4. **Document**: Update relevant documentation
5. **Commit frequently**: Make small, logical commits with clear messages

### Code Review Checklist

Before committing:
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] No hardcoded credentials or secrets
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

---

## Code Conventions

### General Principles

1. **Clarity over cleverness**: Write readable, maintainable code
2. **DRY (Don't Repeat Yourself)**: Extract common functionality
3. **SOLID principles**: Follow object-oriented design principles
4. **Error handling**: Always handle errors gracefully
5. **Security first**: Validate inputs, sanitize outputs

### Naming Conventions

- **Files**: Use lowercase with hyphens (e.g., `cad-engine.ts`)
- **Classes**: PascalCase (e.g., `CADEngine`)
- **Functions**: camelCase (e.g., `processGeometry`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_VERTICES`)
- **Private members**: Prefix with underscore (e.g., `_internalState`)

### Code Style

- Use consistent indentation (2 or 4 spaces, project-defined)
- Maximum line length: 100 characters
- Use meaningful variable names (avoid single letters except in loops)
- Add comments for complex logic, not obvious code
- Group related functions together

### Security Guidelines

**Critical - Always Check For:**

1. **Input Validation**: Validate all user inputs
2. **SQL Injection**: Use parameterized queries
3. **XSS Prevention**: Sanitize HTML output
4. **Authentication**: Verify user permissions
5. **Secrets Management**: Never commit credentials
6. **Dependency Security**: Regularly audit dependencies

---

## Git Workflow

### Branch Strategy

- **main/master**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature branches (`feature/description`)
- **bugfix/**: Bug fix branches (`bugfix/issue-number`)
- **hotfix/**: Urgent production fixes
- **claude/**: AI assistant working branches (auto-managed)

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes

**Example:**
```
feat(cad-engine): add geometry processing pipeline

Implement core geometry processing with support for:
- Vertex transformation
- Normal calculation
- Mesh optimization

Closes #123
```

### Commit Best Practices

1. **Atomic commits**: One logical change per commit
2. **Descriptive messages**: Explain the "why", not just the "what"
3. **Reference issues**: Link to relevant issue numbers
4. **Test before commit**: Ensure tests pass
5. **Sign commits**: Use GPG signing if required

---

## Testing Strategy

### Test Pyramid

1. **Unit Tests** (70%): Test individual functions/classes
2. **Integration Tests** (20%): Test component interactions
3. **E2E Tests** (10%): Test full user workflows

### Testing Guidelines

- Write tests before or alongside implementation (TDD encouraged)
- Aim for 80%+ code coverage
- Test edge cases and error conditions
- Use descriptive test names: `should_do_something_when_condition`
- Mock external dependencies
- Keep tests fast and independent

### Test Structure

```javascript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should perform expected behavior when given valid input', () => {
      // Arrange
      const input = setupTestData();

      // Act
      const result = methodName(input);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

---

## Documentation Standards

### Code Documentation

- **Functions**: Document purpose, parameters, return values, and exceptions
- **Classes**: Document purpose, key methods, and usage examples
- **Modules**: Include module-level documentation explaining purpose
- **Complex Logic**: Add inline comments explaining the approach

### Documentation Format

Use JSDoc, Javadoc, or language-appropriate documentation format:

```javascript
/**
 * Processes CAD geometry and optimizes mesh structure
 *
 * @param {Geometry} geometry - Input geometry to process
 * @param {ProcessOptions} options - Processing configuration
 * @returns {ProcessedGeometry} Optimized geometry structure
 * @throws {InvalidGeometryError} If geometry is malformed
 *
 * @example
 * const processed = processGeometry(mesh, { optimize: true });
 */
function processGeometry(geometry, options) {
  // Implementation
}
```

### README Requirements

Every significant module should have a README that includes:
- Purpose and overview
- Installation/setup instructions
- Usage examples
- API reference (or link to it)
- Configuration options
- Known limitations

---

## AI Assistant Guidelines

### Core Responsibilities

When working on this project as an AI assistant:

1. **Understand context first**: Read relevant files before making changes
2. **Plan complex tasks**: Use TODO tracking for multi-step work
3. **Maintain quality**: Follow all conventions and standards
4. **Security conscious**: Always check for vulnerabilities
5. **Test thoroughly**: Include tests with implementations
6. **Document changes**: Update docs to match code changes

### Decision-Making Framework

**When to proceed autonomously:**
- Bug fixes with clear reproduction
- Implementing well-defined features
- Refactoring with existing test coverage
- Documentation improvements
- Code style consistency fixes

**When to ask for clarification:**
- Ambiguous requirements
- Architectural decisions
- Breaking changes
- Security-sensitive changes
- Multiple valid approaches exist

### Code Implementation Approach

1. **Research**: Search for similar existing implementations
2. **Plan**: Break down complex tasks into steps
3. **Implement**: Write clean, tested code
4. **Verify**: Run tests and check for issues
5. **Document**: Update relevant documentation
6. **Review**: Self-review for quality and security

### Common Pitfalls to Avoid

- ❌ Don't assume file locations - search first
- ❌ Don't skip tests - they're critical
- ❌ Don't ignore existing patterns - maintain consistency
- ❌ Don't commit secrets - scan for credentials
- ❌ Don't make assumptions - verify or ask
- ❌ Don't batch completions - mark tasks done immediately

### Tool Usage Preferences

- **File Operations**: Use Read/Edit/Write tools, not bash commands
- **Searching**: Use Task tool with Explore agent for broad searches
- **Testing**: Run tests after changes, fix failures immediately
- **Git Operations**: Commit frequently with clear messages

---

## Dependencies and Environment

### Development Environment

**Required:**
- Git (version control)
- Code editor with language support
- Testing framework
- Linter and formatter

**Recommended:**
- Docker (for containerization)
- CI/CD pipeline
- Code coverage tools
- Security scanning tools

### Dependency Management

1. **Pin versions**: Use exact versions for reproducibility
2. **Regular updates**: Keep dependencies up-to-date
3. **Security audits**: Run security scans regularly
4. **Minimal dependencies**: Only add when necessary
5. **License compliance**: Verify license compatibility

### Environment Variables

Store configuration in environment variables:

```bash
# Never commit these values
CAD_ENGINE_API_KEY=<secret>
DATABASE_URL=<connection-string>
LOG_LEVEL=info
NODE_ENV=development
```

Use `.env` files for local development (add to `.gitignore`)

---

## Project Evolution

As this project grows, this document should be updated to reflect:

- New architectural patterns adopted
- Changes to project structure
- Updates to conventions and standards
- Lessons learned from development
- New tools and workflows introduced

### Updating This Document

When updating CLAUDE.md:
1. Add update date to Project Overview
2. Document reason for changes
3. Ensure examples reflect current codebase
4. Keep guidelines consistent with actual code
5. Remove outdated information

---

## Quick Reference

### Essential Commands

```bash
# Check current status
git status

# Run tests
npm test  # or appropriate command for chosen stack

# Lint code
npm run lint  # or appropriate command

# Build project
npm run build  # or appropriate command

# Start development server
npm run dev  # or appropriate command
```

### Key File Locations

- Configuration: `./config/`
- Source code: `./src/`
- Tests: `./tests/`
- Documentation: `./docs/`
- Scripts: `./scripts/`

### Support and Resources

- **Issues**: Use GitHub issues for bugs and features
- **Discussions**: Use GitHub discussions for questions
- **Documentation**: Check `./docs/` directory
- **Examples**: See `./examples/` directory

---

## Notes for Future Development

### Technology Stack Decision Needed

Before beginning implementation, decide on:

1. **Programming Language**: Python, TypeScript, Rust, C++, etc.
2. **CAD Framework**: Choose appropriate CAD/geometry library
3. **Architecture Pattern**: Microservices, monolithic, etc.
4. **Database**: If data persistence is needed
5. **API Framework**: REST, GraphQL, gRPC, etc.

### Initial Implementation Priorities

Suggested order of development:

1. Define core data models and structures
2. Implement basic geometry operations
3. Add autonomous processing capabilities
4. Build API layer
5. Create user interface (if applicable)
6. Add monitoring and logging
7. Implement advanced features

---

**Remember**: This is a living document. Keep it updated as the project evolves.

For questions or suggestions about this guide, open an issue or discussion on GitHub.
