# 0069. Type-Safety Policy at Boundaries

## Status

Accepted

## Context

Generated OpenAPI types and browser APIs expose unknown data. Phase 3 import/export adds another external boundary.

## Decision

Validate external JSON with Zod schemas. Avoid `any` in handwritten source. Keep generated OpenAPI `unknown` and test-environment casts as documented boundaries only. Replace handwritten unsafe casts where practical.

## Consequences

Bad API payloads, imported state files, and clipboard/share data fail closed with clear messages.

## Alternatives Considered

Trusting generated client types without runtime validation was rejected because the app already uses Zod to guard API responses.
