from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.core.config import Settings
from app.segmentation.models import SegmentRequest
from app.segmentation.service import SegmentationService
from app.slides.store import SlideStore

ROOT = Path(__file__).resolve().parents[2]
FIXTURE_DIR = ROOT / "test" / "fixtures" / "realdata"
SLIDE_DIR = FIXTURE_DIR / "slides"


def _settings() -> Settings:
    return Settings(
        slide_dir=SLIDE_DIR,
        result_dir=ROOT / "tmp" / "realdata-results",
        segmentation_backend="fallback",
        tile_size=512,
    )


def _normalized_segment(payload: dict[str, Any]) -> dict[str, Any]:
    clone = json.loads(json.dumps(payload, sort_keys=True))
    clone.pop("elapsed_ms", None)
    return clone


def test_realdata_scan_report_is_honest_and_domain_aware() -> None:
    expected = json.loads((FIXTURE_DIR / "expected-scan.json").read_text(encoding="utf-8"))
    store = SlideStore(_settings())
    store.scan()

    filenames = {slide.filename for slide in store.list_slides()}
    problem_filenames = {problem.filename for problem in store.problems}
    problem_categories = {problem.category for problem in store.problems}

    assert len(store.records) >= expected["min_usable_slides"]
    assert set(expected["required_slide_filenames"]).issubset(filenames)
    assert set(expected["required_problem_filenames"]).issubset(problem_filenames)
    assert set(expected["required_problem_categories"]).issubset(problem_categories)
    assert store.summary.problem_files == len(store.problems)
    assert store.summary.usable_slides == len(store.records)
    assert all(not problem.relative_path.startswith("/") for problem in store.problems)

    by_filename = {slide.filename: slide for slide in store.list_slides()}
    for filename, modality in expected["required_modalities"].items():
        assert by_filename[filename].inferences.modality == modality
        assert any(warning.code == "fluorescence_modality" for warning in by_filename[filename].warnings)

    store.close()


def test_fluorescence_segmentation_is_low_confidence_not_wrong_confident() -> None:
    store = SlideStore(_settings())
    store.scan()
    leica = next(slide for slide in store.list_slides() if slide.filename == "Leica-Fluorescence-1.scn")
    result = SegmentationService(_settings()).segment(
        store.get_reader(leica.id),
        SegmentRequest(x=0, y=0, width=512, height=512, max_nuclei=200),
    )

    assert result.confidence.label == "low"
    assert result.confidence.score <= 0.2
    assert any(warning.code == "fluorescence_not_brightfield" for warning in result.warnings)
    store.close()


def test_realdata_segmentation_is_deterministic_for_same_region() -> None:
    store = SlideStore(_settings())
    store.scan()
    slide = next(slide for slide in store.list_slides() if slide.filename == "CMU-1-Small-Region.svs")
    segmenter = SegmentationService(_settings())
    request = SegmentRequest(x=0, y=0, width=512, height=512, max_nuclei=100)

    first = segmenter.segment(store.get_reader(slide.id), request).model_dump(mode="json")
    second = segmenter.segment(store.get_reader(slide.id), request).model_dump(mode="json")

    assert _normalized_segment(first) == _normalized_segment(second)
    store.close()
