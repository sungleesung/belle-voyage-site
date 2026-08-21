/* One line, one journey.

   The line never rotates. It is a single continuous octilinear path that turns,
   and the camera follows it down: a fast winding descent, then the landing
   diagonal, then straight down through the regions, then hard left off screen.

   Path space is large; the frame is a window onto it. Every leg is vertical,
   horizontal, or exactly 45°. */

export type P = { x: number; y: number };

/* ── the descent ──────────────────────────────────────────────
   Straight down, one detour left, then straight down onto A. The line runs
   down the left of the opening frame, so the path needs length above the
   camera as well as below it, or it starts in mid-air. */
export const INTRO: P[] = [
  { x: 420, y: -5100 },   // lead-in, always off-frame above
  { x: 420, y: -1500 },   // the long straight run
  { x: 180, y: -1260 },   // the detour, one 45 degree jog left
  { x: 180, y:   200 },   // down onto A, where the landing begins
];
/* Where the camera sits before it moves, and how far along INTRO that is.
   The lead-in is a single straight segment, so this length is exact.

   It has to clear the top of the frame at 1x, and the frame that matters is a
   phone in portrait: 1904 units tall against a laptop's 700. The line's topmost
   pixel sits at frame y 470 - LEAD - 17 and the frame top is 520 - 440/ar, so
   the lead only clears when LEAD > 440/ar - 67. At 600 it cleared only down to
   aspect 0.66 — every phone in portrait showed the line stopping dead in a
   rounded cap a sixth of the way down, with nothing above it. 1900 clears to
   aspect 0.224, past anything that exists. */
export const LEAD = 1900;

/* Stops passed on the way down. All on the straight runs — a station on a
   corner reads as a mistake. */
export const FLYBY: P[] = [
  /* The first sits exactly on the camera's resting point: it is the station
     the opening frame is built around, the one the wordmark plate names. It is
     not dismissed with the plate — like every other stop it gets left behind
     on the line as the camera pulls away. */
  { x: 420, y: -3200 },
  { x: 420, y: -2900 }, { x: 420, y: -2350 }, { x: 420, y: -1800 },
  { x: 180, y:  -950 }, { x: 180, y:  -400 },
];

/* ── the landing: the diagonal you arrive on ─────────────────── */
export const A: P = { x: 180, y: 200 };   // top of the diagonal
export const B: P = { x: 820, y: 840 };   // the first corner
/* ── the regions: straight down ──────────────────────────────── */
export const C: P = { x: 820, y: 4200 };  // the foot of the vertical

export const RUN: P[] = [...INTRO, B, C];
/* The lead above A obeys the same rule as LEAD: at 260 the landing showed a
   rounded line-end a fifth of the way down a portrait frame. Off-frame on a
   laptop either way, so this is only ever visible on a phone. */
export const ONWARD: P[] = [{ x: A.x, y: A.y - 1700 }, A, B, C];

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

/* Where inside the pin the scroll is allowed to rest: the landing, and the
   frame that holds the heading and all three regions together. Everything
   between them is a transition — a half-drawn wipe, a half-grown swallow — and
   1 is deliberately absent: the pin ends on solid black with the contact sheet
   still below the fold, which is the one place worth never stopping. The last
   rest is the top of the contact sheet, just past the pin — and it is the last
   one there is. Below it the page is ordinary reading and typing, and settling
   over content taller than the frame puts the submit button somewhere the user
   is not allowed to stand. */
export const REST_P: number[] = [0, 0.46];

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

/* Where the camera holds the line before it moves. Left of centre, because the
   opening frame is the line down the left with its first station named beside
   it — and everything to the right of it is the plate's room. */
export const INTRO_ANCHOR = { x: 300, y: 470 };

/* Where the plate sits: clear of the station's own radius, then a gap. */
export const PLATE_GAP = 58;
