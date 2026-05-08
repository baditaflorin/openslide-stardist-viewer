# 0002. Architecture Overview and Module Boundaries

## Status

Accepted

## Context

The application needs a static viewer UI, a backend that can read local WSI files, a tile service, and an inference path for nuclei segmentation.

## Decision

Use these boundaries:

- `src/`: static React frontend, OpenSeadragon viewer, API client, slide state, segmentation overlay.
- `backend/app/`: FastAPI backend with configuration, slide registry, Deep Zoom tile service, segmentation service, API routes, and metrics.
- `api/openapi.yaml`: public REST contract used by the frontend type generator.
- `deploy/`: production Docker Compose and nginx assets.
- `docs/`: GitHub Pages output plus project documentation and ADRs.

## Consequences

Frontend and backend can evolve independently. The frontend never reads slide files directly and never stores secrets. The backend owns all access to local slide data.

## Alternatives Considered

A monolithic server-rendered app was rejected because the frontend must be served by GitHub Pages. A fully client-side viewer was rejected in ADR 0001.
