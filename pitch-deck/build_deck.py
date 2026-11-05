"""
SuperState founder story deck — builder (v2, bold-brand / Airbnb-simple).

One idea per slide, big Lora headlines, Deep Knowing blue + white, First Light
highlighter strokes, the new Sleep Well packshots as the only photography.
The founder script lives in each slide's speaker notes.

Built on MckEngine (mck-ppt-design skill) for slide creation, cleanup and QA,
styled to the SuperState Brand Identity Guidelines (06.05.2026).

Run:  python3 build_deck.py   ->  SuperState_Pitch_Deck.pptx
"""
import os
import sys

sys.path.insert(0, os.path.expanduser('~/.claude/skills/mck-ppt-design'))

from PIL import Image, ImageFilter, ImageFont
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
INK = RGBColor(0x00, 0x00, 0x00)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GREY = RGBColor(0x55, 0x5B, 0x66)
SOFT = RGBColor(0xC2, 0xD0, 0xF2)      # body text on blue
MINT = RGBColor(0xF9, 0xFF, 0xF0)
LINE = RGBColor(0xD1, 0xE8, 0xC4)

HEAD = 'Lora SemiBold'
BODY = 'Bricolage Grotesque Medium'
BODY_B = 'Bricolage Grotesque SemiBold'
FONT_FILES = {
    HEAD: os.path.expanduser('~/.fonts/ttf/lora-latin-600-normal.ttf'),
    BODY: os.path.expanduser('~/.fonts/ttf/bricolage-grotesque-latin-500-normal.ttf'),
    BODY_B: os.path.expanduser('~/.fonts/ttf/bricolage-grotesque-latin-600-normal.ttf'),
}

SW, SH = 13.333, 7.5
LM = 0.9
TOTAL = 15


# ── Helpers ─────────────────────────────────────────────────────────────────
def text_w(t, font, size):
    path = FONT_FILES.get(font)
    if path and os.path.exists(path):
        return ImageFont.truetype(path, 200).getlength(t) / 200 * size / 72
    return len(t) * size * 0.55 / 72


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
    if radius is not None:
        shp.adjustments[0] = radius
    _clean_shape(shp)
    return shp


def text(s, x, y, w, h, paras, size=20, font=BODY, color=INK, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.TOP, spacing=1.15):
    """paras: str | list[str | list[(text, overrides)]]"""
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    body = tf._txBody.find(qn('a:bodyPr'))
    body.set('anchor', {MSO_ANCHOR.MIDDLE: 'ctr', MSO_ANCHOR.BOTTOM: 'b'}.get(anchor, 't'))
    for a in ('lIns', 'tIns', 'rIns', 'bIns'):
        body.set(a, '0')
    for i, para in enumerate([paras] if isinstance(paras, str) else paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        for rt, ov in (para if isinstance(para, list) else [(para, {})]):
            r = p.add_run()
            r.text = rt
            r.font.name = ov.get('font', font)
            r.font.size = Pt(ov.get('size', size))
            r.font.color.rgb = ov.get('color', color)
            r.font.bold = False
    return tb


def headline(s, x, y, lines, size=60, color=WHITE, hl=None, hl_fg=BLUE, w=None, align='left'):
    """Big Lora headline, one textbox per line so the First Light marker sits exactly
    behind the highlighted phrase. hl = {line_index: phrase}."""
    hl = hl or {}
    w = w or (SW - LM - x)
    lh = size * 1.14 / 72
    for i, ln in enumerate(lines):
        lw_ = text_w(ln, HEAD, size)
        assert lw_ <= w + 0.05, f'headline line too wide ({lw_:.2f} > {w:.2f}): {ln}'
        lx = x if align == 'left' else x + (w - lw_) / 2
        ly = y + i * lh
        runs = [(ln, {})]
        if i in hl:
            ph = hl[i]
            k = ln.index(ph)
            px = lx + text_w(ln[:k], HEAD, size)
            if color == WHITE:
                # dark slide: full-height First Light block (website hero 'mark' style) so the
                # Deep Knowing phrase text stays fully legible
                pw = text_w(ph, HEAD, size)
                rect(s, px - 0.12, ly + lh * 0.08, pw + 0.24, lh * 0.90, fill=LIGHT)
            else:
                # light slide: classic marker stroke across the lower half
                pw = text_w(ph.rstrip('.,'), HEAD, size)
                rect(s, px - 0.08, ly + lh * 0.46, pw + 0.16, lh * 0.42, fill=LIGHT)
            runs = [(ln[:k], {}), (ph, {'color': hl_fg}), (ln[k + len(ph):], {})]
            runs = [r for r in runs if r[0]]
        # Generous, transparent text boxes: room for a wider fallback font if Lora isn't
        # installed, and clears the QA gate's text-height estimator.
        box_h = size * 1.45 / 72
        if align == 'left':
            text(s, x - 0.02, ly, SW - 0.1 - x, box_h, [runs], size=size, font=HEAD, color=color, spacing=1.0)
        else:
            text(s, x, ly, w, box_h, [runs], size=size, font=HEAD, color=color, spacing=1.0,
                 align=PP_ALIGN.CENTER)
    return y + lh * len(lines)


def kicker(s, label, dark, x=LM, y=0.75, w=None, align=PP_ALIGN.LEFT):
    text(s, x, y, w or 8, 0.35, label.upper(), size=14, font=BODY_B, color=EMERGE if dark else ROOT, align=align)


def footer(s, n, dark):
    s.shapes.add_picture(os.path.join(ASSETS, 'logo_white.png' if dark else 'logo_blue.png'),
                         Inches(LM), Inches(6.88), height=Inches(0.26))
    text(s, SW - LM - 1.2, 6.92, 1.2, 0.3, f'{n:02d}', size=12, font=BODY_B,
         color=SOFT if dark else GREY, align=PP_ALIGN.RIGHT)


def bg(s, color):
    rect(s, 0, 0, SW, SH, fill=color)


def notes(s, txt):
    s.notes_slide.notes_text_frame.text = txt


def with_shadow(name):
    """Bake a soft drop shadow under a cut-out packshot."""
    out = os.path.join(BUILD, name.replace('.png', '_shadow.png'))
    im = Image.open(os.path.join(ASSETS, name)).convert('RGBA')
    pad = int(im.height * 0.08)
    canvas = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (0, 10, 40, 0))
    sh.putalpha(im.getchannel('A').point(lambda v: int(v * 0.45)))
    canvas.alpha_composite(sh, (pad + pad // 4, pad + pad // 2))
    canvas = canvas.filter(ImageFilter.GaussianBlur(pad / 3))
    canvas.alpha_composite(im, (pad, pad))
    canvas.save(out)
    return out, pad / canvas.height


def product(s, path_pad, cx, cy, h):
    """Place a shadowed packshot so the product itself is h inches tall, centred at (cx, cy)."""
    path, padf = path_pad
    iw, ih = Image.open(path).size
    full_h = h / (1 - 2 * padf)
    full_w = full_h * iw / ih
    s.shapes.add_picture(path, Inches(cx - full_w / 2), Inches(cy - full_h / 2), Inches(full_w), Inches(full_h))


def make_backdrop():
    """Brand-deck cover motif: a giant Emerge crop of the wordmark's 'rs' ligature."""
    out = os.path.join(BUILD, 'backdrop.png')
    W, H = 2400, 1350
    canvas = Image.new('RGB', (W, H), (0, 51, 153))
    logo = Image.open(os.path.join(ASSETS, 'logo_emerge.png'))
    big = logo.resize((int(logo.width * 6.0), int(logo.height * 6.0)), Image.LANCZOS)
    canvas.paste(big, (-int(big.width * 0.415), -int(big.height * 0.12)), big)
    canvas.save(out, quality=92)
    return out


# ── Script (speaker notes) ──────────────────────────────────────────────────
N = {
    'cover': "Hi, I'm Georgy, the founder of SuperState.",
    'mission': "We're building a modern health and wellness brand with a simple mission: to make health "
               "simpler, more transparent, and more exciting.\n\nThe idea for SuperState came from my own journey "
               "with health. As I learned more about nutrition and supplements, I realised that while there was so "
               "much information available, it was surprisingly difficult to figure out what was actually useful, "
               "what was worth investing in, and what I could trust. That's ultimately why I'm building SuperState.",
    'origin': "For me, this started with wanting to improve my own health: weight management, skin health, recovery "
              "and overall performance. I started learning about nutrition, ingredients and supplements.\n\nBut the "
              "more I researched, the more questions I had. Every product seemed to have a different promise. It "
              "became difficult to separate useful evidence from marketing.\n\nIf I was finding this confusing "
              "despite actively researching it, how difficult must it be for someone who simply wants to take "
              "better care of themselves?",
    'problem': "I don't think consumers lack interest in their health. I think they lack a simple, reliable way to "
               "make informed decisions.",
    'gaps': "I think there are three major challenges in the supplement space.\n\nAwareness: people want to improve "
            "their health, but may not understand which nutritional needs matter to them or where supplements fit."
            "\n\nTrust: products make impressive claims, but it isn't easy to verify ingredient quality, dosage, "
            "sourcing, or the evidence behind those claims.\n\nUncertainty: the benefits of many supplements are "
            "gradual and vary from person to person, so people are left wondering whether a product is actually "
            "helping them.",
    'category': "A lot of the category relies on 'pixie dusting': a pinch of a fancy ingredient, just enough to print "
                "it big on the front, the cheapest forms of ingredients, and real amounts hidden inside proprietary "
                "blends. They're not betting on customers being foolish. They're betting on them being busy.",
    'approach': "I believe brands should take responsibility for making this process easier, rather than expecting "
                "every customer to become an expert in nutrition. That's the job SuperState takes on.",
    'product': "Our first product is Sleep Well, a ready-to-mix sleep supplement in a dark chocolate format.\n\nWe "
               "chose sleep because it's fundamental to how we feel and function every day. It plays an important "
               "role in recovery, focus and overall well-being, yet building a consistent night-time routine isn't "
               "always easy.",
    'inside': "Every ingredient and every dose is on the label: organic raw cacao, glycine, two forms of magnesium, "
              "tart cherry, L-theanine and apigenin. No proprietary blends, and no melatonin.",
    'ritual': "Instead of creating another supplement you have to remember to take, we wanted it to be a simple, "
              "enjoyable ritual at the end of the day. You mix it with hot water, enjoy it like a warm chocolate "
              "drink, and make it part of your night-time routine.\n\nThis is about more than the format. It's about "
              "making functional nutrition fit more naturally into people's lives.",
    'transparency': "Creating an enjoyable product is only one part of it. The bigger question is: how do we give "
                    "people more confidence in what they're buying?\n\nWe want customers to understand what goes into "
                    "our products, why each ingredient is included, where it comes from, and what evidence supports "
                    "its use. Our ambition is to make quality-testing information accessible, including "
                    "batch-specific reports where appropriate.\n\nAnd we're careful about the difference between "
                    "research on individual ingredients and evidence for a finished formulation. Over time, where "
                    "appropriate, we want to test our finished formulations and communicate the findings honestly, "
                    "including the limitations. Transparency shouldn't be just a marketing message.",
    'outcomes': "In a category where benefits are gradual and experiences vary, we want to ask more meaningful "
                "questions than whether someone simply likes a product.\n\nFor Sleep Well, we could look at sleep "
                "diaries, customer feedback, and data from sleep-tracking devices. These measures alone can't prove "
                "a supplement caused an improvement, so we'll keep customer observations separate from "
                "scientifically established results.\n\nThe goal is a model where product development, quality "
                "verification and customer feedback inform one another.",
    'traction': "Our first batch sold out faster than we planned. We took notes, improved the product, and Batch 02 "
                "is shipping now.",
    'vision': "Sleep Well is just the beginning. Our long-term vision is a broader health and wellness brand that "
              "addresses different everyday health needs, with the same principles at the centre of every product: "
              "quality, transparency, evidence, and a better consumer experience.\n\nI don't expect us to solve "
              "every problem in the supplement industry overnight. We're at the beginning of this journey, and we "
              "have a lot to learn and prove. That's exactly why I want to build SuperState around these "
              "principles from the start.",
    'close': "At the end of the day, SuperState is personal for me. I know what it's like to want to improve your "
             "health, look for answers, and end up with more questions than you started with. I want to help "
             "change that experience.\n\nWe're starting with Sleep Well, but the bigger goal is to make health "
             "simpler, more transparent, and more enjoyable for the long term. That's the vision behind "
             "SuperState, and that's what we're working toward.",
}


# ── Deck ────────────────────────────────────────────────────────────────────
def build():
    eng = MckEngine(total_slides=TOTAL)
    backdrop = make_backdrop()
    pouch = with_shadow('pouch_cutout.png')
    box_pouch = with_shadow('box_pouch_cutout.png')
    n = 0

    def new(color):
        nonlocal n
        n += 1
        s = eng._ns()
        bg(s, color)
        return s

    # 1 · Cover
    s = new(BLUE)
    s.shapes.add_picture(backdrop, 0, 0, Inches(SW), Inches(SH))
    rect(s, 7.2, 0, SW - 7.2, SH, fill=BLUE)
    s.shapes.add_picture(os.path.join(ASSETS, 'logo_white.png'), Inches(7.85), Inches(2.45), width=Inches(4.7))
    text(s, 7.85, 3.7, 5.2, 0.75, 'Health, simplified.', size=34, font=HEAD, color=WHITE)
    rect(s, 7.85, 4.65, 0.9, 0.06, fill=EMERGE)
    text(s, 7.85, 4.9, 5, 0.4, 'A founder story  ·  Georgy Varghese', size=16, font=BODY, color=SOFT)
    notes(s, N['cover'])

    # 2 · Mission
    s = new(WHITE)
    kicker(s, 'Our mission', dark=False, x=0, y=1.65, w=SW, align=PP_ALIGN.CENTER)
    headline(s, 0, 2.3, ['We make health simple', 'in a world that makes', 'it complicated.'],
             size=58, color=BLUE, hl={0: 'health simple'}, w=SW, align='center')
    footer(s, n, dark=False)
    notes(s, N['mission'])

    # 3 · Origin
    s = new(BLUE)
    kicker(s, 'Where it started', dark=True)
    y = headline(s, LM, 1.45, ['I wanted to get healthier.', 'I ended up with more', 'questions than answers.'],
                 size=60, hl={2: 'questions than answers.'})
    text(s, LM, y + 0.45, 8, 0.4, 'Georgy Varghese, Founder', size=18, font=BODY_B, color=EMERGE)
    footer(s, n, dark=True)
    notes(s, N['origin'])

    # 4 · The problem
    s = new(WHITE)
    kicker(s, 'The problem', dark=False)
    y = headline(s, LM, 1.45, ['People don’t lack interest', 'in their health.'], size=54, color=GREY)
    headline(s, LM, y + 0.3, ['They lack a simple,', 'reliable way to decide.'], size=54, color=BLUE,
             hl={1: 'reliable way to decide.'})
    footer(s, n, dark=False)
    notes(s, N['problem'])

    # 5 · Three gaps
    s = new(BLUE)
    kicker(s, 'Three gaps', dark=True)
    gaps = [('01', 'Awareness.', '“Which needs actually', 'matter to me?”'),
            ('02', 'Trust.', '“Can I believe', 'this label?”'),
            ('03', 'Uncertainty.', '“Is it even', 'working?”')]
    cw = (SW - 2 * LM) / 3
    for i, (num, word, q1, q2) in enumerate(gaps):
        x = LM + i * cw
        text(s, x, 2.3, cw, 0.5, num, size=18, font=BODY_B, color=EMERGE)
        headline(s, x, 2.85, [word], size=42, w=cw - 0.2)
        text(s, x, 4.0, cw - 0.4, 1.2, [q1, q2], size=22, font=BODY, color=SOFT, spacing=1.2)
    footer(s, n, dark=True)
    notes(s, N['gaps'])

    # 6 · How the category works
    s = new(WHITE)
    kicker(s, 'How the category works today', dark=False)
    y = headline(s, LM, 1.75, ['Big on the front.', 'Pixie dust inside.'], size=72, color=BLUE,
                 hl={1: 'Pixie dust inside.'})
    text(s, LM, y + 0.55, SW - 2 * LM, 1.0, 'Tiny doses  ·  cheapest forms  ·  hidden blends  ·  fine print',
         size=24, font=BODY, color=GREY)
    footer(s, n, dark=False)
    notes(s, N['category'])

    # 7 · Our approach
    s = new(BLUE)
    kicker(s, 'Our approach', dark=True)
    y = headline(s, LM, 1.75, ['We do the homework,', 'so you don’t have to.'], size=66,
                 hl={1: 'so you don’t have to.'})
    tags = ['Every dose on the label', 'Honest about evidence', 'Built to be enjoyed']
    tx = LM
    for t in tags:
        tw = text_w(t, BODY_B, 18) + 0.6
        rect(s, tx, y + 0.65, tw, 0.55, line=EMERGE, lw=1.5, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
        text(s, tx, y + 0.65, tw, 0.55, t, size=18, font=BODY_B, color=EMERGE,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        tx += tw + 0.25
    footer(s, n, dark=True)
    notes(s, N['approach'])

    # 8 · Product hero
    s = new(BLUE)
    rect(s, 7.1, 0.85, 5.8, 5.8, fill=EMERGE, shape=MSO_SHAPE.OVAL)
    product(s, pouch, 10.0, 3.75, 5.6)
    kicker(s, 'Our first product', dark=True)
    y = headline(s, LM, 1.6, ['Sleep Well.'], size=76)
    y = headline(s, LM, y + 0.1, ['Coffee, but for sleep.'], size=40, hl={0: 'Coffee, but for sleep.'})
    text(s, LM, y + 0.5, 5.6, 1.2, ['A warm dark chocolate drink', 'for your evenings. No melatonin.'],
         size=22, font=BODY, color=SOFT, spacing=1.25)
    footer(s, n, dark=True)
    notes(s, N['product'])

    # 9 · What's inside
    s = new(WHITE)
    kicker(s, 'What’s inside', dark=False)
    headline(s, LM, 1.2, ['7 ingredients.', '0 hidden doses.'], size=54, color=BLUE, hl={1: '0 hidden doses.'})
    rows = [('3,000 mg', 'Organic raw cacao'), ('3,000 mg', 'Glycine'), ('2,000 mg', 'Magnesium L-threonate'),
            ('1,000 mg', 'Magnesium bisglycinate'), ('500 mg', 'Tart cherry extract'), ('200 mg', 'L-theanine'),
            ('50 mg', 'Apigenin')]
    col_w = (SW - 2 * LM - 0.6) / 2
    top, rp = 3.35, 0.68
    for i, (dose, name) in enumerate(rows):
        cx = LM + (i // 4) * (col_w + 0.6)
        ry = top + (i % 4) * rp
        text(s, cx, ry, 1.6, 0.5, dose, size=24, font=HEAD, color=ROOT, align=PP_ALIGN.RIGHT, anchor=MSO_ANCHOR.MIDDLE)
        text(s, cx + 1.85, ry, col_w - 1.85, 0.5, name, size=20, font=BODY_B, color=BLUE, anchor=MSO_ANCHOR.MIDDLE)
        rect(s, cx, ry + rp - 0.1, col_w, 0.015, fill=LINE)
    text(s, LM, 6.2, SW - 2 * LM, 0.4,
         'Per sachet   ·   no proprietary blends   ·   no melatonin   ·   food product, not a medicine',
         size=14, font=BODY, color=GREY)
    footer(s, n, dark=False)
    notes(s, N['inside'])

    # 10 · The ritual
    s = new(BLUE)
    kicker(s, 'Your 10 pm ritual', dark=True)
    steps = [('9:30 pm', 'Rip.'), ('9:31 pm', 'Stir.'), ('9:35 pm', 'Sip.'), ('10:00 pm', 'Sleep.')]
    cw = (SW - 2 * LM) / 4
    for i, (t, word) in enumerate(steps):
        x = LM + i * cw
        text(s, x, 1.95, cw, 0.4, t, size=20, font=BODY_B, color=EMERGE)
        headline(s, x, 2.4, [word], size=70, w=cw, hl={0: word} if i == 3 else None)
    rect(s, LM, 4.05, SW - 2 * LM, 0.02, fill=RGBColor(0x33, 0x5C, 0xB0))
    headline(s, LM, 4.55, ['Not another pill to remember.', 'A ritual to look forward to.'], size=36, color=SOFT)
    footer(s, n, dark=True)
    notes(s, N['ritual'])

    # 11 · Transparency beyond the label
    s = new(WHITE)
    kicker(s, 'Our difference', dark=False)
    headline(s, LM, 1.35, ['Transparency', 'beyond the label.'], size=58, color=BLUE, hl={1: 'beyond the label.'})
    items = [('Every dose on the pack', 'Live', ROOT, WHITE, None),
             ('Batch-specific quality reports', 'Building', LIGHT, BLUE, None),
             ('Honest about what the evidence shows', 'Next', WHITE, BLUE, BLUE)]
    iy = 3.75
    for label, st, fill, fg, ln in items:
        rect(s, LM, iy, SW - 2 * LM, 0.015, fill=LINE)
        text(s, LM, iy + 0.18, 9, 0.6, label, size=26, font=BODY_B, color=INK, anchor=MSO_ANCHOR.MIDDLE)
        rect(s, SW - LM - 1.6, iy + 0.27, 1.6, 0.46, fill=fill, line=ln, lw=1.25,
             shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
        text(s, SW - LM - 1.6, iy + 0.27, 1.6, 0.46, st, size=15, font=BODY_B, color=fg,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        iy += 0.95
    rect(s, LM, iy, SW - 2 * LM, 0.015, fill=LINE)
    footer(s, n, dark=False)
    notes(s, N['transparency'])

    # 12 · Measuring outcomes
    s = new(BLUE)
    kicker(s, 'Measuring what matters', dark=True)
    y = headline(s, LM, 1.6, ['Better questions than', '“did you like it?”'], size=64, hl={1: '“did you like it?”'})
    text(s, LM, y + 0.55, 10.5, 1.2,
         ['Sleep diaries, customer feedback and sleep-tracker data,',
          [('kept honestly separate from proven science.', {'color': EMERGE, 'font': BODY_B})]],
         size=24, font=BODY, color=SOFT, spacing=1.3)
    footer(s, n, dark=True)
    notes(s, N['outcomes'])

    # 13 · Early signal
    s = new(WHITE)
    rect(s, 6.9, 0.7, 6.0, 6.0, fill=MINT, line=LINE, lw=1.0, shape=MSO_SHAPE.OVAL)
    product(s, box_pouch, 9.9, 3.75, 4.6)
    kicker(s, 'Early signal', dark=False)
    y = headline(s, LM, 1.6, ['Batch 01', 'sold out.'], size=72, color=BLUE, hl={1: 'sold out.'})
    text(s, LM, y + 0.45, 5.6, 1.0, ['Faster than we planned.', 'Batch 02 is shipping now.'],
         size=24, font=BODY, color=GREY, spacing=1.3)
    footer(s, n, dark=False)
    notes(s, N['traction'])

    # 14 · Vision
    s = new(BLUE)
    kicker(s, 'The long game', dark=True)
    y = headline(s, LM, 1.6, ['Sleep Well is just', 'the beginning.'], size=72, hl={1: 'the beginning.'})
    text(s, LM, y + 0.5, 11, 0.5, 'More everyday health needs. The same four principles:', size=24, font=BODY, color=SOFT)
    tx = LM
    for t in ['Quality', 'Transparency', 'Evidence', 'Better experience']:
        tw = text_w(t, BODY_B, 18) + 0.6
        rect(s, tx, y + 1.3, tw, 0.55, fill=EMERGE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
        text(s, tx, y + 1.3, tw, 0.55, t, size=18, font=BODY_B, color=BLUE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        tx += tw + 0.25
    footer(s, n, dark=True)
    notes(s, N['vision'])

    # 15 · Close
    s = new(BLUE)
    s.shapes.add_picture(backdrop, 0, 0, Inches(SW), Inches(SH))
    rect(s, 5.9, 0, SW - 5.9, SH, fill=BLUE)
    headline(s, 6.5, 1.35, ['“I want to help people', 'feel more confident', 'about the choices they', 'make for their health.”'],
             size=36, hl={3: 'make for their health.”'})
    text(s, 6.5, 4.35, 6, 0.4, 'Georgy Varghese, Founder', size=18, font=BODY_B, color=EMERGE)
    text(s, 6.5, 5.15, 6.3, 0.9, ['superstate.in   ·   support@superstate.in', 'Instagram @superstate.in'],
         size=16, font=BODY, color=SOFT, spacing=1.4)
    s.shapes.add_picture(os.path.join(ASSETS, 'logo_white.png'), Inches(6.5), Inches(6.35), height=Inches(0.48))
    notes(s, N['close'])

    assert n == TOTAL, (n, TOTAL)
    out = os.path.join(HERE, 'SuperState_Pitch_Deck.pptx')
    eng.save(out)
    print('saved', out)


if __name__ == '__main__':
    build()
