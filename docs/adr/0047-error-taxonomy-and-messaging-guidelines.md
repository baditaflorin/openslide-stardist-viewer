# 0047. Error Taxonomy and Messaging Guidelines

## Status

Accepted

## Context

Errors need to distinguish recoverable user-input problems from fatal backend failures.

## Decision

Use recoverable scan problems for per-file issues, request validation errors for invalid API inputs, region errors for too-large work, and fatal errors only when the backend cannot continue. Every user-visible message includes what failed, why, and the next step.

## Consequences

The scan report becomes the primary recovery surface for data problems.

## Alternatives Considered

HTTP-only errors were rejected because many slide-folder problems are not tied to one request.
