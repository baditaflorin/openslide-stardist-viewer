from __future__ import annotations

from fastapi import Request

from app.segmentation.service import SegmentationService
from app.slides.store import SlideStore


def get_slide_store(request: Request) -> SlideStore:
    return request.app.state.slide_store


def get_segmentation_service(request: Request) -> SegmentationService:
    return request.app.state.segmentation_service

