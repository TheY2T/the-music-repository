#!/usr/bin/env bash
# Builds a web/PWA favicon set for each jukebox variant.
# Requires rsvg-convert + python3. Run from anywhere.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$ROOT/src"
VARIANTS=(wurlitzer oxblood nightclub)

# theme_color per variant (its ground colour); background matches.
theme_color() {
  case "$1" in
    wurlitzer) echo "#f4f0e6" ;;
    oxblood)   echo "#7a2e28" ;;
    nightclub) echo "#17130f" ;;
  esac
}

for v in "${VARIANTS[@]}"; do
  OUT="$ROOT/web/$v"
  mkdir -p "$OUT"
  THEME="$(theme_color "$v")"

  rsvg-convert -w 16  -h 16  "$SRC/$v.svg" -o "$OUT/favicon-16.png"
  rsvg-convert -w 32  -h 32  "$SRC/$v.svg" -o "$OUT/favicon-32.png"
  rsvg-convert -w 48  -h 48  "$SRC/$v.svg" -o "$OUT/favicon-48.png"
  rsvg-convert -w 180 -h 180 "$SRC/$v.svg" -o "$OUT/apple-touch-icon.png"
  rsvg-convert -w 192 -h 192 "$SRC/$v.svg" -o "$OUT/icon-192.png"
  rsvg-convert -w 512 -h 512 "$SRC/$v.svg" -o "$OUT/icon-512.png"
  cp "$SRC/$v.svg" "$OUT/favicon.svg"

  python3 "$ROOT/make_ico.py" "$OUT/favicon.ico" \
    "$OUT/favicon-16.png" "$OUT/favicon-32.png" "$OUT/favicon-48.png" >/dev/null

  cat > "$OUT/site.webmanifest" <<JSON
{
  "name": "The Music Repository",
  "short_name": "TMR",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "${THEME}",
  "background_color": "${THEME}",
  "display": "standalone"
}
JSON

  echo "built web/$v"
done

cat > "$ROOT/web/head-snippet.html" <<'HTML'
<!-- Reference the chosen variant's files from your site root (e.g. apps/web/public/). -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
HTML
echo "wrote web/head-snippet.html"
