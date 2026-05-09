from __future__ import annotations

import hashlib
import logging
import time
from dataclasses import dataclass
from pathlib import Path

from app.core.config import Settings
from app.core.errors import NotFoundError
from app.metrics.instrumentation import SLIDE_SCANS
from app.slides.models import DomainWarning, ScanSummary, SlideMetadata, SlideProblem
from app.slides.preflight import Preflight, preflight_path, problem_from_open_error, slugify
from app.slides.reader import SlideReader, open_slide_reader

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SlideRecord:
    id: str
    path: Path
    metadata: SlideMetadata


class SlideStore:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.records: dict[str, SlideRecord] = {}
        self._readers: dict[str, SlideReader] = {}
        self.problems: list[SlideProblem] = []
        self.summary = ScanSummary(total_files=0, usable_slides=0, problem_files=0, ignored_sidecars=0, duration_ms=0)

    def scan(self) -> None:
        started = time.perf_counter()
        self.settings.slide_dir.mkdir(parents=True, exist_ok=True)
        discovered: dict[str, SlideRecord] = {}
        problems: list[SlideProblem] = []
        ignored_sidecars = 0
        total_files = 0
        for path in sorted(self.settings.slide_dir.rglob("*")):
            if not path.is_file():
                continue
            total_files += 1
            preflight = preflight_path(path, self.settings.slide_dir)
            if preflight.ignored_sidecar:
                ignored_sidecars += 1
                continue
            if preflight.problem is not None:
                problems.append(preflight.problem)
                continue
            slide_id = self._id_for_preflight(path, preflight)
            try:
                reader = self._readers.get(slide_id) or open_slide_reader(
                    slide_id,
                    path,
                    self.settings.tile_size,
                    relative_path=preflight.relative_path,
                    size_bytes=preflight.size_bytes,
                    fingerprint=preflight.fingerprint,
                )
                metadata = reader.metadata()
                self._readers[slide_id] = reader
                discovered[slide_id] = SlideRecord(id=slide_id, path=path, metadata=metadata)
            except Exception as exc:
                logger.warning("Skipping unsupported slide %s: %s", path.name, exc)
                problems.append(problem_from_open_error(path, self.settings.slide_dir, preflight.fingerprint, str(exc)))
        removed = set(self.records) - set(discovered)
        for slide_id in removed:
            reader = self._readers.pop(slide_id, None)
            if reader is not None:
                reader.close()
        self.records = self._with_duplicate_warnings(discovered)
        self.problems = sorted(problems, key=lambda item: (item.severity, item.relative_path))
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        self.summary = ScanSummary(
            total_files=total_files,
            usable_slides=len(self.records),
            problem_files=len(self.problems),
            ignored_sidecars=ignored_sidecars,
            duration_ms=elapsed_ms,
            warnings=_scan_warnings(elapsed_ms, len(self.problems)),
        )
        SLIDE_SCANS.inc()

    def list_slides(self) -> list[SlideMetadata]:
        return sorted((record.metadata for record in self.records.values()), key=lambda item: item.name.lower())

    def get_metadata(self, slide_id: str) -> SlideMetadata:
        record = self.records.get(slide_id)
        if record is None:
            raise NotFoundError("Slide not found.")
        return record.metadata

    def get_reader(self, slide_id: str) -> SlideReader:
        record = self.records.get(slide_id)
        if record is None:
            raise NotFoundError("Slide not found.")
        reader = self._readers.get(slide_id)
        if reader is None:
            reader = open_slide_reader(
                slide_id,
                record.path,
                self.settings.tile_size,
                relative_path=record.metadata.relative_path,
                size_bytes=record.metadata.size_bytes,
                fingerprint=record.metadata.fingerprint,
            )
            self._readers[slide_id] = reader
        return reader

    def close(self) -> None:
        for reader in self._readers.values():
            reader.close()
        self._readers.clear()

    def _id_for_preflight(self, path: Path, preflight: Preflight) -> str:
        slug = slugify(path.stem)
        digest = hashlib.sha1(f"{preflight.relative_path}:{preflight.fingerprint}".encode()).hexdigest()[:10]
        return f"{slug}-{digest}"

    def _with_duplicate_warnings(self, records: dict[str, SlideRecord]) -> dict[str, SlideRecord]:
        fingerprints: dict[str, list[str]] = {}
        for slide_id, record in records.items():
            fingerprints.setdefault(record.metadata.fingerprint, []).append(slide_id)
        updated: dict[str, SlideRecord] = {}
        for slide_id, record in records.items():
            duplicates = [item for item in fingerprints[record.metadata.fingerprint] if item != slide_id]
            if not duplicates:
                updated[slide_id] = record
                continue
            metadata = record.metadata.model_copy(
                update={
                    "warnings": [
                        *record.metadata.warnings,
                        DomainWarning(
                            code="duplicate_content",
                            severity="info",
                            message="Another slide has the same content fingerprint.",
                            next_step="Keep one copy if these are accidental duplicates.",
                        ),
                    ]
                }
            )
            updated[slide_id] = SlideRecord(id=record.id, path=record.path, metadata=metadata)
        return updated


def _scan_warnings(elapsed_ms: float, problem_count: int) -> list[DomainWarning]:
    warnings: list[DomainWarning] = []
    if elapsed_ms > 300:
        warnings.append(
            DomainWarning(
                code="scan_slow",
                severity="info",
                message="Slide folder scan took longer than the interactive budget.",
                next_step="Large slide folders may benefit from metadata caching in future runs.",
            )
        )
    if problem_count:
        warnings.append(
            DomainWarning(
                code="scan_has_problem_files",
                severity="warning",
                message=f"{problem_count} file(s) could not be used as slides.",
                next_step="Review the scan issues list for repair steps.",
            )
        )
    return warnings
