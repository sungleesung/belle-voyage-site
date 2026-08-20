"use client";
import { useEffect, useRef, useState } from "react";
import { EnquiryForm } from "./EnquiryForm";
import { onView, setView } from "@/lib/overlay";

/* Stations on the frame. Five, mixed shapes — the three the line already uses,
   so the popup is read as a piece of the same network rather than a dialog with
   decoration on it. Position is a percentage along one edge; the glyph straddles
   the stroke, which is what makes it a station ON the line and not beside it. */
const STATIONS = [
  { edge: "top",    at: "38%", shape: "triangle" },
  { edge: "right",  at: "29%", shape: "circle"   },
  { edge: "right",  at: "73%", shape: "square"   },
  { edge: "bottom", at: "44%", shape: "circle"   },
  { edge: "left",   at: "57%", shape: "square"   },
] as const;

/* 24-unit grid, 4-unit stroke — the icon construction from the brand book, so
   these are the same glyphs as the ones on the line, not lookalikes. */
function Glyph({ shape }: { shape: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {shape === "circle" && <circle cx="12" cy="12" r="8" />}
      {shape === "square" && <rect x="4" y="4" width="16" height="16" />}
      {shape === "triangle" && <path d="M12 3.4 21 19.6H3Z" />}
    </svg>
  );
}

export function ContactModal() {
  const [open, setOpen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => onView((v) => setOpen(v === "contact")), []);

  /* A native dialog carries the focus trap, the Escape key and the inert
     background itself. Hand-rolling those is where modals usually go wrong. */
  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    /* Escape closes the dialog directly, so the shared state has to hear it. */
    const sync = () => setView(null);
    el.addEventListener("close", sync);
    return () => el.removeEventListener("close", sync);
  }, []);

  return (
    <dialog ref={dlg} className="cm" aria-labelledby="cm-title"
      onClick={(e) => { if (e.target === dlg.current) setView(null); }}>
      {/* The stations live outside the frame: clip-path clips descendants, and
          inside it their outer halves were being sliced off at the edge. */}
      <div className="cm-wrap">
        <div className="cm-frame">
          <div className="cm-panel">
            <button className="cm-x" type="button" onClick={() => setView(null)}>
              <span className="sr">Close</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 5 19 19M19 5 5 19" />
              </svg>
            </button>
            <h2 id="cm-title">Get in touch</h2>
            <EnquiryForm />
          </div>
        </div>
        {STATIONS.map((s, i) => (
          <span key={i} className="cm-stop" data-edge={s.edge}
            style={{ ["--p" as string]: s.at }}>
            <Glyph shape={s.shape} />
          </span>
        ))}
      </div>
    </dialog>
  );
}
