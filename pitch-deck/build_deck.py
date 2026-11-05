"""
SuperState founder pitch deck — builder.

Built on MckEngine (mck-ppt-design skill) for slide creation, cleanup and QA,
re-skinned to the SuperState Brand Identity Guidelines (06.05.2026):
  Deep Knowing #003399 + White (60%) · Root State #207e59 + Black (30%)
  Emerge #33cc99 / First Light #e6ff80 accents (8%) · Unlock/Signal reserved (2%)
  Headings: Lora SemiBold · Body: Bricolage Grotesque Medium

Run:  python3 build_deck.py   ->  SuperState_Pitch_Deck.pptx
"""
import os
import sys

sys.path.insert(0, os.path.expanduser('~/.claude/skills/mck-ppt-design'))

from PIL import Image, ImageFont
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

from mck_ppt import MckEngine
from mck_ppt.core import _clean_shape

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, 'assets')
BUILD = os.path.join(HERE, 'build')
os.makedirs(BUILD, exist_ok=True)

# ── Brand tokens ────────────────────────────────────────────────────────────
BLUE = RGBColor(0x00, 0x33, 0x99)      # Deep Knowing
ROOT = RGBColor(0x20, 0x7E, 0x59)      # Root State
EMERGE = RGBColor(0x33, 0xCC, 0x99)    # Emerge
LIGHT = RGBColor(0xE6, 0xFF, 0x80)     # First Light
INK = RGBColor(0x00, 0x00, 0x00)       # Truth black
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GREY = RGBColor(0x5F, 0x63, 0x6B)
MINT = RGBColor(0xF9, 0xFF, 0xF0)      # site background
MINT_LINE = RGBColor(0xD1, 0xE8, 0xC4)
BLUE_SOFT = RGBColor(0xB8, 0xC8, 0xF0)

HEAD = 'Lora SemiBold'
BODY = 'Bricolage Grotesque Medium'
BODY_B = 'Bricolage Grotesque SemiBold'

FONT_FILES = {
    HEAD: os.path.expanduser('~/.fonts/ttf/lora-latin-600-normal.ttf'),
    BODY: os.path.expanduser('~/.fonts/ttf/bricolage-grotesque-latin-500-normal.ttf'),
    BODY_B: os.path.expanduser('~/.fonts/ttf/bricolage-grotesque-latin-600-normal.ttf'),
}

SW, SH = 13.333, 7.5
LM = 0.8
TOTAL = 16


# ── Low-level helpers ───────────────────────────────────────────────────────
def text_w(text, font, size):
    """Rendered width of a single line, in inches."""
    path = FONT_FILES.get(font)
    if path and os.path.exists(path):
        f = ImageFont.truetype(path, 200)
        return f.getlength(text) / 200 * size / 72
    return len(text) * size * 0.55 / 72


def rect(s, x, y, w, h, fill=None, line=None, lw=1.0, shape=MSO_SHAPE.RECTANGLE, radius=None):
    shp = s.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill is None:
        shp.fill.background()
    else:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        shp.line.width = Pt(lw)
    if radius is not None and shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        shp.adjustments[0] = radius
    _clean_shape(shp)
    return shp


def text(s, x, y, w, h, paras, size=16, font=BODY, color=INK, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.TOP, spacing=1.18, space_after=0):
    """paras: str | list[str | list[(text, {font,color,size})]]"""
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    body = tf._txBody.find(qn('a:bodyPr'))
    body.set('anchor', {MSO_ANCHOR.MIDDLE: 'ctr', MSO_ANCHOR.BOTTOM: 'b'}.get(anchor, 't'))
    for a in ('lIns', 'tIns', 'rIns', 'bIns'):
        body.set(a, '0')
    if isinstance(paras, str):
        paras = [paras]
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        p.space_after = Pt(space_after)
        runs = para if isinstance(para, list) else [(para, {})]
        for rt, ov in runs:
            r = p.add_run()
            r.text = rt
            r.font.name = ov.get('font', font)
            r.font.size = Pt(ov.get('size', size))
            r.font.color.rgb = ov.get('color', color)
            r.font.bold = False
            r.font.italic = ov.get('italic', False)
    return tb


def headline(s, x, y, lines, size=40, color=BLUE, hl=None, hl_color=LIGHT, hl_text=None):
    """One textbox per line so highlighter bars can be placed exactly.
    hl: {line_index: phrase} — phrase gets a First Light marker stroke behind it."""
    hl = hl or {}
    lh = size * 1.22 / 72
    for i, ln in enumerate(lines):
        ly = y + i * lh
        if i in hl:
            phrase = hl[i]
            start = ln.find(phrase)
            px = x + text_w(ln[:start], HEAD, size)
            pw = text_w(phrase, HEAD, size)
            rect(s, px - 0.06, ly + lh * 0.50, pw + 0.12, lh * 0.40, fill=hl_color)
        tcol = hl_text if (i in hl and hl_text is not None) else color
        text(s, x, ly, 12.0 - (x - LM), lh, ln, size=size, font=HEAD, color=tcol, spacing=1.0)
    return y + lh * len(lines)


def picture(s, path, x, y, w, h, mode='fill'):
    """mode='fill' crops to fill the box; mode='fit' letterboxes inside it."""
    iw, ih = Image.open(path).size
    box, img = w / h, iw / ih
    if mode == 'fit':
        if img > box:
            nh = w / img
            return s.shapes.add_picture(path, Inches(x), Inches(y + (h - nh) / 2), Inches(w), Inches(nh))
        nw = h * img
        return s.shapes.add_picture(path, Inches(x + (w - nw) / 2), Inches(y), Inches(nw), Inches(h))
    pic = s.shapes.add_picture(path, Inches(x), Inches(y), Inches(w), Inches(h))
    if img > box:
        c = (1 - box / img) / 2
        pic.crop_left, pic.crop_right = c, c
    else:
        c = (1 - img / box) / 2
        pic.crop_top, pic.crop_bottom = c, c
    return pic


def kicker(s, label, dark=False, x=LM, y=0.62):
    text(s, x, y, min(8, SW - LM - x), 0.3, label.upper(), size=12, font=BODY_B, color=EMERGE if dark else ROOT)


def footer(s, n, dark=False, x=LM, logo=True, num_right=SW - LM):
    if logo:
        path = os.path.join(ASSETS, 'logo_white.png' if dark else 'logo_blue.png')
        s.shapes.add_picture(path, Inches(x), Inches(6.98), height=Inches(0.22))
    text(s, num_right - 1.0, 7.0, 1.0, 0.25, f'{n:02d} / {TOTAL}', size=10, font=BODY,
         color=BLUE_SOFT if dark else GREY, align=PP_ALIGN.RIGHT)


def source(s, txt, dark=False, x=LM, w=9.6):
    text(s, x, 6.62, w, 0.3, txt, size=9, font=BODY, color=BLUE_SOFT if dark else GREY)


def bg(s, color):
    rect(s, 0, 0, SW, SH, fill=color)


def make_logo_backdrop():
    """Brand-deck style backdrop: giant Emerge crop of the 'rs' ligature on Deep Knowing."""
    out = os.path.join(BUILD, 'backdrop.png')
    W, H = 2400, 1350
    canvas = Image.new('RGB', (W, H), (0, 51, 153))
    logo = Image.open(os.path.join(ASSETS, 'logo_emerge.png'))
    scale = 6.0
    big = logo.resize((int(logo.width * scale), int(logo.height * scale)), Image.LANCZOS)
    # anchor the 'rs' ligature (~x 0.44–0.63 of the wordmark) on the left of the canvas
    ox = -int(big.width * 0.415)
    oy = -int(big.height * 0.12)
    canvas.paste(big, (ox, oy), big)
    canvas.save(out, quality=92)
    return out


# ── Deck ────────────────────────────────────────────────────────────────────
def build():
    eng = MckEngine(total_slides=TOTAL)
    backdrop = make_logo_backdrop()
    n = 0

    def new():
        nonlocal n
        n += 1
        return eng._ns()

    # 1 · Cover ──────────────────────────────────────────────────────────────
    s = new()
    s.shapes.add_picture(backdrop, 0, 0, Inches(SW), Inches(SH))
    rect(s, 7.35, 0, SW - 7.35, SH, fill=BLUE)
    s.shapes.add_picture(os.path.join(ASSETS, 'logo_white.png'), Inches(7.95), Inches(2.35), width=Inches(4.6))
    text(s, 7.95, 3.75, 4.8, 0.6, 'Health, simplified.', size=30, font=HEAD, color=WHITE)
    text(s, 7.95, 4.45, 4.8, 0.8, 'Founder deck · November 2026', size=16, font=BODY, color=BLUE_SOFT)
    rect(s, 7.95, 5.25, 0.9, 0.06, fill=EMERGE)
    text(s, 7.95, 5.45, 4.8, 0.4, 'Georgy Varghese, Founder', size=14, font=BODY, color=WHITE)

    # 2 · Welcome / one-liner ───────────────────────────────────────────────
    s = new()
    s.shapes.add_picture(os.path.join(ASSETS, 'logo_blue.png'), Inches((SW - 5.6) / 2), Inches(1.85), width=Inches(5.6))
    line = 'we make health simple in a world that makes it complicated.'
    lw = text_w(line, HEAD, 26)
    lx = (SW - lw) / 2
    hl_phrase = 'health simple'
    px = lx + text_w(line[:line.find(hl_phrase)], HEAD, 26)
    rect(s, px - 0.05, 3.88, text_w(hl_phrase, HEAD, 26) + 0.1, 0.2, fill=LIGHT)
    text(s, 0.5, 3.6, SW - 1.0, 0.6, line, size=26, font=HEAD, color=BLUE, align=PP_ALIGN.CENTER)
    text(s, 2.2, 4.55, SW - 4.4, 0.9,
         'A modern health & wellness brand built on quality, transparency and evidence, '
         'starting with Sleep Well: coffee, but for sleep.',
         size=17, font=BODY, color=GREY, align=PP_ALIGN.CENTER, spacing=1.25)
    footer(s, n, logo=False)

    # 3 · Founder story ──────────────────────────────────────────────────────
    s = new()
    picture(s, os.path.join(ASSETS, 'georgy.jpg'), 0, 0, 4.9, SH)
    X = 5.55
    kicker(s, 'Why SuperState', x=X)
    y = headline(s, X, 1.0, ['It started with', 'my own health.'], size=40, hl={1: 'my own health.'})
    text(s, X, y + 0.3, 6.9, 1.6,
         ['Weight, skin, recovery, performance. The more I read about nutrition and supplements, '
          'the more questions I had. Every product made a different promise, and separating useful '
          'evidence from marketing took a huge amount of time and effort.'],
         size=16, color=INK, spacing=1.3)
    rect(s, X, 4.35, 0.07, 1.55, fill=EMERGE)
    text(s, X + 0.35, 4.3, 6.5, 1.6,
         '“If I found this confusing while actively researching it, how hard must it be for someone '
         'who simply wants to take better care of themselves?”',
         size=19, font=HEAD, color=BLUE, spacing=1.25)
    text(s, X + 0.35, 6.05, 6, 0.3, 'Georgy Varghese · Founder, SuperState', size=12, font=BODY_B, color=ROOT)
    footer(s, n, x=X)

    # 4 · Problem ────────────────────────────────────────────────────────────
    s = new()
    kicker(s, 'The problem')
    headline(s, LM, 1.0, ["People don't lack interest in their health.", 'They lack a simple, reliable way to decide.'],
             size=34, hl={1: 'a simple, reliable way to decide.'})
    cards = [
        ('01', 'Awareness', 'People want to be healthier, but don’t know which nutritional needs matter '
                            'to them, or where supplements fit in.'),
        ('02', 'Trust', 'Big claims on the front, but no easy way to verify ingredient quality, dose, '
                        'sourcing, or the evidence behind them.'),
        ('03', 'Uncertainty', 'Benefits are gradual and vary from person to person, so people are left '
                              'wondering whether it’s working at all.'),
    ]
    cw, gap, cy = 3.72, 0.285, 2.85
    for i, (num, ttl, body) in enumerate(cards):
        cx = LM + i * (cw + gap)
        rect(s, cx, cy, cw, 2.95, fill=WHITE, line=EMERGE, lw=1.5, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
        text(s, cx + 0.35, cy + 0.3, 1.5, 0.6, num, size=30, font=HEAD, color=ROOT)
        text(s, cx + 0.35, cy + 0.95, cw - 0.7, 0.45, ttl, size=22, font=BODY_B, color=BLUE)
        text(s, cx + 0.35, cy + 1.5, cw - 0.7, 1.4, body, size=14.5, color=INK, spacing=1.28)
    text(s, LM, 5.98, 11.7, 0.62,
         'Brands should take responsibility for making this easier, rather than expecting every customer '
         'to become a nutrition expert.', size=15, font=BODY_B, color=ROOT)  # noqa
    footer(s, n)

    # 5 · How the category works today (dark) ───────────────────────────────
    s = new()
    bg(s, BLUE)
    kicker(s, 'How the category works today', dark=True)
    headline(s, LM, 1.0, ['Big on the front.', 'Pixie dust inside.'], size=44, color=WHITE,
             hl={1: 'Pixie dust inside.'}, hl_color=EMERGE)
    tricks = [
        ('Pixie-dusted doses', 'A pinch of a hero ingredient, printed big on the pack.'),
        ('Cheapest forms', 'The least expensive version, sold at a premium.'),
        ('Hidden blends', 'Real amounts buried in a “proprietary blend”.'),
        ('Fine print', 'A label nobody has time to actually read.'),
    ]
    ty = 3.3
    for ttl, body in tricks:
        rect(s, LM, ty + 0.08, 0.26, 0.26, line=EMERGE, lw=1.5, shape=MSO_SHAPE.OVAL)
        text(s, LM, ty + 0.06, 0.26, 0.3, '×', size=13, font=BODY_B, color=EMERGE, align=PP_ALIGN.CENTER)
        text(s, LM + 0.5, ty, 6.0, 0.35, ttl, size=17, font=BODY_B, color=WHITE)
        text(s, LM + 0.5, ty + 0.38, 6.0, 0.4, body, size=13.5, color=BLUE_SOFT)
        ty += 0.84
    rect(s, 7.45, 3.35, 0.07, 2.35, fill=LIGHT)
    text(s, 7.8, 3.3, 4.8, 2.0,
         '“They’re not betting on you being foolish. They’re betting on you being tired.”',
         size=26, font=HEAD, color=WHITE, spacing=1.2)
    text(s, 7.8, 5.35, 4.8, 0.3, 'That’s the part that made us angry.', size=14, font=BODY_B, color=EMERGE)
    footer(s, n, dark=True)

    # 6 · Solution ───────────────────────────────────────────────────────────
    s = new()
    kicker(s, 'Our approach')
    headline(s, LM, 1.0, ['We do the homework,', 'so you don’t have to.'], size=42, hl={1: 'so you don’t have to.'})
    pillars = [
        (BLUE, 'Transparent', ['Every dose on the label.', 'Zero proprietary blends.', 'Forms we can explain, in plain words.']),
        (ROOT, 'Honest about evidence', ['Research on an ingredient isn’t proof for a finished formula.',
                                         'We say which is which, limitations included.']),
        (EMERGE, 'Enjoyable', ['Functional nutrition built into rituals people look forward to,',
                               'not pills they forget to take.']),
    ]
    pw, pg, py = 3.72, 0.285, 3.25
    for i, (col, ttl, pts) in enumerate(pillars):
        px = LM + i * (pw + pg)
        rect(s, px, py, pw, 0.08, fill=col)
        text(s, px, py + 0.3, pw, 0.45, ttl, size=22, font=HEAD, color=BLUE)
        text(s, px, py + 0.95, pw - 0.2, 2.0, [' '.join(pts)], size=15, color=INK, spacing=1.32)
    footer(s, n)

    # 7 · Product ────────────────────────────────────────────────────────────
    s = new()
    shot = os.path.join(ASSETS, 'packshot_box_pouch.jpg')
    r, g, b = Image.open(shot).convert('RGB').getpixel((8, 8))
    rect(s, 6.75, 0, SW - 6.75, SH, fill=RGBColor(r, g, b))
    picture(s, shot, 6.95, 0.55, SW - 7.15, 6.4, mode='fit')
    kicker(s, 'Our first product')
    y = headline(s, LM, 1.0, ['Sleep Well.', 'Coffee, but for sleep.'], size=40, hl={1: 'Coffee, but for sleep.'})
    text(s, LM, y + 0.3, 5.6, 1.3,
         'A ready-to-mix dark chocolate drink for your evenings. Stir into hot water, sip it 30 minutes '
         'before bed, and let it become your wind-down cue.', size=16, color=INK, spacing=1.3)
    chips = ['Real organic cacao base', 'No melatonin, no hormones', '7 ingredients, every dose listed', '30 min before bed']
    for i, c in enumerate(chips):
        cx, cy = LM + (i % 2) * 2.85, 4.4 + (i // 2) * 0.68
        rect(s, cx, cy, 2.7, 0.52, fill=MINT, line=MINT_LINE, lw=1, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
        text(s, cx, cy, 2.7, 0.52, c, size=12.5, font=BODY_B, color=BLUE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(s, LM, 5.95, 5.6, 0.6,
         [[('Why sleep first? ', {'font': BODY_B, 'color': ROOT}),
           ('It underpins recovery, focus and well-being, yet a consistent night routine is hard to build.', {})]],
         size=13, color=GREY, spacing=1.25)
    footer(s, n)

    # 8 · What's inside ──────────────────────────────────────────────────────
    s = new()
    kicker(s, 'What’s inside')
    headline(s, LM, 1.0, ['The whole recipe.', 'No secrets.'], size=38, hl={1: 'No secrets.'})
    stats = [('7', 'ingredients'), ('0', 'proprietary blends'), ('0 mg', 'melatonin')]
    for i, (big, lbl) in enumerate(stats):
        sx = 6.55 + i * 2.0
        text(s, sx, 1.1, 1.9, 0.7, big, size=36, font=HEAD, color=ROOT)
        text(s, sx, 1.8, 1.9, 0.3, lbl, size=12, font=BODY_B, color=GREY)
    ingredients = [
        ('cocoa_powder_watchglass.png', 'Organic raw cacao', 3000, 'The base. Real dark chocolate that makes bedtime a treat.'),
        ('glycine_watchglass.png', 'Glycine', 3000, 'An amino acid that helps your body ease into wind-down mode.'),
        ('magnesium_threonate_watchglass.png', 'Magnesium L-threonate', 2000, 'The calm-mind magnesium.'),
        ('magnesium_bisglycinate_watchglass.png', 'Magnesium bisglycinate', 1000, 'The relaxed-body magnesium.'),
        ('tart_cherry_watchglass.png', 'Tart cherry extract', 500, 'A natural night-time partner for the rest of the mix.'),
        ('l_theanine_leaves_watchglass.png', 'L-theanine', 200, 'Calm, not drowsy. Turns down the mental chatter.'),
        ('apigenin_watchglass.png', 'Apigenin', 50, 'The chamomile compound that cues it’s time to switch off.'),
    ]
    ry, rh = 2.42, 0.6
    rect(s, LM, ry - 0.08, SW - 2 * LM, 0.012, fill=MINT_LINE)
    for img, name, mg, job in ingredients:
        picture(s, os.path.join(ASSETS, img), LM, ry + 0.04, 0.48, 0.48)
        text(s, LM + 0.7, ry + 0.06, 2.9, 0.45, name, size=14.5, font=BODY_B, color=BLUE, anchor=MSO_ANCHOR.MIDDLE)
        text(s, 4.2, ry + 0.06, 4.7, 0.45, job, size=12, color=INK, anchor=MSO_ANCHOR.MIDDLE)
        bw = max(2.1 * mg / 3000, 0.05)
        rect(s, 9.1, ry + 0.2, 2.1, 0.16, fill=MINT)
        rect(s, 9.1, ry + 0.2, bw, 0.16, fill=ROOT)
        text(s, 11.3, ry + 0.06, 1.23, 0.45, f'{mg:,} mg', size=13, font=HEAD, color=BLUE,
             align=PP_ALIGN.RIGHT, anchor=MSO_ANCHOR.MIDDLE)
        rect(s, LM, ry + rh - 0.02, SW - 2 * LM, 0.012, fill=MINT_LINE)
        ry += rh
    source(s, 'Per sachet, as listed on superstate.in. Food product; not intended to diagnose, treat, cure or prevent any disease.')
    footer(s, n)

    # 9 · The ritual ─────────────────────────────────────────────────────────
    s = new()
    picture(s, os.path.join(ASSETS, 'sleep-well-sachets-real.jpg'), 8.75, 0, SW - 8.75, SH)
    kicker(s, 'The ritual')
    headline(s, LM, 1.0, ['Not another pill to remember.', 'A ritual to look forward to.'], size=34,
             hl={1: 'A ritual to look forward to.'})
    steps = [
        ('9:30 pm', 'Rip it.', 'Tear open one sachet. That’s one serving.'),
        ('9:31 pm', 'Stir it.', 'Into hot water, or milk if you like it creamier.'),
        ('9:35 pm', 'Sip it slow.', 'Lights low, phone face-down.'),
        ('10:00 pm', 'Lights out.', 'Same time tomorrow?'),
    ]
    sy = 2.75
    rect(s, LM + 0.11, sy + 0.25, 0.02, 3.3, fill=MINT_LINE)
    for t, ttl, body in steps:
        rect(s, LM, sy + 0.14, 0.24, 0.24, fill=BLUE if t != '10:00 pm' else ROOT, shape=MSO_SHAPE.OVAL)
        text(s, LM + 0.5, sy + 0.05, 1.6, 0.45, t, size=20, font=HEAD, color=BLUE)
        text(s, LM + 2.2, sy + 0.06, 5.5, 0.4, ttl, size=17, font=BODY_B, color=INK)
        text(s, LM + 2.2, sy + 0.45, 5.5, 0.4, body, size=13.5, color=GREY)
        sy += 0.98
    footer(s, n, num_right=8.45)

    # 10 · Transparency beyond the label ────────────────────────────────────
    s = new()
    kicker(s, 'Our differentiation')
    headline(s, LM, 1.0, ['Transparency', 'beyond the label.'], size=40, hl={1: 'beyond the label.'})
    text(s, 7.0, 1.2, 5.5, 1.3,
         'Transparency isn’t a marketing message. It’s how we build products, and how we build our '
         'relationship with customers.', size=15.5, color=INK, spacing=1.32)
    rows = [
        ('What’s in it', 'Every ingredient and every dose on the pack. No proprietary blends.', 'Live'),
        ('Why it’s there', 'A plain-language “job” for every ingredient, with where it comes from.', 'Live'),
        ('How it’s verified', 'Quality-testing information, including batch-specific reports where appropriate.', 'Building'),
        ('What the evidence says', 'A clear line between ingredient research and evidence for our finished formula, '
                                   'limitations included.', 'Roadmap'),
    ]
    ry = 3.05
    for q, a, st in rows:
        rect(s, LM, ry, SW - 2 * LM, 0.012, fill=MINT_LINE)
        text(s, LM, ry + 0.2, 3.0, 0.5, q, size=17, font=HEAD, color=BLUE, anchor=MSO_ANCHOR.MIDDLE)
        text(s, 4.0, ry + 0.2, 6.7, 0.5, a, size=14, color=INK, anchor=MSO_ANCHOR.MIDDLE, spacing=1.2)
        fill, tc, ln = {'Live': (ROOT, WHITE, None), 'Building': (LIGHT, BLUE, None), 'Roadmap': (WHITE, BLUE, BLUE)}[st]
        rect(s, 11.33, ry + 0.25, 1.2, 0.4, fill=fill, line=ln, lw=1, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
        text(s, 11.33, ry + 0.25, 1.2, 0.4, st, size=12, font=BODY_B, color=tc, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        ry += 0.86
    rect(s, LM, ry, SW - 2 * LM, 0.012, fill=MINT_LINE)
    footer(s, n)

    # 11 · Measuring outcomes ────────────────────────────────────────────────
    s = new()
    kicker(s, 'Measuring outcomes')
    headline(s, LM, 1.0, ['Better questions than', '“did you like it?”'], size=40, hl={1: '“did you like it?”'})
    loop = [('Product\ndevelopment', BLUE), ('Quality\nverification', ROOT), ('Customer\nfeedback', EMERGE)]
    bw_, bh_, bx, by = 2.0, 1.15, LM, 3.2
    for i, (lbl, col) in enumerate(loop):
        x = bx + i * (bw_ + 0.55)
        rect(s, x, by, bw_, bh_, fill=col, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
        text(s, x, by, bw_, bh_, lbl.split('\n'), size=15, font=BODY_B, color=WHITE,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, spacing=1.1)
        if i < 2:
            text(s, x + bw_, by, 0.55, bh_, '→', size=24, font=BODY_B, color=BLUE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    # return path
    span = 3 * bw_ + 2 * 0.55
    rect(s, bx + bw_ / 2, by + bh_, 0.02, 0.45, fill=BLUE)
    rect(s, bx + span - bw_ / 2, by + bh_, 0.02, 0.45, fill=BLUE)
    rect(s, bx + bw_ / 2, by + bh_ + 0.45, span - bw_, 0.02, fill=BLUE)
    text(s, bx, by + bh_ + 0.55, span, 0.35, 'each informs the other, batch after batch',
         size=12.5, font=BODY_B, color=BLUE, align=PP_ALIGN.CENTER)
    RX = 8.7
    text(s, RX, 2.95, 3.85, 0.35, 'For Sleep Well, we can look at', size=15, font=BODY_B, color=BLUE)
    for i, t in enumerate(['Sleep diaries', 'Structured customer feedback', 'Data from sleep-tracking devices']):
        rect(s, RX, 3.5 + i * 0.5 + 0.1, 0.12, 0.12, fill=EMERGE, shape=MSO_SHAPE.OVAL)
        text(s, RX + 0.3, 3.5 + i * 0.5, SW - LM - RX - 0.3, 0.48, t, size=14.5, color=INK)
    rect(s, LM, 5.45, SW - 2 * LM, 0.95, fill=MINT, line=MINT_LINE, lw=1, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
    text(s, LM + 0.35, 5.45, SW - 2 * LM - 0.7, 0.95,
         [[('Honest caveat: ', {'font': BODY_B, 'color': ROOT}),
           ('these signals alone can’t prove a supplement caused an improvement. We keep customer observations '
            'separate from scientifically established results, and build stronger evidence on finished products '
            'where it’s practical and justified.', {})]],
         size=13.5, color=INK, anchor=MSO_ANCHOR.MIDDLE, spacing=1.25)
    footer(s, n)

    # 12 · Business model ───────────────────────────────────────────────────
    s = new()
    kicker(s, 'Business model')
    headline(s, LM, 1.0, ['Direct to consumer,', 'priced as a daily habit.'], size=38, hl={1: 'a daily habit.'})
    packs = [
        ('Pack of 5', '₹299', '₹239 at launch', '≈ ₹48 / night', False),
        ('Pack of 15', '₹900', '₹720 at launch', '≈ ₹48 / night', False),
        ('Pack of 30', '₹1,500', '₹1,200 at launch', '≈ ₹40 / night + gift', True),
    ]
    pw, pg, py = 2.42, 0.22, 2.95
    for i, (name, mrp, launch, per, hero) in enumerate(packs):
        px = LM + i * (pw + pg)
        fill, tc, sc = (BLUE, WHITE, BLUE_SOFT) if hero else (WHITE, BLUE, GREY)
        rect(s, px, py, pw, 3.0, fill=fill, line=None if hero else MINT_LINE, lw=1.25,
             shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
        if hero:
            rect(s, px + 0.3, py + 0.25, 1.25, 0.32, fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
            text(s, px + 0.3, py + 0.25, 1.25, 0.32, 'best value', size=11, font=BODY_B, color=BLUE,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        text(s, px + 0.3, py + 0.75, pw - 0.6, 0.35, name, size=15, font=BODY_B, color=tc)
        text(s, px + 0.3, py + 1.15, pw - 0.6, 0.7, mrp, size=34, font=HEAD, color=tc)
        text(s, px + 0.3, py + 1.95, pw - 0.6, 0.3, launch, size=12.5, color=sc)
        text(s, px + 0.3, py + 2.3, pw - 0.45, 0.55, per, size=13, font=BODY_B, color=EMERGE if hero else ROOT)
    RX = 9.0
    text(s, RX, 2.95, 3.5, 0.35, 'How we sell', size=15, font=BODY_B, color=BLUE)
    model = [
        ('Own D2C store', 'UPI & cards via Razorpay'),
        ('Free shipping', 'across India'),
        ('Creator-led growth', 'creator codes: 30% off + gift'),
        ('Real-human support', 'on WhatsApp and email'),
    ]
    for i, (a, b) in enumerate(model):
        yy = 3.45 + i * 0.64
        text(s, RX, yy, 3.6, 0.3, a, size=14, font=BODY_B, color=INK)
        text(s, RX, yy + 0.28, 3.6, 0.3, b, size=12.5, color=GREY)
    source(s, 'MRP inclusive of taxes. Launch pricing = 20% off for everyone (code FIRSTNIGHT20). Source: superstate.in.')
    footer(s, n)

    # 13 · Early traction ───────────────────────────────────────────────────
    s = new()
    kicker(s, 'Early traction')
    y = headline(s, LM, 1.0, ['Batch 01 sold out.', 'Batch 02 is shipping.'], size=36, hl={0: 'sold out.'})
    text(s, LM, y + 0.3, 4.6, 1.3,
         'Customers cleared our first batch faster than we planned. We took notes, made it better, '
         'and restocked.', size=15.5, color=INK, spacing=1.3)
    rect(s, LM, 4.45, 4.6, 1.6, fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
    text(s, LM + 0.3, 4.6, 4.0, 1.4,
         [[('Founder to add: ', {'font': BODY_B})],
          'units sold · repeat-purchase rate · CAC by channel · average rating'],
         size=13.5, color=BLUE, spacing=1.3)
    creators = ['hridya', 'abhimanyu', 'shreya', 'shanavas']
    cw, cg, cy = 1.6, 0.17, 1.1
    ch = cw * 16 / 9
    for i, c in enumerate(creators):
        cx = 5.85 + i * (cw + cg)
        picture(s, os.path.join(ASSETS, f'creator_{c}.jpg'), cx, cy, cw, ch)
        text(s, cx, cy + ch + 0.12, cw, 0.3, c.capitalize(), size=12.5, font=BODY_B, color=BLUE)
    text(s, 5.85, cy + ch + 0.45, 6.9, 0.3, 'Creators we sent Sleep Well to, reviewing it in their own words.',
         size=12, color=GREY)
    source(s, 'Source: superstate.in launch page; creator reels hosted on the product page.')
    footer(s, n)

    # 14 · Where we play ────────────────────────────────────────────────────
    s = new()
    kicker(s, 'Where we play')
    headline(s, LM, 1.0, ['Fully transparent', 'and genuinely enjoyable.'], size=36, hl={1: 'genuinely enjoyable.'})
    gx, gy, gw, gh = 1.35, 2.6, 6.4, 3.45
    rect(s, gx, gy, gw, gh, fill=MINT)
    rect(s, gx + gw / 2, gy, 0.015, gh, fill=MINT_LINE)
    rect(s, gx, gy + gh / 2, gw, 0.015, fill=MINT_LINE)
    rect(s, gx, gy + gh, gw, 0.02, fill=GREY)
    rect(s, gx, gy, 0.02, gh, fill=GREY)
    text(s, gx, gy + gh + 0.08, gw, 0.3, 'Hidden doses  →  every dose disclosed', size=11.5, font=BODY_B,
         color=GREY, align=PP_ALIGN.CENTER)
    vt = text(s, gx - 2.15, gy + gh / 2 - 0.25, 3.85, 0.45, 'Feels like a chore  →  feels like a ritual', size=11.5,
              font=BODY_B, color=GREY, align=PP_ALIGN.CENTER)
    vt.rotation = -90
    pts = [
        (0.24, 0.78, 'Proprietary-blend sleep supplements', GREY),
        (0.76, 0.76, 'Single-ingredient capsules & tablets', GREY),
        (0.22, 0.25, 'Herbal sleep teas & wellness drinks', GREY),
        (0.32, 0.50, 'Melatonin gummies', GREY),
    ]
    for fx, fy, lbl, col in pts:
        cx, cy = gx + fx * gw, gy + fy * gh
        rect(s, cx - 0.08, cy - 0.08, 0.16, 0.16, fill=col, shape=MSO_SHAPE.OVAL)
        text(s, cx - 1.3, cy + 0.12, 2.6, 0.5, lbl, size=11.5, color=INK, align=PP_ALIGN.CENTER, spacing=1.1)
    sx, sy = gx + 0.83 * gw, gy + 0.2 * gh
    rect(s, sx - 0.17, sy - 0.17, 0.34, 0.34, fill=BLUE, shape=MSO_SHAPE.OVAL)
    rect(s, sx - 1.0, sy + 0.25, 2.0, 0.36, fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
    text(s, sx - 1.0, sy + 0.25, 2.0, 0.36, 'SuperState Sleep Well', size=11.5, font=BODY_B, color=BLUE,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    RX = 8.45
    text(s, RX, 2.75, 4.1, 0.35, 'Our edge', size=17, font=HEAD, color=BLUE)
    edges = [
        ('Full disclosure', 'Every dose on the label, no melatonin, forms we can explain.'),
        ('A ritual format', 'A warm dark chocolate drink people look forward to, which drives a daily habit.'),
        ('Built to be questioned', '“Don’t trust us blindly.” We invite customers to scrutinise our label and doses.'),
    ]
    for i, (a, b) in enumerate(edges):
        yy = 3.3 + i * 1.0
        rect(s, RX, yy + 0.04, 0.06, 0.8, fill=EMERGE)
        text(s, RX + 0.25, yy, 3.9, 0.3, a, size=14, font=BODY_B, color=INK)
        text(s, RX + 0.25, yy + 0.32, 3.9, 0.6, b, size=12.5, color=GREY, spacing=1.2)
    source(s, 'Illustrative positioning of product categories, not of specific brands.')
    footer(s, n)

    # 15 · Vision ────────────────────────────────────────────────────────────
    s = new()
    kicker(s, 'The long-term vision')
    headline(s, LM, 1.0, ['Sleep Well is just', 'the beginning.'], size=40, hl={1: 'the beginning.'})
    stairs = [
        ('Now', 'Sleep Well', 'Prove the ritual and the transparency model.', EMERGE, BLUE),
        ('Next', 'Evidence & verification', 'Batch reports and finished-formula testing, shared honestly.', ROOT, WHITE),
        ('Then', 'More everyday needs', 'New products for everyday health, same principles.', BLUE, WHITE),
        ('Long term', 'The health brand people trust', 'Health made simpler, more transparent, more enjoyable.', RGBColor(0x00, 0x26, 0x73), WHITE),
    ]
    sw_, sg_, base = 2.8, 0.17, 6.35
    for i, (tag, ttl, body, col, tc) in enumerate(stairs):
        h = 1.55 + i * 0.5
        x = LM + i * (sw_ + sg_)
        rect(s, x, base - h, sw_, h, fill=col)
        text(s, x + 0.25, base - h + 0.18, sw_ - 0.5, 0.3, tag.upper(), size=11, font=BODY_B, color=tc)
        text(s, x + 0.25, base - h + 0.45, sw_ - 0.5, 0.6, ttl, size=16, font=HEAD, color=tc, spacing=1.05)
        text(s, x + 0.25, base - h + 0.95 + (0.25 if len(ttl) > 22 else 0), sw_ - 0.5, 0.7, body, size=12, color=tc, spacing=1.2)
    text(s, 7.3, 1.2, 5.2, 1.0,
         [[('Every product, same principles: ', {'font': BODY_B, 'color': ROOT}),
           ('quality, transparency, evidence and a better experience.', {})]],
         size=15, color=INK, spacing=1.3)
    footer(s, n)

    # 16 · Close ─────────────────────────────────────────────────────────────
    s = new()
    s.shapes.add_picture(backdrop, 0, 0, Inches(SW), Inches(SH))
    rect(s, 6.1, 0, SW - 6.1, SH, fill=BLUE)
    text(s, 6.7, 1.3, 6.0, 3.2,
         '“I want us to build a brand that doesn’t just sell products, but helps people feel more confident '
         'about the choices they make for their health.”', size=25, font=HEAD, color=WHITE, spacing=1.22)
    text(s, 6.7, 4.35, 6.0, 0.3, 'Georgy Varghese · Founder', size=14, font=BODY_B, color=EMERGE)
    rect(s, 6.7, 5.0, 0.9, 0.05, fill=LIGHT)
    text(s, 6.7, 5.25, 6.0, 1.2,
         ['superstate.in  ·  support@superstate.in',
          'Instagram @superstate.in  ·  WhatsApp +91 95673 09388'],
         size=13.5, color=WHITE, spacing=1.45)
    s.shapes.add_picture(os.path.join(ASSETS, 'logo_white.png'), Inches(6.7), Inches(6.55), height=Inches(0.42))

    assert n == TOTAL, (n, TOTAL)
    out = os.path.join(HERE, 'SuperState_Pitch_Deck.pptx')
    eng.save(out)
    print('saved', out)


if __name__ == '__main__':
    build()
