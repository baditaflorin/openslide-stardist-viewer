# Architecture

Live frontend: https://baditaflorin.github.io/openslide-stardist-viewer/

Repository: https://github.com/baditaflorin/openslide-stardist-viewer

## Context

```mermaid
C4Context
  title System Context
  Person(researcher, "Pathology researcher", "Works with local whole-slide images")
  System(viewer, "OpenSlide StarDist Viewer", "Streams local WSI tiles and counts segmented nuclei")
  System_Ext(githubPages, "GitHub Pages", "Hosts the static viewer")
  System_Ext(dockerHost, "Docker backend host", "Runs OpenSlide, HistomicsTK, StarDist, and Prometheus metrics")
  Rel(researcher, githubPages, "Loads viewer", "HTTPS")
  Rel(githubPages, dockerHost, "Calls configured backend URL", "REST")
  Rel(dockerHost, viewer, "Provides tiles and segmentation results")
```

## Containers

```mermaid
C4Container
  title Container Diagram
  Boundary(pages, "GitHub Pages boundary") {
    Container(frontend, "Static frontend", "React, TypeScript, Vite, OpenSeadragon", "Slide list, tile viewer, overlays, browser exports, build version and commit")
  }
  Boundary(privateHost, "Private Docker host boundary") {
    Container(nginx, "nginx", "TLS reverse proxy", "CORS, rate limits, security headers, blocks public metrics")
    Container(api, "Backend API", "FastAPI, OpenSlide C, HistomicsTK, StarDist", "Slide scan, Deep Zoom tiles, thumbnails, segmentation, cell counts")
    Container(prom, "Prometheus", "Profile-gated", "Scrapes backend metrics")
    ContainerDb(slides, "Slide volume", "Filesystem", "SVS, TIFF, NDPI, PNG, JPEG")
  }
  Rel(frontend, nginx, "GET/POST", "HTTPS JSON and JPEG")
  Rel(nginx, api, "Proxy", "HTTP :8080")
  Rel(api, slides, "Reads", "filesystem")
  Rel(prom, api, "Scrapes", "HTTP /metrics")
```

## Module Boundaries

- `src/`: static viewer UI and typed API client.
- `backend/app/api/`: FastAPI routes.
- `backend/app/slides/`: slide discovery, OpenSlide/Pillow readers, Deep Zoom tile geometry.
- `backend/app/segmentation/`: StarDist, HistomicsTK, and fallback segmentation.
- `backend/app/metrics/`: Prometheus counters and histograms.
- `deploy/`: production Compose, nginx, Prometheus, and dashboard assets.
- `docs/`: GitHub Pages build output plus durable documentation.

## Data Flow

```mermaid
sequenceDiagram
  participant User
  participant Pages as GitHub Pages frontend
  participant API as Docker backend API
  participant SlideDir as Local slide directory
  User->>Pages: Open viewer
  Pages->>API: GET /healthz
  Pages->>API: GET /api/slides
  API->>SlideDir: Scan supported slide files
  API-->>Pages: Slide metadata
  Pages->>API: GET Deep Zoom tile JPEGs
  API->>SlideDir: Read OpenSlide region
  API-->>Pages: JPEG tiles
  User->>Pages: Segment viewport
  Pages->>API: POST /api/slides/{id}/segment
  API->>SlideDir: Read selected region
  API-->>Pages: Nuclei count and overlays
  User->>Pages: Export JSON/CSV/session or copy summary/curl
```
