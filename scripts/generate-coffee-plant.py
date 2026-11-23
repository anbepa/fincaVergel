#!/usr/bin/env python3
"""
Generates an illustrated coffee plant (Coffea arabica) as a standalone SVG.

  python3 scripts/generate-coffee-plant.py src/assets/coffee-plant.svg

Deterministic (fixed seed) so the output is stable between runs. Change SEED
for a different plant. Class names (cp-leaf, cp-branch, cp-cherry, cp-flower)
let the site animate parts with CSS.
"""
import math
import random
import sys

SEED = 7
W, H = 900, 1100
rnd = random.Random(SEED)


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    return (
        u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
        u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
    )


def bezier_tangent(p0, p1, p2, p3, t):
    u = 1 - t
    dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
    dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
    return math.atan2(dy, dx)


# ── Leaf: elongated ellipse with a pointed drip tip and wavy (undulate) margin ──
def leaf_path(length, width):
    """Leaf pointing along +x from the origin (petiole at 0,0)."""
    pts_top, pts_bot = [], []
    n = 18
    for i in range(n + 1):
        t = i / n
        x = t * length
        # widest a bit before the middle, narrow drip tip
        w = width * math.sin(math.pi * t ** 0.85) * (1 - 0.35 * t ** 3)
        wave = 1 + 0.06 * math.sin(t * math.pi * 7)
        pts_top.append((x, -w * wave / 2))
        pts_bot.append((x, w * (2 - wave) / 2))
    tip = (length * 1.06, 0)
    d = f"M0 0 "
    for (x, y) in pts_top[1:]:
        d += f"L{f(x)} {f(y)} "
    d += f"Q{f(length * 1.02)} {f(pts_top[-1][1] * 0.3)} {f(tip[0])} {f(tip[1])} "
    d += f"Q{f(length * 1.02)} {f(pts_bot[-1][1] * 0.3)} {f(pts_bot[-1][0])} {f(pts_bot[-1][1])} "
    for (x, y) in reversed(pts_bot[:-1]):
        d += f"L{f(x)} {f(y)} "
    return d + "Z"


LEAF_SHAPES = {  # id: (length, width) of the master shape (scaled per use)
    "s1": (100, 44),
    "s2": (100, 38),
    "s3": (100, 48),
}


def leaf_symbol(sid, length, width):
    veins = ""
    for k in range(1, 7):
        t = k / 7.5
        vx = t * length
        vw = width * math.sin(math.pi * t ** 0.85) * 0.42
        veins += (f"M{f(vx)} 0Q{f(vx + length * .05)} {f(-vw * .6)} {f(vx + length * .1)} {f(-vw)}"
                  f"M{f(vx)} 0Q{f(vx + length * .05)} {f(vw * .6)} {f(vx + length * .1)} {f(vw)}")
    return (
        f'<g id="cp-{sid}">'
        f'<path d="{leaf_path(length, width)}" stroke="#173d22" stroke-width="1.1" stroke-linejoin="round"/>'
        f'<path d="{leaf_path(length * .96, width * .5)}" fill="url(#cp-gloss)" opacity=".55"/>'
        f'<path d="{veins}" fill="none" stroke="#8fc07a" stroke-opacity=".4" stroke-width="1" stroke-linecap="round"/>'
        f'<path d="M0 0Q{f(length * .5)} {f(-width * .04)} {f(length * 1.02)} 0" fill="none" stroke="#b5d99a" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>'
        f"</g>"
    )


def leaf(x, y, angle, length, width, shade):
    sid = rnd.choice(list(LEAF_SHAPES))
    sx = length / 100
    sy = width / LEAF_SHAPES[sid][1] * (LEAF_SHAPES[sid][1] / 100) * (100 / LEAF_SHAPES[sid][1]) * (LEAF_SHAPES[sid][1] / 100)
    sy = width / LEAF_SHAPES[sid][1]
    flip = rnd.choice((1, -1))
    return (f'<use class="cp-leaf" href="#cp-{sid}" fill="url(#cp-leaf{shade})" '
            f'transform="translate({f(x)} {f(y)}) rotate({f(math.degrees(angle))}) scale({sx:.3f} {flip * sy:.3f})"/>')


# ── Cherry: ovoid drupe with highlight and a small calyx scar at the tip ──
CHERRY_STAGES = ["green", "lime", "yellow", "orange", "red", "red", "red", "wine"]


CHERRY_GRADS = ["green", "lime", "yellow", "orange", "red", "wine"]


def cherry_symbol(stage):
    r = 10
    return (
        f'<g id="cp-c-{stage}">'
        f'<ellipse rx="{r}" ry="{f(r * 1.18)}" fill="url(#cp-ch-{stage})" stroke="#2b0d0d" stroke-opacity=".35" stroke-width="1"/>'
        f'<ellipse cx="{f(-r * .32)}" cy="{f(-r * .4)}" rx="{f(r * .3)}" ry="{f(r * .2)}" fill="#fff" opacity=".55" transform="rotate(-30)"/>'
        f'<circle cy="{f(r * 1.08)}" r="{f(r * .22)}" fill="#3b2a1a" opacity=".7"/></g>'
    )


def cherry(x, y, r, stage, angle):
    return (f'<use class="cp-cherry" href="#cp-c-{stage}" '
            f'transform="translate({f(x)} {f(y)}) rotate({f(math.degrees(angle))}) scale({r / 10:.2f})"/>')


def cluster(x, y, side, count):
    out = []
    for i in range(count):
        a = rnd.uniform(0, math.tau)
        dist = rnd.uniform(3, 15)
        cx = x + math.cos(a) * dist
        cy = y + 6 + abs(math.sin(a)) * dist * .8
        r = rnd.uniform(9, 11.5)
        out.append((cy, cherry(cx, cy, r, rnd.choice(CHERRY_STAGES), rnd.uniform(-0.5, 0.5))))
    out.sort()
    return "".join(c for _, c in out)


def flower(x, y, s):
    petals = "".join(
        f'<ellipse rx="{f(s * .32)}" ry="{f(s)}" cy="{f(-s * .9)}" transform="rotate({k * 72 + rnd.uniform(-6, 6):.0f})"/>'
        for k in range(5)
    )
    return (
        f'<g class="cp-flower" transform="translate({f(x)} {f(y)})">'
        f'<g fill="#fffdf7" stroke="#e7dcc5" stroke-width=".8">{petals}</g>'
        f'<circle r="{f(s * .28)}" fill="#f3d27a"/></g>'
    )


def branch(x0, y0, side, length, droop, level):
    """A horizontal (plagiotropic) branch with opposite leaf pairs and cherry clusters."""
    p0 = (x0, y0)
    p3 = (x0 + side * length, y0 + droop)
    p1 = (x0 + side * length * .32, y0 - length * .1)
    p2 = (x0 + side * length * .72, y0 + droop * .35)
    width = max(2.4, 6.5 - level * 0.5)
    path = f"M{f(p0[0])} {f(p0[1])}C{f(p1[0])} {f(p1[1])} {f(p2[0])} {f(p2[1])} {f(p3[0])} {f(p3[1])}"
    back, front, fruits = [], [], []
    nodes = max(3, int(length / 78))
    for k in range(1, nodes + 1):
        t = k / (nodes + 0.5)
        bx, by = bezier(p0, p1, p2, p3, t)
        ang = bezier_tangent(p0, p1, p2, p3, t)
        size = 1.05 - t * 0.4
        L = rnd.uniform(130, 165) * size
        Wd = L * rnd.uniform(0.40, 0.47)
        up = ang - side * rnd.uniform(0.5, 0.9)
        down = ang + side * rnd.uniform(0.45, 0.85)
        back.append(leaf(bx, by, up, L, Wd, rnd.choice("ab")))
        # the hanging leaf of the pair only every other node, so fruit shows
        if k % 2 == 0 or t > 0.8:
            front.append(leaf(bx, by, down, L * .9, Wd * .9, rnd.choice("bc")))
        else:
            back.append(leaf(bx, by, down, L * .9, Wd * .9, "a"))
        if 0.15 < t < 0.9 and rnd.random() < 0.9:
            fruits.append(cluster(bx, by, side, rnd.randint(4, 9)))
    tip_ang = bezier_tangent(p0, p1, p2, p3, 1)
    front.append(leaf(p3[0], p3[1], tip_ang - side * 0.3, 74, 32, "c"))
    front.append(leaf(p3[0], p3[1], tip_ang + side * 0.35, 64, 27, "c"))
    stem = (f'<path class="cp-branch" d="{path}" fill="none" stroke="url(#cp-bark)" '
            f'stroke-width="{f(width)}" stroke-linecap="round"/>')
    return "".join(back) + stem + "".join(front) + "".join(fruits)


def build():
    trunk_base = (W * 0.5, H - 30)
    trunk_top = (W * 0.52, 120)
    c1 = (W * 0.44, H * 0.62)
    c2 = (W * 0.58, H * 0.32)
    trunk = (f"M{f(trunk_base[0])} {f(trunk_base[1])} C{f(c1[0])} {f(c1[1])} "
             f"{f(c2[0])} {f(c2[1])} {f(trunk_top[0])} {f(trunk_top[1])}")
    layers = []
    levels = 7
    for i in range(levels):
        t = 0.1 + i * (0.78 / (levels - 1))
        for side in (-1, 1):
            tt = t + (0.035 if side > 0 else 0) + rnd.uniform(-0.012, 0.012)
            x, y = bezier(trunk_base, c1, c2, trunk_top, 1 - tt)
            # widest in the lower-middle, conical crown on top
            span = 380 * (0.42 + 0.58 * math.sin(math.pi * min(1, (tt + 0.05) / 1.0) ** 0.8))
            span *= (1 - max(0, tt - 0.55) * 0.9)
            L = max(130, span * rnd.uniform(0.85, 1.08))
            droop = L * rnd.uniform(0.18, 0.32)
            layers.append((i, branch(x, y, side, L, droop, i)))
    # top shoot: young leaves and a few flowers
    tx, ty = trunk_top
    crown = leaf(tx, ty, -math.pi / 2 - 0.5, 80, 34, "c") + leaf(tx, ty, -math.pi / 2 + 0.45, 76, 32, "c")
    flowers = "".join(flower(tx + rnd.uniform(-60, 60), ty + rnd.uniform(40, 130), rnd.uniform(7, 9)) for _ in range(5))

    defs = f"""
  <defs>
    <linearGradient id="cp-leafa" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2f6b37"/><stop offset=".55" stop-color="#1f4f2a"/><stop offset="1" stop-color="#143a1f"/>
    </linearGradient>
    <linearGradient id="cp-leafb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3f8445"/><stop offset=".6" stop-color="#28603a"/><stop offset="1" stop-color="#18452a"/>
    </linearGradient>
    <linearGradient id="cp-leafc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6aa84f"/><stop offset=".6" stop-color="#3f8445"/><stop offset="1" stop-color="#2a6237"/>
    </linearGradient>
    <linearGradient id="cp-gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="cp-bark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5a4a35"/><stop offset=".5" stop-color="#8a7656"/><stop offset="1" stop-color="#4a3b2a"/>
    </linearGradient>
    <linearGradient id="cp-trunk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4a3a28"/><stop offset=".45" stop-color="#8f7a58"/><stop offset="1" stop-color="#3d2f20"/>
    </linearGradient>
    {''.join(leaf_symbol(k, *v) for k, v in LEAF_SHAPES.items())}
    {''.join(cherry_symbol(c) for c in CHERRY_GRADS)}
    {''.join(f'''<radialGradient id="cp-ch-{n}" cx=".35" cy=".3" r=".8">
      <stop offset="0" stop-color="{a}"/><stop offset=".6" stop-color="{b}"/><stop offset="1" stop-color="{c}"/></radialGradient>'''
      for n, a, b, c in [
        ("green", "#b9dd7a", "#6fa83a", "#3e6e22"),
        ("lime", "#e3ee8a", "#a8c94a", "#6c8f2a"),
        ("yellow", "#ffe98a", "#f2c43a", "#b9861d"),
        ("orange", "#ffc07a", "#ef7f2e", "#a8461a"),
        ("red", "#ff7b6b", "#d4202a", "#7e0f17"),
        ("wine", "#c94a5a", "#86131f", "#4a0810"),
      ])}
  </defs>"""

    body = [
        f'<path class="cp-trunk" d="{trunk}" fill="none" stroke="url(#cp-trunk)" stroke-width="16" stroke-linecap="round"/>',
    ]
    for _, svg in layers:
        body.append(svg)
    body.append(crown + flowers)

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" '
        f'aria-labelledby="cp-title">\n  <title id="cp-title">Coffee plant (Coffea arabica) with ripening cherries</title>'
        f"{defs}\n  <g class=\"cp-plant\">\n    " + "\n    ".join(body) + "\n  </g>\n</svg>\n"
    )


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "coffee-plant.svg"
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(build())
    print(out)
