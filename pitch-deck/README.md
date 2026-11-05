# SuperState — Founder Pitch Deck

17-slide investor / founder-story deck built from the founder script, superstate.in content and the
SuperState Brand Identity Guidelines (06.05.2026), structured on the classic Airbnb pitch-deck flow.

| File | What it is |
|---|---|
| `SuperState_Pitch_Deck.pptx` | Editable deck (PowerPoint / Keynote / Google Slides) |
| `SuperState_Pitch_Deck.pdf` | Share-ready PDF with brand fonts embedded |
| `build_deck.py` | Generator (python-pptx + MckEngine from the `mck-ppt-design` skill) |
| `render_preview.sh` | Rebuilds the deck and renders PDF + preview sheets via LibreOffice |
| `assets/` | Logo variants, packshots, founder photo, ingredient and creator imagery |

## Before sharing
- **Slide 13 (Traction)** — add units sold, repeat-purchase rate, CAC by channel, average rating.
- **Slide 16 (The Ask)** — fill raise amount, instrument, runway and use-of-funds split (or delete for a story-only pitch).
- Install **Lora** and **Bricolage Grotesque** (Google Fonts) to edit the PPTX with correct typography.
  The PDF already embeds them.

## Rebuild
```bash
pip install python-pptx lxml pillow
git clone https://github.com/likaku/Mck-ppt-design-skill ~/.claude/skills/mck-ppt-design
python3 build_deck.py
```
