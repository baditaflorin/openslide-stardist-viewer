# 0005. Client-Side Storage Strategy

## Status

Accepted

## Context

Users need to remember the backend URL and lightweight viewer preferences. Slide data and segmentation outputs can be large and sensitive.

## Decision

Use `localStorage` for non-sensitive preferences: backend URL, selected slide ID, and viewer options. Do not persist slide pixels or segmentation payloads in browser storage in v1.

## Consequences

The frontend has useful local continuity without storing sensitive pathology data. Cross-device sync is out of scope.

## Alternatives Considered

IndexedDB and OPFS were considered for offline result caching but rejected for v1 because Mode C depends on a backend and privacy expectations are simpler with no pixel/result persistence.
