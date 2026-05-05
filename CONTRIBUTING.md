# Contributing Guide

## Employee Task Performance & Productivity Tracker

Thank you for your interest in contributing to this project! This guide will help you get started.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)

---

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- Be respectful and inclusive
- Welcome newcomers
- Be patient and helpful
- Accept constructive criticism gracefully
- Focus on what is best for the community

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

---

## 🚀 Getting Started

### Prerequisites

- Node.js v16 or higher
- MySQL v8 or higher
- Git
- Code editor (VS Code recommended)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:
```bash
git clone https://github.com/YOUR_USERNAME/employee-task-tracker.git
cd employee-task-tracker
```

3. **Add upstream remote**:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/employee-task-tracker.git
```

### Setup Development Environment

1. **Install dependencies**:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

2. **Setup database**:
```bash
mysql -u root -p
CREATE DATABASE employee_tracker_dev;
exit;
```

3. **Configure environment**:
```bash
cd backend
cp .env.example .env
# Edit .env with your local settings
```

4. **Seed database**:
```bash
npm run seed
```

5. **Start development servers**:
```bash
# From root directory
npm run dev
```

---

## 🔄 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

- **Features**: `feature/feature-name`
- **Bug Fixes**: `fix/bug-description`
- **Documentation**: `docs/what-changed`
- **Refactoring**: `refactor/what-changed`
- **Performance**: `perf/what-improved`
- **Tests**: `test/what-tested`

### 2. Make Changes

- Write clean, readable code
- Follow coding standards (see below)
- Add tests for new features
- Update documentation as needed
- Test your changes thoroughly

### 3. Commit Changes

```bash
git add .
git commit -m "feat: add user profile editing"
```

See [Commit Guidelines](#commit-guidelines) for commit message format.

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template
5. Submit the pull request

---

## 📝 Coding Standards

### JavaScript/React Style Guide

#### General Rules

- Use ES6+ features
- Use `const` and `let`, never `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use destructuring when appropriate
- Use async/await instead of promises chains

#### Naming Conventions

```javascript
// Variables and functions: camelCase
const userName = 'John';
function getUserData() {}

// Classes and Components: PascalCase
class UserManager {}
const UserProfile = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'http://api.example.com';

// Private methods: _prefixed
class Example {
  _privateMethod() {}
}

// Boolean variables: is/has prefix
const isActive = true;
const hasPermission = false;
```

#### Code Formatting

```javascript
// ✅ Good
const user = {
  name: 'John',
  email: 'john@example.com',
  role: 'admin'
};

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad
const user={name:'John',email:'john@example.com',role:'admin'};

function calculateTotal(items){
return items.reduce((sum,item)=>sum+item.price,0);}
```

#### React Best Practices

```javascript
// ✅ Good - Functional components with hooks
import { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  const fetchUser = async (id) => {
    try {
      setLoading(true);
      const data = await api.getUser(id);
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

export default UserProfile;
```

#### Backend Best Practices

```javascript
// ✅ Good - Controller with error handling
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// ❌ Bad - No error handling, inconsistent response
export const getUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  res.json(user);
};
```

### File Organization

```
backend/src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # Database models
├── routes/          # Route definitions
├── utils/           # Utility functions
└── server.js        # Entry point

frontend/src/
├── components/      # Reusable components
├── contexts/        # React contexts
├── pages/           # Page components
├── utils/           # Utility functions
├── App.jsx          # Main app component
└── main.jsx         # Entry point
```

### Comments

```javascript
// ✅ Good - Explain WHY, not WHAT
// Calculate performance score based on completed tasks
// Formula: (completed / total) * 100
const performanceScore = (completedTasks / totalTasks) * 100;

// ❌ Bad - Obvious comment
// Set user name to John
const userName = 'John';
```

### Error Handling

```javascript
// ✅ Good - Specific error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    logger.error('Database connection failed:', error);
    throw new DatabaseError('Unable to connect to database');
  }
  throw error;
}

// ❌ Bad - Silent failure
try {
  await riskyOperation();
} catch (error) {
  // Do nothing
}
```

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(auth): add password reset functionality"

# Bug fix
git commit -m "fix(tasks): resolve pagination issue on tasks page"

# Documentation
git commit -m "docs(api): update API documentation for user endpoints"

# Refactoring
git commit -m "refactor(dashboard): simplify chart data processing"

# With body
git commit -m "feat(notifications): add real-time notifications

- Implement WebSocket connection
- Add notification badge to header
- Create notification dropdown component

Closes #123"
```

### Commit Message Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- First line should be 50 characters or less
- Reference issues and pull requests when relevant
- Explain WHAT and WHY, not HOW

---

## 🔀 Pull Request Process

### Before Submitting

1. **Update your branch**:
```bash
git checkout main
git pull upstream main
git checkout your-branch
git rebase main
```

2. **Run tests**:
```bash
npm test
```

3. **Check code style**:
```bash
npm run lint
```

4. **Build successfully**:
```bash
cd frontend
npm run build
```

### PR Title Format

Follow the same format as commit messages:

```
feat(auth): add two-factor authentication
fix(tasks): resolve task deletion bug
docs(readme): update installation instructions
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added and passing
- [ ] Dependent changes merged

## Related Issues
Closes #123
Related to #456
```

### Review Process

1. **Automated checks** must pass
2. **At least one approval** required
3. **All comments addressed**
4. **No merge conflicts**
5. **Documentation updated** if needed

### After Approval

- Maintainer will merge your PR
- Delete your branch after merge
- Update your fork:
```bash
git checkout main
git pull upstream main
git push origin main
```

---

## 🧪 Testing Requirements

### Required Tests

- **Unit tests** for new functions/methods
- **Integration tests** for new API endpoints
- **Component tests** for new React components
- **E2E tests** for new user flows (if applicable)

### Test Coverage

- Maintain **80%+ coverage** for new code
- All tests must pass before PR approval

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Coverage report
npm run test:coverage
```

### Writing Tests

```javascript
// Example unit test
describe('calculatePerformanceScore', () => {
  it('should calculate correct percentage', () => {
    const result = calculatePerformanceScore(8, 10);
    expect(result).toBe(80);
  });

  it('should handle zero total tasks', () => {
    const result = calculatePerformanceScore(0, 0);
    expect(result).toBe(0);
  });

  it('should round to two decimal places', () => {
    const result = calculatePerformanceScore(1, 3);
    expect(result).toBe(33.33);
  });
});
```

---

## 📚 Documentation

### When to Update Documentation

- Adding new features
- Changing existing functionality
- Fixing bugs that affect usage
- Updating dependencies
- Changing configuration

### Documentation Files

- **README.md**: Project overview
- **SETUP.md**: Installation instructions
- **API_DOCUMENTATION.md**: API reference
- **DEPLOYMENT_GUIDE.md**: Deployment instructions
- **TESTING_GUIDE.md**: Testing procedures
- **CONTRIBUTING.md**: This file

### Code Documentation

```javascript
/**
 * Calculate user performance score based on task completion
 * 
 * @param {number} completedTasks - Number of completed tasks
 * @param {number} totalTasks - Total number of assigned tasks
 * @returns {number} Performance score as percentage (0-100)
 * 
 * @example
 * calculatePerformanceScore(8, 10) // Returns 80
 */
function calculatePerformanceScore(completedTasks, totalTasks) {
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}
```

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check if bug already reported
2. Try to reproduce the bug
3. Gather relevant information

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 90]
- Node Version: [e.g., 16.14.0]
- App Version: [e.g., 1.0.0]

## Additional Context
Any other relevant information
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem it Solves
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other solutions you've thought about

## Additional Context
Any other relevant information
```

---

## 🎯 Development Tips

### Useful Commands

```bash
# Start development
npm run dev

# Run tests
npm test

# Check code style
npm run lint

# Build for production
npm run build

# Database operations
npm run seed        # Seed database
npm run migrate     # Run migrations
npm run migrate:undo # Undo last migration
```

### Debugging

```javascript
// Backend debugging
console.log('Debug:', variable);
console.error('Error:', error);

// Frontend debugging
console.log('Component rendered:', props);
console.table(arrayData);
```

### VS Code Extensions

Recommended extensions:
- ESLint
- Prettier
- GitLens
- Thunder Client (API testing)
- MySQL (database management)

---

## 📞 Getting Help

### Resources

- **Documentation**: Check all .md files in root directory
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions

### Contact

- Create an issue for bugs or features
- Use discussions for general questions
- Tag maintainers for urgent issues

---

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to the Employee Task Performance & Productivity Tracker!**

**Contributing Guide Version**: 1.0  
**Last Updated**: May 1, 2026
