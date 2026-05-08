# 0009. Configuration and Secrets Management

## Status

Accepted

## Context

The frontend is public and static. The backend is local/server-side and should not require secrets for v1.

## Decision

Use environment variables documented in `.env.example`. The frontend only receives public build-time values. Backend runtime configuration uses `SLIDE_VIEWER_*` variables. Do not commit `.env`, credentials, slide data, private keys, or host-specific secrets.

## Consequences

The same static frontend can point at different backend URLs. Secret scanning is enforced by local hooks with gitleaks.

## Alternatives Considered

Runtime config files were rejected because environment variables work cleanly with Docker Compose.
