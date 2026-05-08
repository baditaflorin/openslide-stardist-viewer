from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SLIDE_VIEWER_", env_file=".env", extra="ignore")

    host: str = "0.0.0.0"
    port: int = 8080
    public_base_url: str = "http://localhost:25342"
    slide_dir: Path = Path("/data/slides")
    result_dir: Path = Path("/data/results")
    allowed_origins: str = (
        "http://localhost:5173,http://localhost:4173,"
        "https://baditaflorin.github.io,https://baditaflorin.github.io/openslide-stardist-viewer"
    )
    tile_size: int = Field(default=512, ge=128, le=2048)
    max_region_pixels: int = Field(default=4_194_304, ge=65_536)
    segmentation_backend: str = "auto"
    log_level: str = "INFO"

    @property
    def allowed_origin_list(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.allowed_origins.split(",") if origin.strip()]

