# 0061. Input Pathway Coverage Policy

## Status

Accepted

## Context

The app runs a static GitHub Pages frontend with a Docker/FastAPI backend for private WSI access. Browser-only WSI upload would require a different OpenSlide-in-browser architecture and would bypass the current private slide-directory boundary.

## Decision

Treat the backend slide directory as the only supported WSI input pathway. Complete state import and deep-link restore in the frontend, and document browser slide upload, drag/drop slide upload, remote slide URL ingestion, and clipboard slide paste as out of scope.

## Consequences

Real WSI data stays on the backend host. The UI can still become more usable through state import/export and clearer copy without pretending Pages can open SVS/NDPI files directly.

## Alternatives Considered

Adding browser file upload for slide pixels was rejected because OpenSlide C and Deep Zoom tile streaming remain server responsibilities in Mode C.
