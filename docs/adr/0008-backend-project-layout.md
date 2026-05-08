# 0008. Backend Project Layout

## Status

Accepted

## Context

The bootstrap template recommends Go for Mode C backends. This project specifically requires OpenSlide, HistomicsTK, and StarDist, which are Python-native in production use.

## Decision

Use a Python FastAPI backend under `backend/app/`:

- `api/`: route modules
- `core/`: configuration, logging, errors
- `slides/`: slide registry, OpenSlide/Pillow readers, Deep Zoom tiles
- `segmentation/`: StarDist/HistomicsTK integration and fallback segmentation
- `metrics/`: Prometheus instrumentation

## Consequences

The runtime directly uses the libraries pathology teams already expect. The Docker image includes system OpenSlide libraries and optional ML dependencies.

## Alternatives Considered

A Go gateway plus Python worker was rejected because it creates two runtimes and extra IPC without removing the Python dependency.
