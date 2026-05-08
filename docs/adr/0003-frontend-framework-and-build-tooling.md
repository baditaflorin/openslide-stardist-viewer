# 0003. Frontend Framework and Build Tooling

## Status

Accepted

## Context

The UI needs a complex tiled viewer, typed API calls, error handling, and a static build suitable for GitHub Pages.

## Decision

Use Vite, React, TypeScript strict mode, Tailwind CSS, TanStack Query, OpenSeadragon, Zod, openapi-typescript, openapi-fetch, and lucide-react.

## Consequences

Builds are fast, the runtime remains static, and the UI can use a mature whole-slide tile viewer. The app must set Vite `base` to `/openslide-stardist-viewer/` and emit `docs/` for Pages.

## Alternatives Considered

Plain JavaScript was rejected because typed API contracts reduce integration errors. Next.js was rejected because static Pages publishing is simpler with Vite and no runtime rendering.
