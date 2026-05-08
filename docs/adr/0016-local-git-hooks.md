# 0016. Local Git Hooks

## Status

Accepted

## Context

The project does not use GitHub Actions. Local hooks provide the safety net.

## Decision

Use a tracked `.githooks/` directory and `make install-hooks` to set `core.hooksPath`. Hooks enforce formatting, linting, typechecking, gitleaks staged scanning, Conventional Commits, unit tests, build, and smoke tests.

## Consequences

Checks run before commits and pushes on machines that install the hooks. Documentation makes setup explicit.

## Alternatives Considered

Lefthook was considered, but plain shell hooks avoid another bootstrap dependency.
