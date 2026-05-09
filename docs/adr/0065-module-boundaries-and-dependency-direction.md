# 0065. Module Boundaries and Dependency Direction

## Status

Accepted

## Context

Phase 3 adds more feature logic to the frontend. The codebase needs clear boundaries without a broad rewrite.

## Decision

Keep dependency direction as UI component -> feature helpers -> schemas/types -> API client. Helpers must not import React components. The generated OpenAPI client stays in `src/api/`; slide-specific validation stays in `src/features/slides/`.

## Consequences

The workbench remains the orchestration point, while deterministic logic can be tested independently.

## Alternatives Considered

Splitting into a full application/domain/primitives directory hierarchy was rejected as too heavy for the current frontend size.
