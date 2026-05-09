from __future__ import annotations

from pydantic import BaseModel, Field


class SegmentRequest(BaseModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)
    width: int = Field(gt=0, le=4096)
    height: int = Field(gt=0, le=4096)
    max_nuclei: int = Field(default=2500, gt=0, le=10000)


class Region(BaseModel):
    x: int
    y: int
    width: int
    height: int


class Nucleus(BaseModel):
    id: int
    centroid: tuple[float, float]
    area: float
    bbox: tuple[float, float, float, float]
    confidence: float | None = None
    polygon: list[tuple[float, float]]


class Confidence(BaseModel):
    score: float = Field(ge=0, le=1)
    label: str
    reasons: list[str] = Field(default_factory=list)


class SegmentWarning(BaseModel):
    code: str
    severity: str
    message: str
    next_step: str | None = None


class TissueSummary(BaseModel):
    coverage: float = Field(ge=0, le=1)
    mean_luminance: float = Field(ge=0, le=255)
    is_blank: bool


class SegmentProvenance(BaseModel):
    app_version: str
    schema_version: str
    slide_id: str
    region: Region
    parameters: dict[str, int | str | float]


class SegmentResponse(BaseModel):
    slide_id: str
    method: str
    region: Region
    count: int
    elapsed_ms: float
    nuclei: list[Nucleus]
    confidence: Confidence
    warnings: list[SegmentWarning] = Field(default_factory=list)
    tissue: TissueSummary
    provenance: SegmentProvenance
