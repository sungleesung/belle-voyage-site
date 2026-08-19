"use client";
import { useEffect, useState } from "react";
import { STOPS } from "@/lib/line";

const LEGAL = [
  { label: "Privacy policy",   href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "AI usage policy",  href: "/ai-usage" },
  { label: "Site map",         href: "/sitemap" },
];

export function Masthead() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc);
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { removeEventListener("keydown", esc); document.documentElement.style.overflow = ""; };
  }, [open]);

  return (
    <div className="mh">
      <a className="mh-wm" href="/">
        Belle V<i className="ring" aria-hidden="true">
          <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38.3" fill="none"
            stroke="currentColor" strokeWidth="23.4" /></svg></i>yage
      </a>

      <button className="mh-burger" type="button" aria-expanded={open}
        aria-controls="mh-menu" onClick={() => setOpen((v) => !v)}>
        <span className="sr">{open ? "Close menu" : "Open menu"}</span>
        <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
      </button>

      <div id="mh-menu" className="mh-menu" data-open={open} hidden={!open}>
        <nav aria-label="Primary">
          {STOPS.map((s) => (
            <a key={s.label} href={s.href} onClick={() => setOpen(false)}>{s.label}</a>
          ))}
        </nav>
        <div className="mh-legal">
          {LEGAL.map((l) => <a key={l.label} href={l.href}>{l.label}</a>)}
        </div>
      </div>
    </div>
  );
}
