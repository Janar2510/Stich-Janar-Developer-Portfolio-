#!/usr/bin/env python3
"""Regenerate every derived logo asset from the two source marks.

Run after replacing either source:

    python3 scripts/build-logo-assets.py

Sources (committed, never modified by this script):
    public/images/Logo/JanarKuusk.png   wordmark
    public/images/Logo/JK.png           monogram

Outputs:
    public/images/Logo/wordmark.png     header and footer, cropped to content
    src/app/icon.png                    browser tab icon
    src/app/apple-icon.png              iOS home screen
    src/app/favicon.ico                 legacy and Safari
"""

import struct
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

# The marks sit inside a mostly empty 500x500 canvas, so everything is cropped
# to its content box first. Favicons then fill 94% of their square: at 16px the
# original 72% left the monogram an unreadable blob, since a quarter of an
# already tiny canvas went to padding.
FAVICON_FILL = 0.94


def load_mark(name: str) -> Image.Image:
    im = Image.open(ROOT / "public/images/Logo" / name).convert("RGBA")
    return im.crop(im.getbbox())


def square(mark: Image.Image, size: int, bg=None) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0))
    target = int(size * FAVICON_FILL)
    w, h = mark.size
    ratio = min(target / w, target / h)
    m = mark.resize((max(1, round(w * ratio)), max(1, round(h * ratio))), Image.LANCZOS)
    canvas.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
    return canvas


def bmp_entry(im: Image.Image) -> bytes:
    """A single ICO entry in BMP/DIB form.

    Pillow writes every entry as PNG. Safari has a long history of failing to
    render PNG-compressed ICO entries, so the small sizes are hand-encoded as
    BMP, which is what dedicated favicon generators emit.
    """
    w, h = im.size
    px = im.load()

    # XOR mask: BGRA, bottom-up.
    xor = bytearray()
    for y in range(h - 1, -1, -1):
        for x in range(w):
            r, g, b, a = px[x, y]
            xor += bytes((b, g, r, a))

    # AND mask: 1bpp, bottom-up, each row padded to 4 bytes. Fully redundant
    # next to the alpha channel, but the format requires it.
    row_bytes = ((w + 31) // 32) * 4
    and_mask = bytearray()
    for y in range(h - 1, -1, -1):
        bits = bytearray(row_bytes)
        for x in range(w):
            if px[x, y][3] == 0:
                bits[x // 8] |= 0x80 >> (x % 8)
        and_mask += bits

    header = struct.pack(
        "<IiiHHIIiiII",
        40,          # header size
        w,
        h * 2,       # doubled: XOR mask stacked on AND mask
        1,           # planes
        32,          # bits per pixel
        0,           # BI_RGB
        len(xor) + len(and_mask),
        0, 0, 0, 0,
    )
    return bytes(header + xor + and_mask)


def write_ico(mark: Image.Image, path: Path) -> None:
    # BMP below 64px for Safari, PNG above it to keep the file small.
    sizes = [16, 24, 32, 48, 64, 128, 256]
    entries = []
    for size in sizes:
        im = square(mark, size)
        if size <= 64:
            entries.append((size, bmp_entry(im)))
        else:
            import io

            buf = io.BytesIO()
            im.save(buf, format="PNG")
            entries.append((size, buf.getvalue()))

    out = bytearray(struct.pack("<HHH", 0, 1, len(entries)))
    offset = 6 + 16 * len(entries)
    for size, data in entries:
        out += struct.pack(
            "<BBBBHHII",
            0 if size >= 256 else size,  # 0 means 256 in the ICO directory
            0 if size >= 256 else size,
            0, 0, 1, 32,
            len(data),
            offset,
        )
        offset += len(data)
    for _, data in entries:
        out += data

    path.write_bytes(bytes(out))
    print(f"favicon.ico  {len(entries)} entries {sizes}  {len(out)}b")


def main() -> None:
    wordmark = load_mark("JanarKuusk.png")
    wordmark.save(ROOT / "public/images/Logo/wordmark.png")
    print(f"wordmark.png {wordmark.size}")

    mono = load_mark("JK.png")

    square(mono, 512).save(ROOT / "src/app/icon.png")
    print("icon.png     512x512 transparent")

    # iOS flattens transparency, so the background is set explicitly rather
    # than left to the operating system.
    square(mono, 180, bg=(0, 0, 0, 255)).convert("RGB").save(ROOT / "src/app/apple-icon.png")
    print("apple-icon.png 180x180 black")

    write_ico(mono, ROOT / "src/app/favicon.ico")


if __name__ == "__main__":
    main()
