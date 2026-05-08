# 0010. GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live GitHub Pages URL is a first-class deliverable. No GitHub Actions are used, so the built frontend must be committed.

## Decision

Publish from the `main` branch `/docs` folder. Vite builds directly into `docs/` with base path `/openslide-stardist-viewer/`. `docs/404.html` mirrors `docs/index.html` for SPA refresh fallback. The `.gitignore` explicitly keeps `docs/` tracked even though generic `dist/` and build outputs are ignored.

## Consequences

Every publish is a normal commit. Rollback is a git revert. Cache busting relies on hashed Vite assets. Custom domains can be added later with a tracked `docs/CNAME`.

## Alternatives Considered

A `gh-pages` branch was rejected to keep local-only publishing simple and visible. GitHub Actions Pages deployment was rejected because the project explicitly avoids GitHub Actions.
