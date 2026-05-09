from __future__ import annotations

import hashlib
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from app.slides.models import SlideProblem

ProblemCategory = str
Severity = str

SUPPORTED_SLIDE_EXTENSIONS = {
    ".svs",
    ".tif",
    ".tiff",
    ".ndpi",
    ".scn",
    ".vms",
    ".vmu",
    ".mrxs",
    ".bif",
    ".jpg",
    ".jpeg",
    ".png",
    ".dcm",
    ".dicom",
}

ARCHIVE_EXTENSIONS = {".zip", ".tar", ".gz", ".tgz", ".7z", ".rar"}
ANCILLARY_EXTENSIONS = {".dat", ".ini", ".xml", ".txt"}
HUGE_SLIDE_BYTES = 1_000_000_000
TINY_SLIDE_BYTES = 1024


@dataclass(frozen=True)
class Preflight:
    path: Path
    relative_path: str
    extension: str
    size_bytes: int
    fingerprint: str
    problem: SlideProblem | None = None
    ignored_sidecar: bool = False


def preflight_path(path: Path, root: Path) -> Preflight:
    relative_path = _relative_path(path, root)
    extension = path.suffix.lower()
    size_bytes = path.stat().st_size
    fingerprint = fingerprint_file(path, size_bytes)

    if _is_ignored_sidecar(path, root):
        return Preflight(path, relative_path, extension, size_bytes, fingerprint, ignored_sidecar=True)
    if extension in ARCHIVE_EXTENSIONS:
        return _problem(
            path,
            root,
            fingerprint,
            "archive",
            "warning",
            "Archive found in slide folder.",
            "Extract the archive while preserving vendor sidecar folders, then refresh the slide list.",
        )
    if extension not in SUPPORTED_SLIDE_EXTENSIONS:
        return _problem(
            path,
            root,
            fingerprint,
            "unsupported_extension",
            "warning",
            f"Unsupported slide extension `{extension or '(none)'}`.",
            "Move non-slide files out of the slide directory or convert to an OpenSlide-supported format.",
        )
    if size_bytes == 0:
        return _problem(
            path,
            root,
            fingerprint,
            "empty",
            "critical",
            "Slide file is empty.",
            "Re-copy or re-export the slide file from the source system.",
        )
    if extension == ".mrxs":
        sidecar_dir = path.with_suffix("")
        slidedat = sidecar_dir / "Slidedat.ini"
        if not sidecar_dir.is_dir() or not slidedat.is_file():
            return _problem(
                path,
                root,
                fingerprint,
                "missing_sidecar",
                "critical",
                "MIRAX slide is missing its sidecar folder.",
                f"Place the sibling folder `{sidecar_dir.name}/` with `Slidedat.ini` next to `{path.name}`.",
            )
    if extension in {".dcm", ".dicom"} and size_bytes < TINY_SLIDE_BYTES:
        return _problem(
            path,
            root,
            fingerprint,
            "dicom_package",
            "warning",
            "DICOM WSI input is incomplete or too small to be a slide.",
            "Provide the full DICOM WSI series directory, not a placeholder or partial file.",
        )
    if size_bytes < TINY_SLIDE_BYTES:
        return _problem(
            path,
            root,
            fingerprint,
            "corrupt_or_partial",
            "critical",
            "Slide file is too small to be a valid whole-slide image.",
            "Re-copy the file and verify the transfer completed.",
        )
    return Preflight(path, relative_path, extension, size_bytes, fingerprint)


def problem_from_open_error(path: Path, root: Path, fingerprint: str, message: str) -> SlideProblem:
    return SlideProblem(
        id=problem_id(path, root, fingerprint),
        filename=path.name,
        relative_path=_relative_path(path, root),
        extension=path.suffix.lower(),
        size_bytes=path.stat().st_size if path.exists() else 0,
        category="open_failed",
        severity="critical",
        message="Slide could not be opened by OpenSlide or Pillow.",
        next_step=_open_error_next_step(path, message),
    )


def fingerprint_file(path: Path, size_bytes: int | None = None) -> str:
    size = path.stat().st_size if size_bytes is None else size_bytes
    digest = hashlib.sha1()
    digest.update(str(size).encode("ascii"))
    with path.open("rb") as handle:
        digest.update(handle.read(65536))
        if size > 131072:
            handle.seek(max(0, size - 65536))
            digest.update(handle.read(65536))
    return digest.hexdigest()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-") or "slide"


def problem_id(path: Path, root: Path, fingerprint: str) -> str:
    return f"problem-{slugify(_relative_path(path, root))}-{fingerprint[:10]}"


def _problem(
    path: Path,
    root: Path,
    fingerprint: str,
    category: ProblemCategory,
    severity: Severity,
    message: str,
    next_step: str,
) -> Preflight:
    return Preflight(
        path=path,
        relative_path=_relative_path(path, root),
        extension=path.suffix.lower(),
        size_bytes=path.stat().st_size,
        fingerprint=fingerprint,
        problem=SlideProblem(
            id=problem_id(path, root, fingerprint),
            filename=path.name,
            relative_path=_relative_path(path, root),
            extension=path.suffix.lower(),
            size_bytes=path.stat().st_size,
            category=category,  # type: ignore[arg-type]
            severity=severity,  # type: ignore[arg-type]
            message=message,
            next_step=next_step,
        ),
    )


def _relative_path(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.name


def _is_ignored_sidecar(path: Path, root: Path) -> bool:
    if path.suffix.lower() not in ANCILLARY_EXTENSIONS:
        return False
    try:
        relative = path.relative_to(root)
    except ValueError:
        return False
    return len(relative.parts) > 1


def _open_error_next_step(path: Path, message: str) -> str:
    suffix = path.suffix.lower()
    lower_message = message.lower()
    if suffix == ".mrxs":
        return "Verify the MIRAX sidecar folder is complete and was copied with the `.mrxs` file."
    if suffix in {".dcm", ".dicom"}:
        return "Verify this is a complete DICOM WSI series and that OpenSlide in the backend supports DICOM."
    if "truncated" in lower_message or "corrupt" in lower_message:
        return "Re-copy the slide; the file looks corrupt or partially transferred."
    return "Verify the file opens with OpenSlide tools, then refresh the slide list."
