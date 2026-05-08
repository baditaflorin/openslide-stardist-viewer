# 0015. Deployment Topology

## Status

Accepted

## Context

The frontend is static on GitHub Pages. The backend runs where slide files and compute are available.

## Decision

Deploy the frontend at `https://baditaflorin.github.io/openslide-stardist-viewer/`. Deploy the backend through Docker Compose with an `app` service, profile-gated Prometheus, and nginx. nginx exposes host port `25342`, terminates TLS, proxies to `app:8080`, blocks public `/metrics`, and allows CORS from the Pages origin.

## Consequences

Users can run the backend locally or on a controlled server while sharing one static public viewer.

## Alternatives Considered

Serving the frontend from the backend was rejected because GitHub Pages is required for the UI.
