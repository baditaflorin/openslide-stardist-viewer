from __future__ import annotations

import math
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from PIL import Image

from app.core.errors import BadRequestError, UnsupportedSlideError
from app.slides.inference import infer_slide
from app.slides.models import Dimensions, SlideMetadata
from app.slides.preflight import SUPPORTED_SLIDE_EXTENSIONS as SUPPORTED_EXTENSIONS

try:
    import openslide
    from openslide import OpenSlideError
except Exception:  # pragma: no cover - optional native dependency
    openslide = None

    class OpenSlideError(Exception):
        pass


def deepzoom_max_level(width: int, height: int) -> int:
    return int(math.ceil(math.log(max(width, height), 2))) if max(width, height) > 1 else 0


def pyramid_dimensions(width: int, height: int) -> list[Dimensions]:
    max_level = deepzoom_max_level(width, height)
    dims: list[Dimensions] = []
    for level in range(max_level + 1):
        scale = 2 ** (max_level - level)
        dims.append(Dimensions(width=max(1, math.ceil(width / scale)), height=max(1, math.ceil(height / scale))))
    return dims


class SlideReader(ABC):
    def __init__(
        self,
        slide_id: str,
        path: Path,
        tile_size: int,
        *,
        relative_path: str,
        size_bytes: int,
        fingerprint: str,
    ) -> None:
        self.slide_id = slide_id
        self.path = path
        self.tile_size = tile_size
        self.relative_path = relative_path
        self.size_bytes = size_bytes
        self.fingerprint = fingerprint

    @property
    @abstractmethod
    def width(self) -> int:
        raise NotImplementedError

    @property
    @abstractmethod
    def height(self) -> int:
        raise NotImplementedError

    @abstractmethod
    def metadata(self) -> SlideMetadata:
        raise NotImplementedError

    @abstractmethod
    def read_region(self, x: int, y: int, width: int, height: int) -> Image.Image:
        raise NotImplementedError

    @abstractmethod
    def get_deepzoom_tile(self, level: int, column: int, row: int) -> Image.Image:
        raise NotImplementedError

    @abstractmethod
    def get_thumbnail(self, size: int) -> Image.Image:
        raise NotImplementedError

    def close(self) -> None:
        return None

    def _tile_geometry(self, level: int, column: int, row: int) -> tuple[int, int, int, int, int, int]:
        max_level = deepzoom_max_level(self.width, self.height)
        if level < 0 or level > max_level:
            raise BadRequestError("Deep Zoom level is outside the slide pyramid.")
        scale = 2 ** (max_level - level)
        full_tile_size = self.tile_size * scale
        full_x = column * full_tile_size
        full_y = row * full_tile_size
        if full_x >= self.width or full_y >= self.height:
            raise BadRequestError("Deep Zoom tile coordinate is outside the slide.")
        full_width = min(full_tile_size, self.width - full_x)
        full_height = min(full_tile_size, self.height - full_y)
        target_width = max(1, math.ceil(full_width / scale))
        target_height = max(1, math.ceil(full_height / scale))
        return full_x, full_y, full_width, full_height, target_width, target_height


class OpenSlideReader(SlideReader):
    def __init__(
        self,
        slide_id: str,
        path: Path,
        tile_size: int,
        *,
        relative_path: str,
        size_bytes: int,
        fingerprint: str,
    ) -> None:
        if openslide is None:
            raise UnsupportedSlideError("OpenSlide is not installed in this backend.")
        super().__init__(
            slide_id,
            path,
            tile_size,
            relative_path=relative_path,
            size_bytes=size_bytes,
            fingerprint=fingerprint,
        )
        try:
            self._slide = openslide.OpenSlide(str(path))
        except OpenSlideError as exc:
            raise UnsupportedSlideError("OpenSlide could not open this slide.") from exc
        self._properties: dict[str, str] = {str(key): str(value) for key, value in self._slide.properties.items()}

    @property
    def width(self) -> int:
        return int(self._slide.dimensions[0])

    @property
    def height(self) -> int:
        return int(self._slide.dimensions[1])

    def metadata(self) -> SlideMetadata:
        props = self._properties
        format_name = str(openslide.OpenSlide.detect_format(str(self.path)) or "openslide")
        mpp_x = _float_or_none(props.get("openslide.mpp-x"))
        mpp_y = _float_or_none(props.get("openslide.mpp-y"))
        objective_power = _float_or_none(props.get("openslide.objective-power"))
        inferences, warnings = infer_slide(
            filename=self.path.name,
            format_name=format_name,
            properties=props,
            size_bytes=self.size_bytes,
            dimensions=(self.width, self.height),
            level_count=len(self._slide.level_dimensions),
            mpp_x=mpp_x,
            mpp_y=mpp_y,
            objective_power=objective_power,
        )
        return SlideMetadata(
            id=self.slide_id,
            name=self.path.stem,
            filename=self.path.name,
            relative_path=self.relative_path,
            format=format_name,
            fingerprint=self.fingerprint,
            size_bytes=self.size_bytes,
            dimensions=Dimensions(width=self.width, height=self.height),
            level_count=len(self._slide.level_dimensions),
            level_dimensions=[Dimensions(width=int(w), height=int(h)) for w, h in self._slide.level_dimensions],
            tile_size=self.tile_size,
            mpp_x=mpp_x,
            mpp_y=mpp_y,
            objective_power=objective_power,
            properties=_safe_properties(props),
            inferences=inferences,
            warnings=warnings,
        )

    def read_region(self, x: int, y: int, width: int, height: int) -> Image.Image:
        x, y, width, height = _clamp_region(x, y, width, height, self.width, self.height)
        return self._slide.read_region((x, y), 0, (width, height)).convert("RGB")

    def get_deepzoom_tile(self, level: int, column: int, row: int) -> Image.Image:
        full_x, full_y, full_width, full_height, target_width, target_height = self._tile_geometry(level, column, row)
        scale = max(full_width / target_width, full_height / target_height)
        best_level = int(self._slide.get_best_level_for_downsample(scale))
        downsample = float(self._slide.level_downsamples[best_level])
        read_width = max(1, math.ceil(full_width / downsample))
        read_height = max(1, math.ceil(full_height / downsample))
        tile = self._slide.read_region((full_x, full_y), best_level, (read_width, read_height)).convert("RGB")
        if tile.size != (target_width, target_height):
            tile = tile.resize((target_width, target_height), Image.Resampling.LANCZOS)
        return tile

    def get_thumbnail(self, size: int) -> Image.Image:
        return self._slide.get_thumbnail((size, size)).convert("RGB")

    def close(self) -> None:
        self._slide.close()


class PillowSlideReader(SlideReader):
    def __init__(
        self,
        slide_id: str,
        path: Path,
        tile_size: int,
        *,
        relative_path: str,
        size_bytes: int,
        fingerprint: str,
    ) -> None:
        super().__init__(
            slide_id,
            path,
            tile_size,
            relative_path=relative_path,
            size_bytes=size_bytes,
            fingerprint=fingerprint,
        )
        try:
            opened = Image.open(path)
            self._format = opened.format
            self._image = opened.convert("RGB")
        except Exception as exc:
            raise UnsupportedSlideError("Pillow could not open this image slide.") from exc

    @property
    def width(self) -> int:
        return self._image.width

    @property
    def height(self) -> int:
        return self._image.height

    def metadata(self) -> SlideMetadata:
        dims = pyramid_dimensions(self.width, self.height)
        format_name = (self._format or self.path.suffix.lstrip(".") or "image").lower()
        inferences, warnings = infer_slide(
            filename=self.path.name,
            format_name=format_name,
            properties={},
            size_bytes=self.size_bytes,
            dimensions=(self.width, self.height),
            level_count=len(dims),
            mpp_x=None,
            mpp_y=None,
            objective_power=None,
        )
        return SlideMetadata(
            id=self.slide_id,
            name=self.path.stem,
            filename=self.path.name,
            relative_path=self.relative_path,
            format=format_name,
            fingerprint=self.fingerprint,
            size_bytes=self.size_bytes,
            dimensions=Dimensions(width=self.width, height=self.height),
            level_count=len(dims),
            level_dimensions=dims,
            tile_size=self.tile_size,
            properties={},
            inferences=inferences,
            warnings=warnings,
        )

    def read_region(self, x: int, y: int, width: int, height: int) -> Image.Image:
        x, y, width, height = _clamp_region(x, y, width, height, self.width, self.height)
        return self._image.crop((x, y, x + width, y + height))

    def get_deepzoom_tile(self, level: int, column: int, row: int) -> Image.Image:
        full_x, full_y, full_width, full_height, target_width, target_height = self._tile_geometry(level, column, row)
        tile = self._image.crop((full_x, full_y, full_x + full_width, full_y + full_height))
        if tile.size != (target_width, target_height):
            tile = tile.resize((target_width, target_height), Image.Resampling.LANCZOS)
        return tile

    def get_thumbnail(self, size: int) -> Image.Image:
        image = self._image.copy()
        image.thumbnail((size, size), Image.Resampling.LANCZOS)
        return image

    def close(self) -> None:
        self._image.close()


def open_slide_reader(
    slide_id: str,
    path: Path,
    tile_size: int,
    *,
    relative_path: str,
    size_bytes: int,
    fingerprint: str,
) -> SlideReader:
    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise UnsupportedSlideError("Unsupported slide extension.")
    if openslide is not None:
        try:
            if openslide.OpenSlide.detect_format(str(path)):
                return OpenSlideReader(
                    slide_id,
                    path,
                    tile_size,
                    relative_path=relative_path,
                    size_bytes=size_bytes,
                    fingerprint=fingerprint,
                )
        except Exception:
            pass
    return PillowSlideReader(
        slide_id,
        path,
        tile_size,
        relative_path=relative_path,
        size_bytes=size_bytes,
        fingerprint=fingerprint,
    )


def _clamp_region(
    x: int, y: int, width: int, height: int, max_width: int, max_height: int
) -> tuple[int, int, int, int]:
    if width <= 0 or height <= 0:
        raise BadRequestError("Region width and height must be positive.")
    x = max(0, min(x, max_width - 1))
    y = max(0, min(y, max_height - 1))
    width = max(1, min(width, max_width - x))
    height = max(1, min(height, max_height - y))
    return x, y, width, height


def _float_or_none(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _safe_properties(properties: dict[str, Any]) -> dict[str, str]:
    public_prefixes = ("openslide.", "aperio.", "hamamatsu.", "tiff.")
    return {
        str(key): str(value)
        for key, value in properties.items()
        if str(key).startswith(public_prefixes) and "path" not in str(key).lower()
    }
