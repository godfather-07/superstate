# SuperState: Founder Story Deck

15-slide founder story pitch, built from the founder script and the SuperState Brand Identity
Guidelines (06.05.2026). It follows the Airbnb-deck idea: one thought per slide, big type, nothing busy.

- **Look:** Deep Knowing blue and white, Lora SemiBold headlines, Bricolage Grotesque body text,
  First Light highlighter marks, and Emerge accents.
- **Imagery:** only the new Sleep Well box and pouch packshots, plus the wordmark motif.
- **Speaker notes:** the full founder script is in each slide's notes (Presenter View).

| File | What it is |
|---|---|
| `SuperState_Pitch_Deck.pdf` | Share-ready PDF with brand fonts embedded |
| `SuperState_Pitch_Deck.pptx` | Editable deck with speaker notes |
| `build_deck.py` | Generator (python-pptx + MckEngine from the `mck-ppt-design` skill) |
| `render_preview.sh` | Rebuilds the deck and renders the PDF and previews with LibreOffice |
| `assets/` | Logo variants and Sleep Well packshots (plus background-removed cut-outs) |

To edit the PPTX with the right typography, install **Lora** and **Bricolage Grotesque** from Google Fonts.

## Rebuild
```bash
pip install python-pptx lxml pillow
git clone https://github.com/likaku/Mck-ppt-design-skill ~/.claude/skills/mck-ppt-design
python3 build_deck.py
```
