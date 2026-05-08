# 0006. WASM Modules

## Status

Accepted

## Context

The architecture bias prefers WASM when computation can reasonably run in the browser.

## Decision

Use no WASM modules in v1. OpenSlide decoding, HistomicsTK preprocessing, and StarDist inference run in the backend Docker service.

## Consequences

The GitHub Pages frontend does not need COOP/COEP headers, a service worker isolation shim, or large WASM payloads. Heavy compute remains close to local slide files.

## Alternatives Considered

OpenSlide/OpenCV/TensorFlow WASM were considered but rejected because reliable WSI codec support and model inference would exceed the v1 payload, compatibility, and performance budget.
