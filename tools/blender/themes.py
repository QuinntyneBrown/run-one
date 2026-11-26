"""Ibiza Sunset Strip's theme for build_course.py (ADR 0034), and the kit its scenery borrows.

Rewritten for Telo Ride 1: one course. Ibiza Sunset Strip keeps its land and its scenery in build_course.py; its
theme here is data (the sky the app draws, the bends it is dealt, its hills). The seven other courses' themes and
scenery went with slice 30.1 (ADR 0042).

`Kit` holds the road, the builders by material and a seeded random source, so the same course file always builds
the same map.
"""

from __future__ import annotations

import math

# Materials the kit adds to build_course.MATERIALS: name -> colour, roughness, glow.
MATERIALS: dict[str, dict] = {
    "window": {"color": 0x2A3440, "rough": 0.3, "double": True},
    "tower": {"color": 0x1C2030, "rough": 0.5, "metal": 0.3},
    "rail": {"color": 0xB8BEC4, "rough": 0.4, "metal": 0.7},
}

# The theme: the sky the app draws (horizon up), the haze, the sun's and the fill light's colours, the turns and the
# gradient.
THEMES: dict[str, dict] = {
    # Ibiza Sunset Strip, the one map: its land and its scenery are its own (build_terrain and build_scenery in
    # build_course.py, `own`), and the rest is a theme's: the sunset the app draws, the bends its stages are dealt, the
    # hills its efforts climb, and what the course file tells the app of its lights.
    "ibiza": {
        "own": True,
        "sky": [0xFFC27A, 0xF7A070, 0xE0708A, 0x7A4F9A, 0x2F2A5E],
        "haze": 0xF2A77A,
        "light": [0xFF9A5A, 2.6],
        "fill": [0xFFD9C0, 0x6A5A7A],
        "sun_altitude": 0.11,
        "terrain": {"sea": True},
        # A coast road: an effort winds up onto a headland through esses and a hairpin, a recovery sweeps back down
        # to the strip, and the calm stretches between are the strip itself, with a bend in it.
        "turns": {"work": (("ess", 0.4), ("hairpin", 0.18), ("sweep", 0.3), ("straight", 0.12)),
                  "recover": (("sweep", 0.5), ("ess", 0.3), ("straight", 0.2)),
                  "calm": (("sweep", 0.45), ("straight", 0.35), ("ess", 0.2))},
        # The hills: each effort climbs in the first half of its stretch and holds the headland's height; each
        # recovery drops off it in its first quarter. The ground between rolls a little, so the strip itself is
        # never dead level.
        "grade": {"perLevel": 0.855, "ramp": {"work": 0.5, "recover": 0.25}, "roll": 3.3, "rollWave": 620.0},
    },
}


# What a window's panel holds beyond its opening, in metres: each side, the sill beneath and the lintel above.
WINDOW_SURROUND = (0.18, 0.14, 0.24)


class Kit:
    """What the scenery's windows, railings, glows and lights are built with."""

    def __init__(self, road, st, length, height_at, rng, builders, step, road_half):
        self.road, self.s, self.st, self.length = road, road.s, st, length
        self.height_at, self.rng, self.B = height_at, rng, builders
        # Coloured lights that stand still (a neon sign, a glowing door): where each throws its light on the
        # ground. The course file carries them and the app lights what is near (see `light`).
        self.lights: list[tuple] = []
        self.n, self.step, self.half = len(road.s), step, road_half
        self.kerb = road_half + 0.6
        # A longer map spreads more scenery over its larger land.
        self.scale = max(1.0, length / 11460.0)

    # --- Placing -------------------------------------------------------------------------------

    def P(self, i: int, along: float, left: float, up: float = 0.0):
        x, y, z = self.road.at(i, left, up)
        h = self.s[i]["h"]
        return (x + math.cos(h) * along, y + math.sin(h) * along, z)

    # --- Shapes --------------------------------------------------------------------------------

    def prism(self, b, c, r: float, h: float, sides: int = 6, top_r: float | None = None, yaw: float = 0.0) -> None:
        top_r = r if top_r is None else top_r
        lo = [(c[0] + math.cos(yaw + a * math.tau / sides) * r, c[1] + math.sin(yaw + a * math.tau / sides) * r, c[2]) for a in range(sides)]
        hi = [(c[0] + math.cos(yaw + a * math.tau / sides) * top_r, c[1] + math.sin(yaw + a * math.tau / sides) * top_r, c[2] + h) for a in range(sides)]
        for a in range(sides):
            b.quad(lo[a], lo[(a + 1) % sides], hi[(a + 1) % sides], hi[a])
        if top_r > 0:
            b.faces.append(tuple(b.v(p) for p in hi))

    def window(self, i: int, along: float, off: float, up: float, w: float, h: float, lit: bool, yaw: float) -> None:
        """A window on a wall facing the road: one flat panel the app draws as a frame, panes and the room behind,
        under a lintel and over a sill. The panel is `WINDOW_SURROUND` larger than the opening for those."""
        b = self.B.setdefault("windows", type(self.B["tower"])("Windows", "window"))
        if b.uvs is None:
            b.uvs = []
        # The window's own number, the same every build: which room is behind it.
        number = (i * 7919 + int(along * 13) * 31 + int(up * 7)) % 500
        side, sill, lintel = WINDOW_SURROUND
        base = len(b.verts)
        for da, du, u, v in ((-w / 2 - side, -sill, 0, 0), (w / 2 + side, -sill, 1, 0), (w / 2 + side, h + lintel, 1, 1), (-w / 2 - side, h + lintel, 0, 1)):
            b.verts.append(self.P(i, along + da, off, up + du))
            b.uvs.append((u + (2 if lit else 0), v + 2 * number))
        b.faces.append((base, base + 1, base + 2, base + 3))

    def light(self, at, glow: str, reach: float, strength: float) -> None:
        """A coloured light at `at`, in a glowing material's colour: it lights the ground, and what stands on it,
        out to `reach` metres, `strength` strong beneath it against a street lamp's 1."""
        self.lights.append((at[0], at[1], glow, reach, strength))

    def halo(self, at, glow: str) -> None:
        """The glow in the air round a light: four corners at one place, which the app spreads to face the eye. Its
        UV is the corner, 0 or 1 each way; its colour the light's."""
        b = self.B.setdefault("halos:" + glow, type(self.B["tower"])("Halos", glow))
        if b.uvs is None:
            b.uvs = []
        base = len(b.verts)
        for u, v in ((0, 0), (1, 0), (1, 1), (0, 1)):
            b.verts.append(tuple(at))
            b.uvs.append((u, v))
        b.faces.append((base, base + 1, base + 2, base + 3))

    def fence(self, i: int, off: float, height: float) -> None:
        """A railing from this sample of the road to the next: one flat panel, whose posts and rails the app draws.
        Its UV is the metres along the road and the share of its height."""
        b = self.B.setdefault("fences", type(self.B["tower"])("Fences", "rail"))
        if b.uvs is None:
            b.uvs = []
        base = len(b.verts)
        for j, up, v in ((i, 0.0, 0.0), (i + 1, 0.0, 1.0), (i + 1, height, 1.0), (i, height, 0.0)):
            b.verts.append(self.road.at(j, off, 0.12 + up))
            b.uvs.append((j * self.step, up / height))
        b.faces.append((base, base + 1, base + 2, base + 3))
