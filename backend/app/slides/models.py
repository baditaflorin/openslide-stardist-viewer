from __future__ import annotations

from pydantic import BaseModel, Field


class Dimensions(BaseModel):
    width: int = Field(ge=1)
    height: int = Field(ge=1)


class SlideMetadata(BaseModel):
    id: str
    name: str
    filename: str
    format: str
    dimensions: Dimensions
    level_count: int
    level_dimensions: list[Dimensions]
    tile_size: int
    mpp_x: float | None = None
    mpp_y: float | None = None
    objective_power: float | None = None
    properties: dict[str, str] = Field(default_factory=dict)


class SlideListResponse(BaseModel):
    slides: list[SlideMetadata]

