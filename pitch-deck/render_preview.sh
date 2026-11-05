#!/usr/bin/env bash
# Render the deck to PDF + preview contact sheets (needs LibreOffice + poppler).
set -e
cd "$(dirname "$0")"
python3 build_deck.py
rm -rf build/render && mkdir -p build/render
soffice --headless --convert-to pdf --outdir build/render SuperState_Pitch_Deck.pptx >/dev/null 2>&1
pdftoppm -r "${DPI:-50}" -png build/render/SuperState_Pitch_Deck.pdf build/render/s
python3 - <<'PY'
from PIL import Image; import glob
fs = sorted(glob.glob('build/render/s-*.png')); ims = [Image.open(f) for f in fs]; w, h = ims[0].size
for k in range(0, len(ims), 6):
    sh = Image.new('RGB', (w*2+10, (h+10)*3), 'grey')
    for i, im in enumerate(ims[k:k+6]): sh.paste(im, ((i % 2)*(w+10), (i//2)*(h+10)))
    sh.save(f'build/render/sheet{k//6}.png')
PY
