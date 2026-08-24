"use client";
import { useEffect, useState } from "react";
import { STOPS } from "@/lib/line";
import { getView, onView, openContact, setView, type View } from "@/lib/overlay";
import { getLenis } from "@/lib/lenis";

const LEGAL = [
  { label: "Privacy policy",   href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "AI usage policy",  href: "/ai-usage" },
  { label: "Site map",         href: "/sitemap" },
];

/* Reading sessionStorage THROWS, not returns null, when the browser is set to
   block storage — and this runs in an effect, so the throw takes the app down. */
const arrived = () => {
  try { return !!sessionStorage.getItem("bv-arrived"); } catch { return false; }
};

export function Masthead() {
  const [view, setLocal] = useState<View>(getView());
  const open = view === "menu";

  useEffect(() => onView(setLocal), []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setView(null);
    addEventListener("keydown", esc);
    document.documentElement.classList.toggle("menu-open", view !== null);
    /* overflow:hidden does not hold Lenis — it keeps scrolling the page behind
       the overlay. Only stopping it does. Restart is gated on the intro having
       landed, or an overlay opened mid-intro would hand scrolling back early. */
    if (view) getLenis()?.stop();
    /* Not while the camera is away on the About branch — it holds the scroll
       itself, and starting Lenis under it left the page scrolled a frame and a
       half off the drawing, which is a blank screen. Line.tsx applies the
       mirror of this guard when it hands the scroll back. */
    else if (arrived() && !document.documentElement.classList.contains("at-about"))
      getLenis()?.start();
    return () => { removeEventListener("keydown", esc);
      document.documentElement.classList.remove("menu-open"); };
  }, [view]);

  return (
    <>
    <div className="mh">
      <a className="mh-wm" href="/">
        Belle&nbsp;V<i className="ring" aria-hidden="true">
          <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38.3" fill="none"
            stroke="currentColor" strokeWidth="23.4" /></svg></i>yage&nbsp;Estates
      </a>

      <button className="mh-burger" type="button" aria-expanded={view !== null}
        aria-controls="mh-menu" onClick={() => setView(view ? null : "menu")}>
        <span className="sr">{view ? "Close" : "Open menu"}</span>
        <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
      </button>

    </div>

      <div id="mh-menu" className="mh-menu" data-open={open} hidden={!open}>
        <nav aria-label="Primary">
          {STOPS.map((s) => (
            /* Contact is a stop, not a page — it opens over the blur rather
               than replacing it. */
            <a key={s.label} href={s.href}
              onClick={s.href === "#contact" ? openContact : () => setView(null)}>
              {s.label}</a>
          ))}
        </nav>
        <div className="mh-legal">
          {LEGAL.map((l) => <a key={l.label} href={l.href}>{l.label}</a>)}
        </div>
      </div>
    </>
  );
}
