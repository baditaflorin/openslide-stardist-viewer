# 0067. State-Management Convention

## Status

Accepted

## Context

The current frontend has local React state plus ad hoc localStorage reads. Phase 3 needs session import/export without introducing server state.

## Decision

Keep React local state in `SlideWorkbench`, persist only non-sensitive preferences in `localStorage`, and serialize portable session state through a versioned JSON schema. Segmentation results are exportable but not auto-persisted in localStorage.

## Consequences

Reloads restore settings and selected slide, while slide pixels and large result payloads stay out of browser storage.

## Alternatives Considered

Persisting full segmentation payloads automatically was rejected to avoid surprise storage of potentially sensitive derived data.
