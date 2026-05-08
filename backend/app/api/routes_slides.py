from __future__ import annotations

import re
from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.api.dependencies import get_segmentation_service, get_slide_store
from app.core.errors import BadRequestError, NotFoundError
from app.metrics.instrumentation import TILE_REQUESTS
from app.segmentation.models import SegmentRequest, SegmentResponse
from app.segmentation.service import SegmentationService
from app.slides.models import SlideListResponse, SlideMetadata
from app.slides.store import SlideStore

router = APIRouter(prefix="/api", tags=["slides"])
TILE_NAME_RE = re.compile(r"^(?P<column>\d+)_(?P<row>\d+)\.jpeg$")
SlideStoreDep = Annotated[SlideStore, Depends(get_slide_store)]
SegmentationServiceDep = Annotated[SegmentationService, Depends(get_segmentation_service)]


@router.get("/slides", response_model=SlideListResponse)
async def list_slides(store: SlideStoreDep) -> SlideListResponse:
    store.scan()
    return SlideListResponse(slides=store.list_slides())


@router.get("/slides/{slide_id}/dzi")
async def get_dzi(slide_id: str, store: SlideStoreDep) -> Response:
    metadata = store.get_metadata(slide_id)
    xml = (
        f'<Image TileSize="{metadata.tile_size}" Overlap="0" Format="jpeg" '
        'xmlns="http://schemas.microsoft.com/deepzoom/2008">'
        f'<Size Width="{metadata.dimensions.width}" Height="{metadata.dimensions.height}"/>'
        "</Image>"
    )
    return Response(content=xml, media_type="application/xml")


@router.get("/slides/{slide_id}_files/{level}/{tile_name}")
async def get_tile(
    slide_id: str,
    level: int,
    tile_name: str,
    store: SlideStoreDep,
) -> Response:
    match = TILE_NAME_RE.match(tile_name)
    if not match:
        raise BadRequestError("Invalid Deep Zoom tile name.")
    column = int(match.group("column"))
    row = int(match.group("row"))
    reader = store.get_reader(slide_id)
    image = reader.get_deepzoom_tile(level=level, column=column, row=row)
    TILE_REQUESTS.labels(slide_id=slide_id).inc()
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=88, optimize=True)
    return Response(content=buffer.getvalue(), media_type="image/jpeg")


@router.get("/slides/{slide_id}/thumbnail")
async def get_thumbnail(slide_id: str, store: SlideStoreDep, size: int = 900) -> Response:
    reader = store.get_reader(slide_id)
    image = reader.get_thumbnail(size)
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=86, optimize=True)
    return Response(content=buffer.getvalue(), media_type="image/jpeg")


@router.post("/slides/{slide_id}/segment", response_model=SegmentResponse)
async def segment_slide_region(
    slide_id: str,
    request: SegmentRequest,
    store: SlideStoreDep,
    segmenter: SegmentationServiceDep,
) -> SegmentResponse:
    if slide_id not in store.records:
        raise NotFoundError("Slide not found.")
    reader = store.get_reader(slide_id)
    return segmenter.segment(reader=reader, request=request)


@router.get("/slides/{slide_id}", response_model=SlideMetadata)
async def get_slide(slide_id: str, store: SlideStoreDep) -> SlideMetadata:
    return store.get_metadata(slide_id)
