from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.core.config import Settings
from app.main import create_app


def _write_demo_slide(path: Path) -> None:
    image = Image.new("RGB", (512, 384), "#f5d6d8")
    draw = ImageDraw.Draw(image)
    for x, y in [(96, 96), (140, 130), (250, 180), (310, 220), (400, 130)]:
        draw.ellipse((x - 14, y - 11, x + 14, y + 11), fill="#4e3f9c", outline="#2e256f")
    image.save(path)


def test_slide_listing_tiles_and_segmentation(tmp_path: Path) -> None:
    slide_dir = tmp_path / "slides"
    result_dir = tmp_path / "results"
    slide_dir.mkdir()
    result_dir.mkdir()
    _write_demo_slide(slide_dir / "demo.png")
    settings = Settings(
        slide_dir=slide_dir,
        result_dir=result_dir,
        allowed_origins="http://testserver",
        segmentation_backend="fallback",
        tile_size=256,
    )
    app = create_app(settings)

    with TestClient(app) as client:
        slides_response = client.get("/api/slides")
        assert slides_response.status_code == 200
        slides = slides_response.json()["slides"]
        assert len(slides) == 1
        slide_id = slides[0]["id"]

        dzi_response = client.get(f"/api/slides/{slide_id}/dzi")
        assert dzi_response.status_code == 200
        assert "TileSize" in dzi_response.text

        tile_response = client.get(f"/api/slides/{slide_id}_files/9/0_0.jpeg")
        assert tile_response.status_code == 200
        assert tile_response.headers["content-type"] == "image/jpeg"

        segment_response = client.post(
            f"/api/slides/{slide_id}/segment",
            json={"x": 0, "y": 0, "width": 512, "height": 384, "max_nuclei": 50},
        )
        assert segment_response.status_code == 200
        payload = segment_response.json()
        assert payload["count"] >= 1
        assert payload["method"] == "fallback-threshold"

