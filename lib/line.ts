/* The whole site is one line.

   Path space is 1000 wide; the visible frame is a window onto it that slides
   down during the intro. Every leg is vertical or 45° — the octilinear rule
   every transit diagram since Beck has obeyed. */

export type P = { x: number; y: number };

/* Verified octilinear: each step is either dx=0 or |dx| === |dy|. */
export const RUN: P[] = [
  { x: 620, y: -2940 }, { x: 620, y: -2740 },
  { x: 400, y: -2520 }, { x: 400, y: -2340 },
  { x: 700, y: -2040 }, { x: 700, y: -1840 },
  { x: 420, y: -1560 }, { x: 420, y: -1380 },
  { x: 720, y: -1080 }, { x: 720, y:  -880 },
  { x: 420, y:  -580 }, { x: 420, y:  -400 },
  { x: 140, y:  -120 }, { x: 140, y:    60 },
  { x: 620, y:   540 },                        // ← the landing diagonal
];

/* Stops passed at speed on the way down. They exist to be blurred past. */
export const PASSED: P[] = [
  { x: 400, y: -2340 }, { x: 700, y: -1840 },
  { x: 420, y: -1380 }, { x: 720, y:  -880 }, { x: 420, y: -400 },
];

export const HERO_A: P = { x: 140, y: 60 };
export const HERO_B: P = { x: 620, y: 540 };

/* The three stops sit at quarter points of the landing diagonal. */
export const STOPS = [
  { t: 0.25, shape: "circle"   as const, label: "Properties", href: "/properties" },
  { t: 0.50, shape: "square"   as const, label: "About",      href: "/about" },
  { t: 0.75, shape: "triangle" as const, label: "Contact",    href: "#contact" },
];

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const at = (t: number): P => ({
  x: lerp(HERO_A.x, HERO_B.x, t),
  y: lerp(HERO_A.y, HERO_B.y, t),
});

/* Straightened: the same run, centred, dropping vertically. */
export const CENTRE_X = 380;   /* midpoint of the safe frame, not of path space */
export const straight = (t: number): P => ({ x: CENTRE_X, y: at(t).y });

export const d = (pts: P[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

/* The three regions, in the order the line meets them going down. */
export const BANDS = [
  { code: "CA", name: "Canada",        colour: "var(--ca)" },
  { code: "US", name: "United States", colour: "var(--us)" },
  { code: "EU", name: "Europe",        colour: "var(--eu)" },
];

/* The frame must always contain this box, whatever the viewport shape. */
const SAFE = { x: 60, y: 0, w: 640, h: 600 };
export function frame(w: number, h: number) {
  const ar = Math.max(w, 1) / Math.max(h, 1);
  const safeAr = SAFE.w / SAFE.h;
  const vw = ar > safeAr ? SAFE.h * ar : SAFE.w;
  const vh = ar > safeAr ? SAFE.h : SAFE.w / ar;
  const cx = SAFE.x + SAFE.w / 2;
  const cy = SAFE.y + SAFE.h / 2;
  return { x: cx - vw / 2, y: cy - vh / 2, w: vw, h: vh };
}
