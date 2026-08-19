"use client";
import { Arrow } from "./Glyph";

/* Every item carries an arrow to its left — the manual's rule — and the arrow's
   direction predicts the move the page then makes. */
const ITEMS = [
  { label: "Properties", href: "#board",    dir: "right" },
  { label: "Markets",    href: "#markets",  dir: "right" },
  { label: "Owners",     href: "#paths",    dir: "down"  },
];

export function Nav() {
  return (
    <nav className="nav" aria-label="Primary">
      {ITEMS.map((i) => (
        <a key={i.label} className="nav-a" href={i.href} data-dir={i.dir}>
          <Arrow dir={i.dir} size={16} />
          <span>{i.label}</span>
        </a>
      ))}
    </nav>
  );
}
