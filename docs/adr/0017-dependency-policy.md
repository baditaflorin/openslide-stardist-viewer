# 0017. Dependency Policy

## Status

Accepted

## Context

The domain has mature libraries for slide tiling, inference, HTTP APIs, and frontend state.

## Decision

Use production-ready libraries instead of custom foundations: OpenSlide, HistomicsTK, StarDist, FastAPI, Prometheus client, OpenSeadragon, TanStack Query, Zod, Tailwind CSS, Vitest, Pytest, and Playwright. Custom code is limited to application orchestration and small adapters.

## Consequences

The project benefits from battle-tested tools and has clearer upgrade responsibilities. Optional ML dependencies are isolated so smoke tests can run without downloading pretrained models.

## Alternatives Considered

Hand-rolled tiling, segmentation, or API clients were rejected.
