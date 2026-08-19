const D: Record<string, string> = {
  right: "M3 12h16M13 6l6 6-6 6",
  down:  "M12 3v16M6 13l6 6 6-6",
  left:  "M21 12H5M11 6l-6 6 6 6",
};
/* Head apex 90°, per the sign manual. Direction is semantic. */
export function Arrow({ dir = "right", size = 18 }: { dir?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={D[dir] ?? D.right} />
    </svg>
  );
}
