# 0014. Error Handling Conventions

## Status

Accepted

## Context

Slide files can be missing, corrupt, unsupported, or too large for requested operations. Segmentation dependencies may be unavailable.

## Decision

Backend errors use typed exceptions mapped to JSON API errors. Validation errors return HTTP 422. Missing slides return 404. Oversized segmentation regions return 413. The frontend shows recoverable errors in a global toast and keeps the viewer usable.

## Consequences

Users get actionable failures. Backend logs retain context without leaking slide data into public pages.

## Alternatives Considered

Returning raw exception text was rejected because it is noisy and can disclose local paths.
