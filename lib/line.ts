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
export const C: P = { x: 820, y: 1900 };  // the second corner
/* ── off ─────────────────────────────────────────────────────── */
export const D: P = { x: -1400, y: 1900 };

export const RUN: P[] = [...INTRO, B, C, D];
export const ONWARD: P[] = [{ x: A.x, y: A.y - 260 }, A, B, C, D];

/* Three stops on the diagonal. Shapes, not colours — this is navigation. */
export const STOPS = [
  { t: 0.24, shape: "circle"   as const, label: "Properties", href: "/properties" },
  { t: 0.50, shape: "square"   as const, label: "About",      href: "/about" },
  { t: 0.76, shape: "triangle" as const, label: "Contact",    href: "#contact" },
];

/* Three stops on the vertical. Colours, because these ARE the regions. */
export const REGIONS = [
  { code: "CA", name: "Canada",        colour: "var(--ca)", y: 1120, href: "/properties?market=ca" },
  { code: "US", name: "United States", colour: "var(--us)", y: 1350, href: "/properties?market=us" },
  { code: "EU", name: "Europe",        colour: "var(--eu)", y: 1580, href: "/properties?market=eu" },
];

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const onDiag = (t: number): P => ({ x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t) });

export const d = (pts: P[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");

/* The camera is a translate applied to the whole drawing. These are the frames
   the journey passes through; scroll interpolates between them. */
export const FRAMES: { at: number; x: number; y: number }[] = [
  { at: 0.00, x:    0, y:     0 },   // the landing diagonal, framed
  { at: 0.18, x: -320, y:  -320 },   // arriving at the first corner
  { at: 0.44, x: -640, y:  -830 },   // standing off left, all three regions in view
  { at: 0.66, x: -640, y: -1380 },   // the second corner
  { at: 0.78, x: -640, y: -1380 },   // held, while it changes colour
  { at: 0.95, x:-3300, y: -1380 },   // gone, off the left
  { at: 1.00, x:-3300, y: -1380 },
];

export function cameraAt(p: number) {
  for (let i = 1; i < FRAMES.length; i++) {
    const a = FRAMES[i - 1], b = FRAMES[i];
    if (p <= b.at) {
      const k = (p - a.at) / (b.at - a.at);
      return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) };
    }
  }
  const last = FRAMES[FRAMES.length - 1];
  return { x: last.x, y: last.y };
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
