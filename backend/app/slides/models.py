from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class Dimensions(BaseModel):
    width: int = Field(ge=1)
    height: int = Field(ge=1)


class DomainWarning(BaseModel):
    code: str
    severity: Literal["info", "warning", "critical"]
    message: str
    next_step: str | None = None


class SlideInferences(BaseModel):
    vendor: str
    modality: Literal["brightfield", "fluorescence", "unknown"]
    stain: str | None = None
    mpp_available: bool
    objective_available: bool
    sidecar_required: bool = False
    sidecar_ok: bool | None = None
    huge_slide: bool = False
    sparse_risk: bool = False
    segmentation_suitable: bool = True
    confidence: float = Field(ge=0, le=1)
    reasons: list[str] = Field(default_factory=list)


class SlideMetadata(BaseModel):
    id: str
    name: str
    filename: str
    relative_path: str
    format: str
    fingerprint: str
    size_bytes: int
    dimensions: Dimensions
    level_count: int
    level_dimensions: list[Dimensions]
    tile_size: int
    mpp_x: float | None = None
    mpp_y: float | None = None
    objective_power: float | None = None
    properties: dict[str, str] = Field(default_factory=dict)
    inferences: SlideInferences
    warnings: list[DomainWarning] = Field(default_factory=list)


class SlideProblem(BaseModel):
    id: str
    filename: str
    relative_path: str
    extension: str
    size_bytes: int
    category: Literal[
        "empty",
        "archive",
        "dicom_package",
        "unsupported_extension",
        "missing_sidecar",
        "corrupt_or_partial",
        "open_failed",
    ]
    severity: Literal["info", "warning", "critical"]
    message: str
    next_step: str


class ScanSummary(BaseModel):
    total_files: int
    usable_slides: int
    problem_files: int
    ignored_sidecars: int
    duration_ms: float
    warnings: list[DomainWarning] = Field(default_factory=list)


class SlideListResponse(BaseModel):
    slides: list[SlideMetadata]
    problems: list[SlideProblem] = Field(default_factory=list)
    summary: ScanSummary
