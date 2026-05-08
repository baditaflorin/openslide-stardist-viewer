# 0011. Logging Strategy

## Status

Accepted

## Context

The backend needs useful operational logs. The static frontend should not spam production consoles.

## Decision

Backend logs are structured JSON to stdout with request identifiers when available. Frontend production builds avoid debug logging and surface user-facing errors through the UI.

## Consequences

Docker and nginx can collect backend logs without extra agents. Browser users see clear errors without noisy developer output.

## Alternatives Considered

File logs were rejected because containers should write logs to stdout/stderr.
