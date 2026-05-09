# 0066. Error-Handling Convention

## Status

Accepted

## Context

Backend domain errors are already specific, but new import/export errors could easily regress to generic exceptions.

## Decision

Frontend errors shown to users follow "what failed, why, now what" in one or two sentences. Boundary parsing uses Zod and converts failures to toasts. API error narrowing uses type guards rather than unsafe casts.

## Consequences

Bad state files and invalid backend URLs are recoverable and understandable.

## Alternatives Considered

Throwing raw Zod errors was rejected because it exposes implementation details.
