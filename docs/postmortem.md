# Postmortem

## What Was Built

v0.1.0 implements a GitHub Pages React viewer and a Docker-ready FastAPI backend. The frontend lists slides, streams Deep Zoom-compatible tiles through OpenSeadragon, overlays nuclei detections, shows version and commit, links to https://github.com/baditaflorin/openslide-stardist-viewer, and links to https://www.paypal.com/paypalme/florinbadita.

The backend scans local slide directories, reads OpenSlide-compatible files when OpenSlide is installed, falls back to Pillow for small images and smoke tests, exposes health/readiness/metrics, and segments selected regions with StarDist first, HistomicsTK when available, and a deterministic fallback when the ML stack is absent.

## Was Mode C Correct?

Yes. In hindsight, Mode C is still the right choice. Mode A would make tile decoding and StarDist inference fragile and oversized in the browser. Mode B would only work for precomputed public data, but the product value is analyzing arbitrary local slides at runtime.

## What Worked

- GitHub Pages was enabled from the first commit.
- The public frontend remains static and contains no secrets.
- OpenSeadragon gives a mature tile-viewing surface.
- The fallback segmentation path keeps tests and smoke runs practical without downloading ML models.

## What Did Not Work

- The generic Go-backend instruction conflicted with the Python-native pathology stack. ADR 0001 and ADR 0008 document the Python backend decision.
- Vite initially cleared `docs/`, which would have removed ADRs. The build now cleans only app assets.
- The local system Python lacked working `ensurepip`, so the bundled Python runtime was used to create `.venv`.

## What Surprised Us

OpenSlide and StarDist are the easy architecture call but the expensive packaging call. Keeping a core dependency set separate from the ML dependency set made local checks much faster.

## Accepted Tech Debt

- The Docker runtime uses `python:slim` instead of distroless because the backend is Python and needs native image libraries.
- HistomicsTK and StarDist are optional at local smoke-test time.
- The fallback segmentation is not a clinical algorithm; it exists to make development and smoke tests deterministic.
- Result export storage is reserved but not exposed in the UI.

## Next Improvements

1. Add result export as GeoJSON/CSV and persist it under `data/results`.
2. Add ROI drawing instead of segmenting only the current viewport.
3. Add model warmup and tiled segmentation for larger regions.

## Time Spent Vs Estimate

Estimated v1 scaffold: 4 to 6 hours.

Actual implementation pass: about 2 hours of focused scaffolding in this environment, excluding future Docker image build time for the full ML stack.
