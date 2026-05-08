from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw


def main() -> None:
    target = Path(sys.argv[1])
    target.parent.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGB", (960, 640), "#f2d4d8")
    draw = ImageDraw.Draw(image)
    for x in range(60, 920, 90):
        for y in range(50, 600, 74):
            if (x + y) % 3 == 0:
                draw.ellipse((x - 13, y - 10, x + 13, y + 10), fill="#514099", outline="#302464")
    image.save(target)


if __name__ == "__main__":
    main()
