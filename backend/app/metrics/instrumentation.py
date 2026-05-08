from __future__ import annotations

import time
from collections.abc import Callable

from fastapi import FastAPI, Request, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

HTTP_REQUESTS = Counter("http_requests_total", "HTTP requests", ["method", "path", "status"])
HTTP_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency", ["method", "path"])
SLIDE_SCANS = Counter("slide_scans_total", "Slide directory scans")
TILE_REQUESTS = Counter("slide_tile_requests_total", "Deep Zoom tile requests", ["slide_id"])
SEGMENTATION_REQUESTS = Counter("segmentation_requests_total", "Segmentation requests", ["method"])
SEGMENTATION_LATENCY = Histogram("segmentation_duration_seconds", "Segmentation latency", ["method"])
NUCLEI_COUNT = Histogram(
    "segmentation_nuclei_count",
    "Nuclei count per segmentation request",
    ["method"],
    buckets=(0, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000),
)


def install_metrics_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        route = request.scope.get("route")
        path = getattr(route, "path", request.url.path)
        elapsed = time.perf_counter() - start
        HTTP_REQUESTS.labels(method=request.method, path=path, status=str(response.status_code)).inc()
        HTTP_LATENCY.labels(method=request.method, path=path).observe(elapsed)
        return response


def metrics_payload() -> tuple[bytes, str]:
    return generate_latest(), CONTENT_TYPE_LATEST

