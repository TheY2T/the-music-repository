#!/usr/bin/env python3
"""Assemble a multi-resolution favicon.ico from PNG files (PNG-compressed entries).

Usage: make_ico.py out.ico in16.png in32.png in48.png [...]
Each PNG is embedded as-is; modern browsers decode PNG-in-ICO entries.
"""
import struct
import sys


def build(out_path, png_paths):
    images = []
    for p in png_paths:
        with open(p, "rb") as f:
            data = f.read()
        # PNG IHDR width/height live at byte offset 16..24 (big-endian uint32).
        w = struct.unpack(">I", data[16:20])[0]
        h = struct.unpack(">I", data[20:24])[0]
        images.append((w, h, data))

    count = len(images)
    header = struct.pack("<HHH", 0, 1, count)  # reserved, type=icon, count
    dir_size = 6 + 16 * count
    offset = dir_size
    entries = b""
    for w, h, data in images:
        entries += struct.pack(
            "<BBBBHHII",
            w & 0xFF if w < 256 else 0,   # width  (0 => 256)
            h & 0xFF if h < 256 else 0,   # height (0 => 256)
            0,                            # color palette count
            0,                            # reserved
            1,                            # color planes
            32,                           # bits per pixel
            len(data),                    # bytes of image data
            offset,                       # offset from file start
        )
        offset += len(data)

    with open(out_path, "wb") as f:
        f.write(header)
        f.write(entries)
        for _, _, data in images:
            f.write(data)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("usage: make_ico.py out.ico in.png [in.png ...]")
    build(sys.argv[1], sys.argv[2:])
    print(f"wrote {sys.argv[1]} ({len(sys.argv) - 2} images)")
