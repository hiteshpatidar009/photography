#!/usr/bin/env python3
"""Make web-sized copies of the portfolio photos.

For every imgN.jpg / imgN.JPG / imgN.png in img/heroimgs and img/new-images it writes:
  <folder>/web/imgN.jpg    small copy (short side 640px) for tiles, thumbnails and the hero wall
  <folder>/large/imgN.jpg  big copy (long side 2048px) for the full-screen viewer and backgrounds

Originals are never changed. Copies that are already newer than their original are skipped.
Run it again after adding new photos:  python optimize-images.py   (needs: pip install pillow)
"""
import os
import re

from PIL import Image, ImageOps

FOLDERS = ["img/heroimgs", "img/new-images"]
SIZES = {
    "web": lambda w, h: 640 / min(w, h),
    "large": lambda w, h: 2048 / max(w, h),
}
QUALITY = {"web": 80, "large": 82}


def main():
    for folder in FOLDERS:
        for name in sorted(os.listdir(folder)):
            match = re.fullmatch(r"img(\d+)\.(jpe?g|png)", name, re.IGNORECASE)
            if not match:
                continue
            src = os.path.join(folder, name)
            image = None
            for size, scale_for in SIZES.items():
                dst = os.path.join(folder, size, "img%s.jpg" % match.group(1))
                if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                    continue
                if image is None:
                    # apply camera rotation, drop EXIF (incl. GPS) by not passing it on save
                    image = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
                scale = min(1, scale_for(*image.size))
                resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                resized.save(dst, "JPEG", quality=QUALITY[size], optimize=True, progressive=True)
                print("%s -> %s %s %dKB" % (src, dst, resized.size, os.path.getsize(dst) // 1000))


if __name__ == "__main__":
    main()
