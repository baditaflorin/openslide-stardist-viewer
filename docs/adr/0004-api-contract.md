# 0004. API Contract

## Status

Accepted

## Context

Mode C needs an explicit frontend-to-backend contract. The frontend runs on GitHub Pages and the backend may be local or hosted.

## Decision

Define the REST/JSON contract in `api/openapi.yaml`. Generate TypeScript types with `openapi-typescript`. Use `openapi-fetch` rather than handwritten fetch wrappers for typed paths.

Core endpoints:

- `GET /healthz`
- `GET /readyz`
- `GET /metrics`
- `GET /api/slides`
- `GET /api/slides/{slide_id}`
- `GET /api/slides/{slide_id}/dzi`
- `GET /api/slides/{slide_id}_files/{level}/{column}_{row}.jpeg`
- `GET /api/slides/{slide_id}/thumbnail`
- `POST /api/slides/{slide_id}/segment`

## Consequences

The frontend and backend share one stable contract. Breaking API changes require an OpenAPI update and regenerated frontend types.

## Alternatives Considered

GraphQL was rejected as unnecessary for the small set of resource-oriented operations.
