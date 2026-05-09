from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import Response

from app.metrics.instrumentation import metrics_payload

router = APIRouter(tags=["health"])


@router.get("/healthz", name="healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/readyz")
async def readyz(request: Request) -> dict[str, str | int]:
    store = request.app.state.slide_store
    return {"status": "ready", "slides": len(store.records), "problems": len(store.problems)}


@router.get("/metrics", include_in_schema=False)
async def metrics() -> Response:
    payload, content_type = metrics_payload()
    return Response(content=payload, media_type=content_type)
