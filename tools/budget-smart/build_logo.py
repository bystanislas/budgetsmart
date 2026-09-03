#!/usr/bin/env python3
"""Génère l'identité visuelle « Budget Smart by APEX AFRICA ».

Palette reprise de la charte APEX AFRICA (bleu nuit, or, crème, orange).
Sortie : SVG vectoriels dans assets/brand/.
"""
from __future__ import annotations

import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "assets" / "brand"

# --- Charte APEX AFRICA -------------------------------------------------
NAVY = "#1A3557"
NAVY_DEEP = "#122845"
GOLD = "#B8860B"          # or de la charte — sur fond clair
GOLD_LIGHT = "#D9A93C"    # déclinaison sur fond sombre
GOLD_BRIGHT = "#F0C75E"   # pointe de lumière
CREAM = "#FDF6E3"
ORANGE = "#E07B22"
SLATE = "#404040"
MUTED = "#7A8794"
WHITE = "#FFFFFF"

FONT = "Liberation Sans, Arial, Helvetica, sans-serif"

DEFS = f"""
  <defs>
    <linearGradient id="or" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{GOLD_BRIGHT}"/>
      <stop offset="55%" stop-color="{GOLD_LIGHT}"/>
      <stop offset="100%" stop-color="{GOLD}"/>
    </linearGradient>
    <linearGradient id="nuit" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{NAVY}"/>
      <stop offset="100%" stop-color="{NAVY_DEEP}"/>
    </linearGradient>
  </defs>
"""


# ------------------------------------------------------------------ marques
def mark_a(bg=True):
    """Piste A — barres ascendantes + trajectoire qui s'échappe vers l'apex."""
    plate = (f'<rect x="0" y="0" width="260" height="260" rx="58" fill="url(#nuit)"/>'
             f'<rect x="13" y="13" width="234" height="234" rx="47" fill="none" '
             f'stroke="{GOLD_LIGHT}" stroke-opacity="0.28" stroke-width="2"/>') if bg else ""
    bars = "".join(
        f'<rect x="{x}" y="{200 - h}" width="32" height="{h}" rx="6" '
        f'fill="{GOLD_LIGHT}" fill-opacity="0.5"/>'
        for x, h in ((58, 54), (104, 84), (150, 114)))
    line = (f'<path d="M 60 134 L 106 104 L 152 74 L 190 50" fill="none" '
            f'stroke="url(#or)" stroke-width="11" stroke-linecap="round" '
            f'stroke-linejoin="round"/>')
    apex = f'<path d="M 176 34 L 208 34 L 208 66 Z" fill="url(#or)"/>'
    base = f'<rect x="52" y="203" width="156" height="7" rx="3.5" fill="{GOLD_LIGHT}" fill-opacity="0.35"/>'
    return plate + base + bars + line + apex


def mark_b(bg=True):
    """Piste B — le sommet gravi marche après marche."""
    plate = (f'<rect x="0" y="0" width="260" height="260" rx="58" fill="url(#nuit)"/>'
             f'<rect x="13" y="13" width="234" height="234" rx="47" fill="none" '
             f'stroke="{GOLD_LIGHT}" stroke-opacity="0.28" stroke-width="2"/>') if bg else ""
    summit = ('<path d="M 46 206 L 46 168 L 88 168 L 88 130 L 130 130 L 130 92 '
              'L 172 92 L 190 52 L 214 206 Z" fill="url(#or)"/>')
    spark = f'<circle cx="190" cy="34" r="9" fill="{CREAM}" fill-opacity="0.9"/>'
    return plate + summit + spark


def mark_c(bg=True):
    """Piste C — les colonnes du budget qui montent en marches jusqu'au sommet.

    Trois colonnes ascendantes (le budget qui se construit mois après mois) et
    une quatrième qui se termine en pointe : l'apex atteint.
    """
    plate = (f'<rect x="0" y="0" width="260" height="260" rx="58" fill="url(#nuit)"/>'
             f'<rect x="13" y="13" width="234" height="234" rx="47" fill="none" '
             f'stroke="{GOLD_LIGHT}" stroke-opacity="0.28" stroke-width="2"/>') if bg else ""
    cols = "".join(
        f'<path d="M {x} 208 L {x} {top + 8} Q {x} {top} {x + 8} {top} '
        f'L {x + 31} {top} Q {x + 39} {top} {x + 39} {top + 8} L {x + 39} 208 Z" '
        f'fill="url(#or)" fill-opacity="{op}"/>'
        for x, top, op in ((44, 164, 0.62), (87, 130, 0.79), (130, 96, 0.93)))
    peak = ('<path d="M 173 208 L 173 92 L 192.5 44 L 212 92 L 212 208 Z" '
            'fill="url(#or)"/>')
    ground = (f'<rect x="40" y="208" width="176" height="7" rx="3.5" '
              f'fill="{GOLD_LIGHT}" fill-opacity="0.38"/>')
    return plate + cols + peak + ground


MARKS = {"A": mark_a, "B": mark_b, "C": mark_c}


# ------------------------------------------------------------------ wordmark
def wordmark(x, y, size=64, on_dark=False, tagline=True, anchor="start"):
    """« BUDGET SMART » + filet + « BY APEX AFRICA »."""
    c1 = WHITE if on_dark else NAVY
    c2 = GOLD_LIGHT if on_dark else GOLD
    c3 = "#9FB0C4" if on_dark else SLATE
    rule = GOLD_LIGHT if on_dark else GOLD
    sp = round(size * 0.045, 2)
    out = (f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" '
           f'font-weight="700" letter-spacing="{sp}" text-anchor="{anchor}">'
           f'<tspan fill="{c1}">BUDGET</tspan>'
           f'<tspan fill="{c2}"> SMART</tspan></text>')
    if tagline:
        ry = y + size * 0.30
        w = size * 8.05
        x0 = x if anchor == "start" else x - w / 2
        out += (f'<rect x="{x0}" y="{ry}" width="{w}" height="{max(2, size * 0.045)}" '
                f'fill="{rule}" rx="1"/>')
        out += (f'<text x="{x}" y="{ry + size * 0.62}" font-family="{FONT}" '
                f'font-size="{size * 0.30}" font-weight="600" '
                f'letter-spacing="{round(size * 0.16, 2)}" fill="{c3}" '
                f'text-anchor="{anchor}">BY APEX AFRICA</text>')
    return out


def svg(width, height, body, bg=None):
    back = f'<rect width="{width}" height="{height}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" '
            f'height="{height}" viewBox="0 0 {width} {height}">{DEFS}{back}{body}</svg>\n')


# ------------------------------------------------------------------ lockups
def horizontal(variant="A", on_dark=False):
    mark = MARKS[variant]()
    body = (f'<g transform="translate(40,40)">{mark}</g>'
            f'<g transform="translate(352,0)">{wordmark(0, 158, 64, on_dark)}</g>')
    return svg(1180, 340, body, bg=NAVY if on_dark else None)


def vertical(variant="A", on_dark=False):
    mark = MARKS[variant]()
    body = (f'<g transform="translate(240,40)">{mark}</g>'
            f'<g>{wordmark(370, 400, 58, on_dark, anchor="middle")}</g>')
    return svg(740, 500, body, bg=NAVY if on_dark else None)


def monogram(variant="A"):
    return svg(260, 260, MARKS[variant]())


def favicon(variant="A"):
    return svg(64, 64, f'<g transform="scale(0.246)">{MARKS[variant]()}</g>')


RETENUE = "C"
COMPARE = ("B", "C")


def compare():
    """Planche de comparaison des deux pistes."""
    rows = []
    for i, v in enumerate(COMPARE):
        y = 60 + i * 470
        rows.append(
            f'<text x="60" y="{y - 10}" font-family="{FONT}" font-size="26" '
            f'font-weight="700" fill="{SLATE}">PISTE {v}</text>'
            f'<g transform="translate(60,{y + 10}) scale(0.85)">{MARKS[v]()}</g>'
            f'<g transform="translate(340,{y + 120})">{wordmark(0, 0, 52)}</g>'
            f'<rect x="0" y="{y + 250}" width="1400" height="190" fill="{NAVY}"/>'
            f'<g transform="translate(60,{y + 270}) scale(0.58)">{MARKS[v]()}</g>'
            f'<g transform="translate(260,{y + 330})">{wordmark(0, 0, 44, on_dark=True)}</g>'
            f'<g transform="translate(1180,{y + 285}) scale(0.35)">{MARKS[v]()}</g>'
            f'<g transform="translate(1280,{y + 300}) scale(0.14)">{MARKS[v]()}</g>'
            f'<g transform="translate(1320,{y + 305}) scale(0.09)">{MARKS[v]()}</g>')
    return svg(1400, 1000, "".join(rows), bg=WHITE)


def charte():
    """Planche de charte : symbole, déclinaisons, palette, typo, usages."""
    W = 1400
    b = []

    def title(y, txt, num):
        return (f'<rect x="70" y="{y - 26}" width="5" height="30" fill="{GOLD}"/>'
                f'<text x="92" y="{y}" font-family="{FONT}" font-size="15" '
                f'font-weight="700" letter-spacing="3" fill="{NAVY}">{num} — {txt}</text>')

    def label(x, y, txt, size=11, fill=SLATE, weight="400", anchor="start", ls=0):
        return (f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" '
                f'font-weight="{weight}" letter-spacing="{ls}" fill="{fill}" '
                f'text-anchor="{anchor}">{txt}</text>')

    # en-tête
    b.append(f'<rect x="0" y="0" width="{W}" height="230" fill="{NAVY}"/>')
    b.append(f'<g transform="translate(70,52) scale(0.49)">{MARKS[RETENUE]()}</g>')
    b.append(f'<g transform="translate(215,0)">{wordmark(0, 118, 46, on_dark=True)}</g>')
    b.append(label(70, 200, "CHARTE D\u2019IDENTITÉ VISUELLE", 13, "#9FB0C4", "700", ls=4))
    b.append(f'<rect x="0" y="230" width="{W}" height="6" fill="{GOLD}"/>')

    # 1 — le symbole
    y = 320
    b.append(title(y, "LE SYMBOLE", "01"))
    b.append(f'<g transform="translate(70,{y + 30}) scale(0.85)">{MARKS[RETENUE]()}</g>')
    lines = [
        ("Trois colonnes qui montent", "le budget qui se construit mois après mois."),
        ("Une quatrième en pointe", "l\u2019apex : l\u2019objectif atteint."),
        ("Or sur bleu nuit", "les deux couleurs signature d\u2019APEX AFRICA."),
        ("Un socle discret", "la ligne de base, la discipline du chiffre."),
    ]
    for i, (t, d) in enumerate(lines):
        yy = y + 78 + i * 46
        b.append(label(340, yy, t, 15, NAVY, "700"))
        b.append(label(340, yy + 22, d, 13, SLATE))
    b.append(f'<rect x="70" y="{y + 280}" width="{W - 140}" height="1" fill="#E3E8EF"/>')

    # 2 — déclinaisons
    y = 660
    b.append(title(y, "DÉCLINAISONS", "02"))
    b.append(f'<g transform="translate(70,{y + 34}) scale(0.30)">{horizontal_body()}</g>')
    b.append(label(70, y + 160, "Logo principal — fond clair", 11, MUTED, "600"))
    b.append(f'<rect x="470" y="{y + 24}" width="440" height="130" rx="8" fill="{NAVY}"/>')
    b.append(f'<g transform="translate(492,{y + 40}) scale(0.30)">{horizontal_body(True)}</g>')
    b.append(label(470, y + 176, "Logo — fond sombre", 11, MUTED, "600"))
    b.append(f'<g transform="translate(960,{y + 24}) scale(0.42)">{MARKS[RETENUE]()}</g>')
    b.append(label(960, y + 160, "Monogramme", 11, MUTED, "600"))
    b.append(f'<g transform="translate(1120,{y + 44}) scale(0.25)">{MARKS[RETENUE]()}</g>')
    b.append(f'<g transform="translate(1210,{y + 62}) scale(0.15)">{MARKS[RETENUE]()}</g>')
    b.append(f'<g transform="translate(1265,{y + 74}) scale(0.09)">{MARKS[RETENUE]()}</g>')
    b.append(label(1120, y + 160, "Favicon / petites tailles", 11, MUTED, "600"))
    b.append(f'<rect x="70" y="{y + 210}" width="{W - 140}" height="1" fill="#E3E8EF"/>')

    # 3 — palette
    y = 940
    b.append(title(y, "PALETTE", "03"))
    swatches = [("Bleu nuit", NAVY), ("Or APEX", GOLD), ("Or clair", GOLD_LIGHT),
                ("Crème", CREAM), ("Orange APEX", ORANGE), ("Gris ardoise", SLATE)]
    for i, (name, hexa) in enumerate(swatches):
        x = 70 + i * 215
        b.append(f'<rect x="{x}" y="{y + 30}" width="185" height="96" rx="8" '
                 f'fill="{hexa}" stroke="#E3E8EF"/>')
        b.append(label(x, y + 150, name, 13, NAVY, "700"))
        b.append(label(x, y + 170, hexa.upper(), 12, MUTED))
    b.append(f'<rect x="70" y="{y + 210}" width="{W - 140}" height="1" fill="#E3E8EF"/>')

    # 4 — typographie
    y = 1210
    b.append(title(y, "TYPOGRAPHIE", "04"))
    b.append(label(70, y + 66, "Arial", 44, NAVY, "700"))
    b.append(label(70, y + 96, "Titres — Bold, interlettrage +2 à +4", 13, SLATE))
    b.append(label(70, y + 122, "Corps — Regular 10/11 pt, gris ardoise", 13, SLATE))
    b.append(label(560, y + 50, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", 17, NAVY, "700"))
    b.append(label(560, y + 80, "abcdefghijklmnopqrstuvwxyz", 17, SLATE))
    b.append(label(560, y + 110, "0123456789  €  $  FCFA  £  ₦", 17, GOLD, "700"))
    b.append(f'<rect x="70" y="{y + 170}" width="{W - 140}" height="1" fill="#E3E8EF"/>')

    # 5 — usages
    y = 1430
    b.append(title(y, "RÈGLES D\u2019USAGE", "05"))
    rules = [
        ("À FAIRE", GREEN_OK, [
            "Réserver autour du logo une marge égale à la hauteur du monogramme.",
            "Utiliser la version fond sombre dès que le fond est plus foncé que le crème.",
            "Taille minimale : 24 px de haut pour le monogramme, 90 px pour le logo complet.",
        ]),
        ("À ÉVITER", RED_KO, [
            "Déformer, incliner ou changer les proportions du symbole.",
            "Recolorer le logo hors palette, ou le poser sur une photo chargée.",
            "Séparer le monogramme du bloc « BY APEX AFRICA » sur un support officiel.",
        ]),
    ]
    for i, (head, color, items) in enumerate(rules):
        x = 70 + i * 660
        b.append(f'<rect x="{x}" y="{y + 26}" width="600" height="150" rx="8" '
                 f'fill="{"#F0F7F2" if i == 0 else "#FCF2F2"}" stroke="{color}" '
                 f'stroke-opacity="0.35"/>')
        b.append(label(x + 20, y + 54, head, 12, color, "700", ls=2))
        for j, it in enumerate(items):
            b.append(label(x + 20, y + 82 + j * 26, ("•  " + it), 12, SLATE))

    # pied
    b.append(f'<rect x="0" y="1680" width="{W}" height="70" fill="{NAVY}"/>')
    b.append(label(70, 1712, "APEX AFRICA — African Premium Experience", 13, WHITE, "700"))
    b.append(label(70, 1734, "Abidjan, Côte d\u2019Ivoire · contact@apxafrica.com · "
                             "www.apxafrica.com", 11, "#9FB0C4"))
    return svg(W, 1750, "".join(b), bg=WHITE)


GREEN_OK = "#1E6B3C"
RED_KO = "#8B1A1A"


def horizontal_body(on_dark=False):
    mark = MARKS[RETENUE]()
    return (f'<g>{mark}</g>'
            f'<g transform="translate(312,0)">{wordmark(0, 158, 64, on_dark)}</g>')


def main(variant=None):
    OUT.mkdir(parents=True, exist_ok=True)
    written = []
    variant = variant or RETENUE
    if variant == "compare":
        (OUT / "_comparaison-pistes.svg").write_text(compare(), encoding="utf-8")
        written.append(OUT / "_comparaison-pistes.svg")
    else:
        files = {
            "budget-smart-logo.svg": horizontal(variant),
            "budget-smart-logo-fond-sombre.svg": horizontal(variant, on_dark=True),
            "budget-smart-logo-vertical.svg": vertical(variant),
            "budget-smart-logo-vertical-fond-sombre.svg": vertical(variant, on_dark=True),
            "budget-smart-monogramme.svg": monogram(variant),
            "budget-smart-favicon.svg": favicon(variant),
            "budget-smart-charte.svg": charte(),
        }
        for name, content in files.items():
            (OUT / name).write_text(content, encoding="utf-8")
            written.append(OUT / name)
    for w in written:
        print("✓", w)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
