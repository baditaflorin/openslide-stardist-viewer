from __future__ import annotations

import hashlib
import logging
import re
from dataclasses import dataclass
from pathlib import Path

from app.core.config import Settings
from app.core.errors import NotFoundError
from app.metrics.instrumentation import SLIDE_SCANS
from app.slides.models import SlideMetadata
from app.slides.reader import SUPPORTED_EXTENSIONS, SlideReader, open_slide_reader

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

    def scan(self) -> None:
        self.settings.slide_dir.mkdir(parents=True, exist_ok=True)
        discovered: dict[str, SlideRecord] = {}
        for path in sorted(self.settings.slide_dir.rglob("*")):
            if not path.is_file() or path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                continue
            slide_id = self._id_for_path(path)
            try:
                reader = self._readers.get(slide_id) or open_slide_reader(slide_id, path, self.settings.tile_size)
                metadata = reader.metadata()
                self._readers[slide_id] = reader
                discovered[slide_id] = SlideRecord(id=slide_id, path=path, metadata=metadata)
            except Exception as exc:
                logger.warning("Skipping unsupported slide %s: %s", path.name, exc)
        removed = set(self.records) - set(discovered)
        for slide_id in removed:
            reader = self._readers.pop(slide_id, None)
            if reader is not None:
                reader.close()
        self.records = discovered
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
            reader = open_slide_reader(slide_id, record.path, self.settings.tile_size)
            self._readers[slide_id] = reader
        return reader

    def close(self) -> None:
        for reader in self._readers.values():
            reader.close()
        self._readers.clear()

    def _id_for_path(self, path: Path) -> str:
        try:
            relative = path.relative_to(self.settings.slide_dir)
        except ValueError:
            relative = path
        slug = re.sub(r"[^a-z0-9]+", "-", path.stem.lower()).strip("-") or "slide"
        digest = hashlib.sha1(relative.as_posix().encode("utf-8")).hexdigest()[:10]
        return f"{slug}-{digest}"

