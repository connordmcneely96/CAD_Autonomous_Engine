# Contributing to CAD Autonomous Engine

Thank you for your interest in contributing to CAD Autonomous Engine! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Add upstream remote: `git remote add upstream <original-repo-url>`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## 📋 Development Workflow

### Before You Start

1. Check existing issues and pull requests
2. Discuss major changes in an issue first
3. Follow the project structure and conventions
4. Read [CLAUDE.md](./CLAUDE.md) for AI assistant guidelines

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/description
   # or
   git checkout -b bugfix/issue-number
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Write tests for new features
   - Update documentation as needed
   - Keep commits atomic and focused

3. **Test your changes**
   ```bash
   pnpm test
   pnpm lint
   pnpm type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

## 📝 Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes
- `perf`: Performance improvements

### Examples

```
feat(frontend): add 3D model rotation controls

Add mouse controls for rotating 3D models in the viewer.
Includes touch support for mobile devices.

Closes #123
```

```
fix(backend): resolve CORS issue with file uploads

Update CORS configuration to allow multipart form data.

Fixes #456
```

## 🎨 Code Style

### TypeScript/JavaScript

- Use ESLint and Prettier (configs provided)
- Prefer `const` over `let`
- Use TypeScript strict mode
- Avoid `any` types when possible
- Write meaningful variable names

### Python

- Use Black for formatting
- Follow PEP 8 guidelines
- Use type hints
- Write docstrings for functions and classes
- Keep functions focused and small

### General

- Maximum line length: 100 characters
- Use 2 spaces for indentation in TS/JS
- Use 4 spaces for indentation in Python
- Add comments for complex logic

## 🧪 Testing

### Writing Tests

- Write tests for all new features
- Aim for 80%+ code coverage
- Test edge cases and error conditions
- Keep tests independent and isolated

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @cad-engine/frontend test

# With coverage
pnpm test -- --coverage
```

## 📚 Documentation

Update documentation when:
- Adding new features
- Changing APIs
- Modifying configuration
- Fixing bugs that affect usage

### Documentation Locations

- **README.md**: Project overview and setup
- **CLAUDE.md**: AI assistant guidelines
- **docs/api/**: API documentation
- **docs/guides/**: User and developer guides
- **Code comments**: Complex logic explanation

## 🔍 Code Review Process

1. **Submit a Pull Request**
   - Provide clear description
   - Link related issues
   - Include screenshots for UI changes
   - Ensure CI passes

2. **Review Feedback**
   - Address comments promptly
   - Make requested changes
   - Ask questions if unclear
   - Update PR description if scope changes

3. **Approval and Merge**
   - At least one approval required
   - All CI checks must pass
   - Conflicts must be resolved
   - Squash commits if requested

## ✅ Pull Request Checklist

Before submitting:

- [ ] Code follows project style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts
- [ ] CI/CD checks pass
- [ ] Changes are focused and atomic
- [ ] PR description is clear and complete

## 🐛 Reporting Bugs

Use GitHub Issues with:

1. **Clear title**: Brief description
2. **Environment**: OS, Node version, Python version
3. **Steps to reproduce**: Detailed steps
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happens
6. **Screenshots**: If applicable
7. **Additional context**: Anything else relevant

## 💡 Suggesting Features

Feature requests should include:

1. **Problem statement**: What problem does this solve?
2. **Proposed solution**: How should it work?
3. **Alternatives**: Other approaches considered
4. **Additional context**: Examples, mockups, etc.

## 🔐 Security

- Never commit secrets or API keys
- Report security vulnerabilities privately
- Use environment variables for sensitive data
- Follow security best practices

## 📦 Package-Specific Guidelines

### Frontend

- Use shadcn/ui components when possible
- Follow Next.js 14 App Router conventions
- Optimize images and assets
- Ensure responsive design

### Backend

- Validate all inputs
- Use proper HTTP status codes
- Handle errors gracefully
- Document API endpoints

### CAD Engine

- Handle large files efficiently
- Validate CAD file formats
- Provide progress feedback
- Clean up temporary files

### AI Service

- Rate limit API calls
- Cache responses when appropriate
- Handle API failures gracefully
- Validate prompts and responses

## 🌍 Community

- Be respectful and inclusive
- Help others in discussions
- Share knowledge and learnings
- Follow the Code of Conduct

## ❓ Questions?

- Check existing documentation
- Search closed issues
- Open a new issue for discussion
- Join community discussions

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to CAD Autonomous Engine! 🎉
