# 0001. Deployment Mode

## Status

Accepted

## Context

The viewer must stream whole-slide images, read OpenSlide-supported formats, run HistomicsTK preprocessing, execute StarDist inference, and return nuclei overlays and cell counts. The default preference is GitHub Pages first, with a runtime backend only when static or browser-only approaches are insufficient.

## Decision

Use Mode C: GitHub Pages frontend plus Docker backend.

The frontend is a static Vite/React application published from `main` `/docs` at `https://baditaflorin.github.io/openslide-stardist-viewer/`. The backend is a local/server Docker service exposing REST, Deep Zoom tiles, segmentation, health, readiness, and metrics.

The backend is Python, not Go, because the required scientific runtime is Python-native: `openslide-python`, HistomicsTK, StarDist, TensorFlow, NumPy, Pillow, and image-processing libraries. A Go wrapper would add operational complexity without reducing the need for a Python runtime.

## Consequences

The public surface remains static except for the user-configured backend URL. Sensitive slide data stays local to the backend host. Docker is required for the full v1 experience. GitHub Pages cannot set custom response headers for WASM isolation, but the app does not rely on browser WASM for v1.

## Alternatives Considered

Mode A was rejected because OpenSlide codecs and StarDist inference are not practical as a pure browser-only v1. Mode B was rejected because arbitrary local slide analysis is runtime work, not a fixed prebuilt dataset.
