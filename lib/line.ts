/* One line, one journey.

   The line never rotates. It is a single continuous octilinear path that turns,
   and the camera follows it down: a fast winding descent, then the landing
   diagonal, then straight down through the regions, then hard left off screen.

   Path space is large; the frame is a window onto it. Every leg is vertical,
   horizontal, or exactly 45°. */

export type P = { x: number; y: number };

/* ── the descent, travelled at speed ─────────────────────────── */
export const INTRO: P[] = [
  { x: 700, y: -3200 }, { x: 700, y: -2960 },
  { x: 420, y: -2680 }, { x: 420, y: -2440 },
  { x: 760, y: -2100 }, { x: 760, y: -1860 },
  { x: 400, y: -1500 }, { x: 400, y: -1260 },
  { x: 780, y:  -880 }, { x: 780, y:  -640 },
  { x: 420, y:  -280 }, { x: 420, y:  -100 },
  { x: 180, y:   140 }, { x: 180, y:   200 },
];
/* Stops that fly past on the way down. */
export const FLYBY: P[] = [
  { x: 420, y: -2440 }, { x: 760, y: -1860 },
  { x: 400, y: -1260 }, { x: 780, y:  -640 }, { x: 420, y: -100 },
];

/* ── the landing: the diagonal you arrive on ─────────────────── */
export const A: P = { x: 180, y: 200 };   // top of the diagonal
export const B: P = { x: 820, y: 840 };   // the first corner
/* ── the regions: straight down ──────────────────────────────── */
export const C: P = { x: 820, y: 4200 };  // the foot of the vertical

export const RUN: P[] = [...INTRO, B, C];
export const ONWARD: P[] = [{ x: A.x, y: A.y - 260 }, A, B, C];

/* Three stops on the diagonal. Shapes, not colours — this is navigation. */
export const STOPS = [
  { t: 0.24, shape: "circle"   as const, label: "Properties", href: "/properties" },
  { t: 0.50, shape: "square"   as const, label: "About",      href: "/about" },
  { t: 0.76, shape: "triangle" as const, label: "Contact",    href: "#contact" },
];

/* Three stops on the vertical. Colours, because these ARE the regions. */
export const REGIONS_TITLE_Y = 1010;
export const REGIONS = [
  { code: "CA", name: "Canada",        colour: "var(--ca)", y: 1140, href: "/properties?market=ca" },
  { code: "US", name: "United States", colour: "var(--us)", y: 1330, href: "/properties?market=us" },
  { code: "EU", name: "Europe",        colour: "var(--eu)", y: 1520, href: "/properties?market=eu" },
];

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const onDiag = (t: number): P => ({ x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t) });

export function dRound(pts: P[], r = 240) {
  if (pts.length < 3) return d(pts);
  let out = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], a = pts[i - 1], b = pts[i + 1];
    const la = Math.hypot(a.x - p.x, a.y - p.y), lb = Math.hypot(b.x - p.x, b.y - p.y);
    const rr = Math.min(r, la / 2, lb / 2);
    const s1 = { x: p.x + ((a.x - p.x) / la) * rr, y: p.y + ((a.y - p.y) / la) * rr };
    const s2 = { x: p.x + ((b.x - p.x) / lb) * rr, y: p.y + ((b.y - p.y) / lb) * rr };
    out += ` L${s1.x.toFixed(1)} ${s1.y.toFixed(1)} Q${p.x} ${p.y} ${s2.x.toFixed(1)} ${s2.y.toFixed(1)}`;
  }
  const e = pts[pts.length - 1];
  return out + ` L${e.x} ${e.y}`;
}

export const d = (pts: P[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");

/* The camera is a translate applied to the whole drawing. These are the frames
   the journey passes through; scroll interpolates between them. */
export const FRAMES: { at: number; x: number; y: number }[] = [
  { at: 0.00, x:    0, y:     0 },   // the landing diagonal, framed
  { at: 0.20, x: -320, y:  -320 },   // arriving at the corner
  { at: 0.46, x: -640, y:  -745 },   // the heading and all three regions, together
  { at: 0.64, x: -620, y:  -830 },   // still descending — never a dead stop
  { at: 0.84, x: -430, y:  -905 },   // drifting to centre before it grows
  { at: 1.00, x: -330, y:  -980 },   // so the black opens outward, not sideways
];

/* Monotone cubic Hermite (Fritsch–Carlson).
   Linear interpolation makes every waypoint a velocity step — the old table
   slammed to a stop for 561px then fired sideways at 6.3x its previous top
   speed. Easing each segment instead would stop the camera AT every waypoint,
   which is worse. Catmull-Rom overshoots, which an octilinear design cannot
   have. This is C1 and provably never overshoots a keyframe. */
function tangents(at: number[], v: number[]) {
  const n = at.length, d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d[i] = (v[i + 1] - v[i]) / (at[i + 1] - at[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], sq = a * a + b * b;
    if (sq > 9) { const t = 3 / Math.sqrt(sq); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return m;
}
const AT = FRAMES.map((f) => f.at);
const MX = tangents(AT, FRAMES.map((f) => f.x));
const MY = tangents(AT, FRAMES.map((f) => f.y));

function hermite(i: number, p: number, v: number[], m: number[]) {
  const h = AT[i + 1] - AT[i], t = (p - AT[i]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * v[i] + (t3 - 2 * t2 + t) * h * m[i]
       + (-2 * t3 + 3 * t2) * v[i + 1] + (t3 - t2) * h * m[i + 1];
}

const FX = FRAMES.map((f) => f.x);
const FY = FRAMES.map((f) => f.y);

/* A phone held upright sees roughly three times as much of the path vertically
   as a laptop does, so the diagonal's last stop is still on screen when the
   regions arrive — where a laptop has long since left it behind. Running the
   full 640-unit pan drags that stop off the left edge while its label is still
   on it, leaving a caption with nothing to caption. The frame cannot simply be
   widened: holding the vertical on screen and pushing the stop fully off it are
   mutually exclusive in an 880-unit window. So the pan is capped instead, and
   the stop stays visible. -510 is the tightest cap that still clears the stop
   and keeps the whole region plate inside the frame at the end of the pan. */
const PAN_CAP = -510;
const FXP = FX.map((x) => Math.max(x, PAN_CAP));
const MXP = tangents(AT, FXP);

/* Portrait enough for the cap to matter. Every iPad in portrait is under this
   (12.9in is 0.75, the rest run 0.66-0.70) and takes the cap too — which is
   right: they use the same 880-unit frame a phone does. */
export const capPan = (w: number, h: number) => w / Math.max(h, 1) < 0.72;

export function cameraAt(p: number, capped = false) {
  const q = Math.min(1, Math.max(0, p));
  let i = 0;
  while (i < AT.length - 2 && q > AT[i + 1]) i++;
  return {
    x: hermite(i, q, capped ? FXP : FX, capped ? MXP : MX),
    y: hermite(i, q, FY, MY),
  };
}

/* The frame is a window onto path space. It must always contain this box,
   whatever shape the viewport is — and it is deliberately tight, so the line
   reads as something you are standing close to. */
const SAFE = { x: 100, y: 170, w: 880, h: 700 };
export function frame(w: number, h: number) {
  const ar = Math.max(w, 1) / Math.max(h, 1);
  const safeAr = SAFE.w / SAFE.h;
  const vw = ar > safeAr ? SAFE.h * ar : SAFE.w;
  const vh = ar > safeAr ? SAFE.h : SAFE.w / ar;
  return { x: SAFE.x + SAFE.w / 2 - vw / 2, y: SAFE.y + SAFE.h / 2 - vh / 2, w: vw, h: vh };
}

export const STROKE = 34;   /* thick. we are close to it. */
