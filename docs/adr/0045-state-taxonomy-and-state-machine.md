# 0045. State Taxonomy and State Machine

## Status

Accepted

## Context

The UI has backend offline, no slides, skipped files, loading slides, segmenting, error, and successful result states.

## Decision

Document states in `docs/phase2-substance/states.md` and make every state actionable. Segmenting disables concurrent runs and exposes cancellation. Prior results remain visible until a new result succeeds.

## Consequences

State handling is explicit and testable. This is behavior work, not visual polish.

## Alternatives Considered

Clearing state eagerly was rejected because it creates half-loaded and stuck states.
