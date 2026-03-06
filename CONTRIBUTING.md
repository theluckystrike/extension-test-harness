# Contributing to extension-test-harness

Thank you for your interest in contributing. This document outlines the process for contributing to this project.

## Reporting Issues

Before reporting a new issue, please check if the issue has already been reported. When creating an issue, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior versus actual behavior
- Your environment details (Node.js version, OS)
- Any relevant code samples or stack traces

Use the issue templates provided in `.github/ISSUE_TEMPLATE/` when available.

## Development Workflow

1. Fork the repository
2. Clone your fork: `git clone https://github.com/theluckystrike/extension-test-harness.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes and commit them with clear messages
5. Run tests to ensure nothing is broken
6. Push to your fork and submit a pull request

## Code Style

This project follows these guidelines:

- Use TypeScript for all source code
- Run `npm run build` before committing to verify TypeScript compiles without errors
- Keep functions focused and small
- Add JSDoc comments for public APIs
- Use meaningful variable and function names
- Format code with consistent indentation (spaces, not tabs)

## Testing

Before submitting changes, verify the build works:

```bash
npm run build
```

Ensure there are no TypeScript errors or warnings in the output.

## License

By contributing to extension-test-harness, you agree that your contributions will be licensed under the MIT License.
