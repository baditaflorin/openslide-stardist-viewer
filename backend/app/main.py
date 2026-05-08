from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_health, routes_slides
from app.core.config import Settings
from app.core.errors import AppError, app_error_handler, validation_error_handler
from app.core.logging import configure_logging
from app.metrics.instrumentation import install_metrics_middleware
from app.segmentation.service import SegmentationService
from app.slides.store import SlideStore


def create_app(settings: Settings | None = None) -> FastAPI:
    active_settings = settings or Settings()
    configure_logging(active_settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.settings = active_settings
        app.state.slide_store = SlideStore(active_settings)
        app.state.segmentation_service = SegmentationService(active_settings)
        app.state.slide_store.scan()
        yield
        app.state.slide_store.close()

    app = FastAPI(
        title="OpenSlide StarDist Viewer API",
        description="Tile streaming, nuclei segmentation, and cell counting for local pathology slides.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.allowed_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )
    install_metrics_middleware(app)
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.include_router(routes_health.router)
    app.include_router(routes_slides.router)

    @app.get("/", include_in_schema=False)
    async def root(request: Request) -> dict[str, str]:
        return {
            "name": "openslide-stardist-viewer",
            "docs": str(request.url_for("swagger_ui_html")),
            "health": str(request.url_for("healthz")),
        }

    return app


app = create_app()
