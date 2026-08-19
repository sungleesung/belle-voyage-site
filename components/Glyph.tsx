import type { StationType } from "@/lib/net";

/* fill = paper, stroke = ink, 4 units on a 24-unit grid — both tokens, so every
   glyph inverts between themes with no redraw. */
export function Glyph({ type, size = 24 }: { type: StationType; size?: number }) {
  const p = { fill: "var(--paper)", stroke: "var(--ink)", strokeWidth: 3.4, strokeLinejoin: "round" as const };
  const inner =
    type === "apartment" ? <circle cx="12" cy="12" r="8.4" {...p} /> :
    type === "house"     ? <polygon points="12,3.1 20.6,18.6 3.4,18.6" {...p} /> :
    type === "building"  ? <rect x="3.8" y="3.8" width="16.4" height="16.4" {...p} /> :
    type === "short"     ? <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" {...p} /> :
                           <ellipse cx="12" cy="12" rx="9" ry="6.4" {...p} />;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{inner}</svg>;
}

/* The letter inside a bullet is 53.1% of the diameter — the manual's 5 5/16"
   letter in a 10" disc. font-size = 0.531 / 0.717 x 100 = 74.1 on a 100 box. */
export function Bullet({ ch, fill = "var(--ink)", fg = "var(--paper)", size = 34, title }:
  { ch: string; fill?: string; fg?: string; size?: number; title?: string }) {
  const two = ch.length > 1;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img"
      aria-label={title ?? SERVICE_NAMES[ch] ?? ch}>
      <circle cx="50" cy="50" r="50" fill={fill} />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
        fontFamily="Helvetica Neue,Helvetica,Arial" fontWeight="700"
        fontSize={two ? 52 : 74.1} letterSpacing={two ? -3.2 : -1} fill={fg}>{ch}</text>
    </svg>
  );
}

/* The diamond means limited hours of service — not express. 10¾" on the diagonal
   against a 10" disc. */
export function Diamond({ ch, fill = "var(--ink)", fg = "var(--paper)", size = 36, title }:
  { ch: string; fill?: string; fg?: string; size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img"
      aria-label={title ?? SERVICE_NAMES[ch] ?? ch}>
      <rect x="16.5" y="16.5" width="67" height="67" transform="rotate(45 50 50)" fill={fill} />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
        fontFamily="Helvetica Neue,Helvetica,Arial" fontWeight="700"
        fontSize="63" fill={fg}>{ch}</text>
    </svg>
  );
}

/* Arrow head apex 90°, per the manual. Direction is semantic: it predicts the
   move, and the page then makes it. */
export const SERVICE_NAMES: Record<string, string> = {
  S: "Sales", R: "Rental", M: "Management", V: "Voyage",
  CA: "Canada", US: "United States", EU: "Europe",
};

export const ARROWS: Record<string, string> = {
  right: "M3 12h16M13 6l6 6-6 6",
  down:  "M12 3v16M6 13l6 6 6-6",
  left:  "M21 12H5M11 6l-6 6 6 6",
};
export function Arrow({ dir = "right", size = 18 }: { dir?: keyof typeof ARROWS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ARROWS[dir] ?? ARROWS.right} />
    </svg>
  );
}
