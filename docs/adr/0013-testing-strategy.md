# 0013. Testing Strategy

## Status

Accepted

## Context

The app has typed frontend logic, API integration, and image processing code. Checks must run locally through Make and hooks.

## Decision

Use Vitest for frontend unit tests, Pytest for backend unit/API tests, and Playwright for one happy-path smoke/e2e test. `make test` runs unit tests. `make smoke` builds, serves `docs/`, starts the backend with a generated demo slide, and verifies a happy path.

## Consequences

The test suite is fast enough for pre-push and covers the most important integration risks.

## Alternatives Considered

Large real WSI fixtures were rejected because they are too heavy for the repository.
