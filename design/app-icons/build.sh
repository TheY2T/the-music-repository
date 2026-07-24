#!/usr/bin/env bash
# Renders each jukebox SVG source into a full iOS AppIcon.appiconset.
# Requires rsvg-convert (librsvg). Run from anywhere.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$ROOT/src"
VARIANTS=(wurlitzer oxblood nightclub)

# Pixel sizes wired into the AppIcon.appiconset Contents.json (standard iOS slots).
SIZES=(20 29 40 58 60 76 80 87 120 152 167 180 1024)

# All sizes emitted as standalone PNGs in png/ (includes non-standard extras).
PNG_SIZES=(20 29 40 58 60 76 80 87 114 120 128 136 152 167 180 192 256 512 1024)

mkdir -p "$ROOT/png"
for v in "${VARIANTS[@]}"; do
  OUT="$ROOT/$v/AppIcon.appiconset"
  mkdir -p "$OUT"
  for px in "${SIZES[@]}"; do
    rsvg-convert -w "$px" -h "$px" "$SRC/$v.svg" -o "$OUT/icon_${px}.png"
  done
  cp "$ROOT/Contents.json" "$OUT/Contents.json"
  for px in "${PNG_SIZES[@]}"; do
    rsvg-convert -w "$px" -h "$px" "$SRC/$v.svg" -o "$ROOT/png/${v}_${px}.png"
  done
  echo "built $v ($(ls "$OUT"/*.png | wc -l | tr -d ' ') appicon pngs + ${#PNG_SIZES[@]} standalone)"
done
