# Contributing to FlowVision

Thank you for your interest in contributing to FlowVision! This document provides guidelines and instructions for contributing to the project.

## 🎯 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please treat all contributors with respect and maintain a positive, collaborative environment.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Docker (recommended for development)
- Git

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/flowvision.git
   cd flowvision
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your development environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local configuration
   ```

4. **Start the development database**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 🛠️ Development Workflow

### Branch Naming Convention

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test additions or updates

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add user registration with email verification
fix(dashboard): resolve initiative loading performance issue
docs(readme): update installation instructions
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow our coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(component): add new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use our PR template
   - Provide clear description of changes
   - Link related issues
   - Request review from maintainers

## 📋 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type unless absolutely necessary
- Use strict mode settings

### React Components

- Use functional components with hooks
- Follow naming conventions: PascalCase for components
- Use descriptive prop names
- Implement proper error boundaries

### Database

- Use Prisma for all database operations
- Create migrations for schema changes
- Include proper relationships and constraints
- Add database seeds for testing

### API Routes

- Implement proper error handling
- Use Zod for input validation
- Include audit logging for data changes
- Follow RESTful conventions

### Testing

- Write unit tests for utility functions
- Test React components with Testing Library
- Create integration tests for API routes
- Maintain 80%+ test coverage

### File Organization

```
src/
├── app/              # Next.js app directory
├── components/       # Reusable UI components
├── lib/             # Utility functions and configurations
├── types/           # TypeScript type definitions
├── tests/           # Test files
└── prisma/          # Database schema and migrations
```

## 🧪 Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Use descriptive test names
- Cover edge cases and error conditions

```typescript
describe('calculatePriority', () => {
  it('should return high priority for critical issues', () => {
    const result = calculatePriority({ severity: 'critical', impact: 'high' });
    expect(result).toBe('high');
  });
});
```

### Integration Tests

- Test API endpoints
- Test database operations
- Use test database
- Clean up after tests

### E2E Tests

- Test complete user workflows
- Use Cypress for browser testing
- Test critical user paths
- Maintain stable test data

## 📚 Documentation

### Code Documentation

- Use JSDoc for function documentation
- Include type information
- Provide usage examples
- Document complex algorithms

### README Updates

- Keep installation instructions current
- Update feature lists
- Include screenshots for UI changes
- Maintain API documentation

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - Operating system
   - Node.js version
   - Browser (if applicable)

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots or videos if helpful

3. **Additional Context**
   - Error messages or logs
   - Related issues or PRs
   - Possible solutions you've considered

## ✨ Feature Requests

For new features, please provide:

1. **Problem Statement**
   - What problem does this solve?
   - Who would benefit from this feature?

2. **Proposed Solution**
   - Detailed description of the feature
   - User interface mockups (if applicable)
   - Technical considerations

3. **Alternatives Considered**
   - Other solutions you've considered
   - Why this approach is preferred

## 📊 Performance Guidelines

- Optimize for Core Web Vitals
- Use Next.js built-in optimizations
- Implement proper caching strategies
- Monitor bundle size
- Use lazy loading where appropriate

## 🔒 Security Considerations

- Never commit sensitive data
- Use environment variables for secrets
- Implement proper input validation
- Follow OWASP security guidelines
- Report security issues privately

## 📞 Getting Help

- **GitHub Discussions**: For questions and community support
- **GitHub Issues**: For bug reports and feature requests
- **Email**: maintainers@flowvision.app for private inquiries

## 🎉 Recognition

Contributors will be recognized in:
- README contributors section
- Release notes for their contributions
- GitHub contributor graphs

Thank you for contributing to FlowVision! Your efforts help make operational excellence accessible to teams everywhere.