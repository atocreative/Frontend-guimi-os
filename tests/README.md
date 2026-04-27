# Tests

This directory contains automated tests for the Guimicell OS frontend.

## Structure

- `unit/` — Jest unit tests for utilities and service layer
- `e2e/` — Playwright end-to-end tests for user flows
- Custom Node scripts (`.js` files) — Legacy smoke tests for manual integration checks

## Running Tests

### Unit Tests
```bash
npm run test:unit
npm run test:unit -- --watch
```

### E2E Tests
```bash
npm run test:e2e
npm run test:e2e -- --ui
```

### All Tests
```bash
npm run test
```

## Writing Tests

### Unit Tests
- Located in `tests/unit/`
- Use Jest and testing-library
- Mock external dependencies (repository layer)
- Focus on business logic, not UI implementation

### E2E Tests
- Located in `tests/e2e/`
- Use Playwright for browser automation
- Test real user flows (login, create task, navigate)
- Run against a local dev server

## Smoke Scripts

The legacy Node scripts (e.g., `test-auth.js`, `test-integration.js`) remain available for manual verification:

```bash
node tests/test-auth.js
node tests/test-integration.js
node tests/run-all-tests.js
```
