from __future__ import annotations

from pathlib import Path

from app.slides.models import DomainWarning, SlideInferences


def infer_slide(
    *,
    filename: str,
    format_name: str,
    properties: dict[str, str],
    size_bytes: int,
    dimensions: tuple[int, int],
    level_count: int,
    mpp_x: float | None,
    mpp_y: float | None,
    objective_power: float | None,
) -> tuple[SlideInferences, list[DomainWarning]]:
    lower_name = filename.lower()
    vendor = _vendor(format_name, properties)
    modality = (
        "fluorescence"
        if "fluorescence" in lower_name or _properties_contain(properties, "fluorescence")
        else "brightfield"
    )
    stain = _stain_guess(lower_name, modality)
    huge = size_bytes >= 1_000_000_000 or max(dimensions) >= 100_000
    sparse = "philips" in vendor.lower() or "sparse" in lower_name
    sidecar_required = Path(filename).suffix.lower() == ".mrxs"
    warnings: list[DomainWarning] = []
    reasons: list[str] = [f"format={format_name}", f"vendor={vendor}"]
    confidence = 0.78

    if modality == "fluorescence":
        confidence = min(confidence, 0.35)
        warnings.append(
            DomainWarning(
                code="fluorescence_modality",
                severity="warning",
                message="Fluorescence slide detected; brightfield nuclei segmentation is not a trustworthy default.",
                next_step="Use segmentation only as a rough preview or provide a fluorescence-specific model.",
            )
        )
        reasons.append("filename/properties indicate fluorescence")
    if mpp_x is None or mpp_y is None:
        confidence -= 0.08
        warnings.append(
            DomainWarning(
                code="missing_mpp",
                severity="info",
                message="Microns-per-pixel metadata is missing.",
                next_step="Counts can still run, but size-aware thresholds may be less reliable.",
            )
        )
    if objective_power is None:
        warnings.append(
            DomainWarning(
                code="missing_objective",
                severity="info",
                message="Objective power metadata is missing.",
                next_step="Verify magnification before comparing counts across slides.",
            )
        )
    if huge:
        warnings.append(
            DomainWarning(
                code="huge_slide",
                severity="warning",
                message="Huge whole-slide image detected.",
                next_step="Expect metadata scan and first tile access to take longer; segment a small viewport.",
            )
        )
    if sparse:
        warnings.append(
            DomainWarning(
                code="sparse_slide_risk",
                severity="info",
                message="Sparse slide format or vendor detected.",
                next_step="Blank viewports may be storage gaps rather than processing failures.",
            )
        )

    confidence = max(0.05, min(0.98, confidence))
    segmentation_suitable = modality == "brightfield"
    return (
        SlideInferences(
            vendor=vendor,
            modality=modality,
            stain=stain,
            mpp_available=mpp_x is not None and mpp_y is not None,
            objective_available=objective_power is not None,
            sidecar_required=sidecar_required,
            sidecar_ok=True if sidecar_required else None,
            huge_slide=huge,
            sparse_risk=sparse,
            segmentation_suitable=segmentation_suitable,
            confidence=round(confidence, 3),
            reasons=reasons,
        ),
        warnings,
    )


def _vendor(format_name: str, properties: dict[str, str]) -> str:
    for key in ("openslide.vendor", "aperio.AppMag", "hamamatsu.SourceLens"):
        if key in properties and key == "openslide.vendor":
            return properties[key]
    if format_name:
        return format_name
    return "unknown"


def _properties_contain(properties: dict[str, str], needle: str) -> bool:
    needle = needle.lower()
    return any(needle in key.lower() or needle in value.lower() for key, value in properties.items())


def _stain_guess(filename: str, modality: str) -> str | None:
    if modality == "fluorescence":
        return "fluorescence"
    if "h&e" in filename or "he" in filename or "hematoxylin" in filename:
        return "H&E"
    return None
