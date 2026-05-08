from __future__ import annotations

import logging
import time
from collections import deque

import numpy as np
from PIL import Image

from app.core.config import Settings
from app.core.errors import RegionTooLargeError
from app.metrics.instrumentation import NUCLEI_COUNT, SEGMENTATION_LATENCY, SEGMENTATION_REQUESTS
from app.segmentation.models import Nucleus, Region, SegmentRequest, SegmentResponse
from app.slides.reader import SlideReader

logger = logging.getLogger(__name__)


class SegmentationService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._stardist_model = None
        self._normalize = None

    def segment(self, reader: SlideReader, request: SegmentRequest) -> SegmentResponse:
        if request.width * request.height > self.settings.max_region_pixels:
            raise RegionTooLargeError(
                "Requested segmentation region is too large.",
                details={"max_region_pixels": self.settings.max_region_pixels},
            )
        started = time.perf_counter()
        image = reader.read_region(request.x, request.y, request.width, request.height)
        labels, confidences, method = self._segment_image(image)
        nuclei = _labels_to_nuclei(labels, confidences, request.x, request.y, request.max_nuclei)
        elapsed = time.perf_counter() - started
        SEGMENTATION_REQUESTS.labels(method=method).inc()
        SEGMENTATION_LATENCY.labels(method=method).observe(elapsed)
        NUCLEI_COUNT.labels(method=method).observe(len(nuclei))
        return SegmentResponse(
            slide_id=reader.slide_id,
            method=method,
            region=Region(x=request.x, y=request.y, width=request.width, height=request.height),
            count=len(nuclei),
            elapsed_ms=round(elapsed * 1000, 2),
            nuclei=nuclei,
        )

    def _segment_image(self, image: Image.Image) -> tuple[np.ndarray, dict[int, float], str]:
        rgb = np.asarray(image.convert("RGB"))
        if self.settings.segmentation_backend in {"auto", "stardist"}:
            result = self._try_stardist(rgb)
            if result is not None:
                return result[0], result[1], "stardist"
        if self.settings.segmentation_backend in {"auto", "histomicstk"}:
            result = self._try_histomicstk(rgb)
            if result is not None:
                return result[0], {}, "histomicstk-kofahi"
        labels = _simple_fallback_labels(rgb)
        return labels, {}, "fallback-threshold"

    def _try_stardist(self, rgb: np.ndarray) -> tuple[np.ndarray, dict[int, float]] | None:
        try:
            model = self._get_stardist_model()
            normalized = self._normalize(rgb, 1, 99.8, axis=(0, 1))
            labels, details = model.predict_instances(normalized)
            probabilities = details.get("prob", []) if isinstance(details, dict) else []
            confidences = {index + 1: float(prob) for index, prob in enumerate(probabilities)}
            return labels.astype(np.int32), confidences
        except Exception as exc:
            if self.settings.segmentation_backend == "stardist":
                raise
            logger.info("StarDist unavailable, falling back: %s", exc)
            return None

    def _get_stardist_model(self):
        if self._stardist_model is None:
            from csbdeep.utils import normalize
            from stardist.models import StarDist2D

            self._normalize = normalize
            self._stardist_model = StarDist2D.from_pretrained("2D_versatile_he")
        return self._stardist_model

    def _try_histomicstk(self, rgb: np.ndarray) -> tuple[np.ndarray, dict[int, float]] | None:
        try:
            import histomicstk as htk
            import scipy as sp

            stain_color_map = htk.preprocessing.color_deconvolution.stain_color_map
            stains = ["hematoxylin", "eosin", "null"]
            matrix = np.array([stain_color_map[stain] for stain in stains]).T
            deconvolved = htk.preprocessing.color_deconvolution.color_deconvolution(rgb, matrix)
            nuclei_stain = deconvolved.Stains[:, :, 0]
            threshold = np.percentile(nuclei_stain, 40)
            foreground = sp.ndimage.binary_fill_holes(nuclei_stain < threshold)
            labels = htk.segmentation.nuclear.detect_nuclei_kofahi(
                nuclei_stain,
                foreground,
                min_radius=5,
                max_radius=14,
                min_nucleus_area=40,
                local_max_search_radius=8,
            )
            return labels.astype(np.int32), {}
        except Exception as exc:
            if self.settings.segmentation_backend == "histomicstk":
                raise
            logger.info("HistomicsTK unavailable, falling back: %s", exc)
            return None


def _labels_to_nuclei(
    labels: np.ndarray,
    confidences: dict[int, float],
    offset_x: int,
    offset_y: int,
    max_nuclei: int,
) -> list[Nucleus]:
    nuclei: list[Nucleus] = []
    label_ids = [int(value) for value in np.unique(labels) if value > 0]
    components: list[tuple[int, np.ndarray, np.ndarray]] = []
    for label_id in label_ids:
        ys, xs = np.nonzero(labels == label_id)
        if len(xs) < 16:
            continue
        components.append((label_id, xs, ys))
    components.sort(key=lambda item: len(item[1]), reverse=True)
    for output_id, (label_id, xs, ys) in enumerate(components[:max_nuclei], start=1):
        min_x, max_x = int(xs.min()), int(xs.max())
        min_y, max_y = int(ys.min()), int(ys.max())
        centroid_x = float(xs.mean() + offset_x)
        centroid_y = float(ys.mean() + offset_y)
        bbox = (
            float(min_x + offset_x),
            float(min_y + offset_y),
            float(max_x + offset_x + 1),
            float(max_y + offset_y + 1),
        )
        polygon = _bbox_polygon(min_x + offset_x, min_y + offset_y, max_x + offset_x + 1, max_y + offset_y + 1)
        nuclei.append(
            Nucleus(
                id=output_id,
                centroid=(centroid_x, centroid_y),
                area=float(len(xs)),
                bbox=bbox,
                confidence=confidences.get(label_id),
                polygon=polygon,
            )
        )
    return nuclei


def _simple_fallback_labels(rgb: np.ndarray) -> np.ndarray:
    red = rgb[:, :, 0].astype(np.float32)
    green = rgb[:, :, 1].astype(np.float32)
    blue = rgb[:, :, 2].astype(np.float32)
    luminance = 0.299 * red + 0.587 * green + 0.114 * blue
    blue_purple = blue - 0.45 * (red + green)
    dark_threshold = np.percentile(luminance, 45)
    mask = (luminance < min(210, dark_threshold + 20)) & ((blue_purple > -25) | (red < 170))
    return _label_mask(mask)


def _label_mask(mask: np.ndarray) -> np.ndarray:
    try:
        from skimage.measure import label
        from skimage.morphology import binary_opening, remove_small_objects

        cleaned = binary_opening(mask)
        cleaned = remove_small_objects(cleaned, min_size=24)
        return label(cleaned, connectivity=2).astype(np.int32)
    except Exception:
        return _connected_components(mask)


def _connected_components(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    labels = np.zeros((height, width), dtype=np.int32)
    current = 0
    for y in range(height):
        for x in range(width):
            if not mask[y, x] or labels[y, x] != 0:
                continue
            current += 1
            queue: deque[tuple[int, int]] = deque([(x, y)])
            labels[y, x] = current
            size = 0
            while queue:
                px, py = queue.popleft()
                size += 1
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < width and 0 <= ny < height and mask[ny, nx] and labels[ny, nx] == 0:
                        labels[ny, nx] = current
                        queue.append((nx, ny))
            if size < 24:
                labels[labels == current] = 0
                current -= 1
    return labels


def _bbox_polygon(min_x: int, min_y: int, max_x: int, max_y: int) -> list[tuple[float, float]]:
    return [
        (float(min_x), float(min_y)),
        (float(max_x), float(min_y)),
        (float(max_x), float(max_y)),
        (float(min_x), float(max_y)),
    ]
