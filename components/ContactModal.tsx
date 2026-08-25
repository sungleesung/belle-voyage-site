"use client";
import { useEffect, useRef, useState } from "react";
import { EnquiryForm } from "./EnquiryForm";
import { onView, setView } from "@/lib/overlay";

export function ContactModal() {
  const [open, setOpen] = useState(false);
  /* A dialog's children stay mounted when it closes, so a form left on its
     confirmation was still on it the next time the popup opened. Keying the
     form to the opening gives each one a blank sheet. */
  const [opening, setOpening] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);

  /* Whatever had focus when it opened, so closing returns there. The menu link
     is often gone by then — the menu closes underneath — so fall back to the
     stop on the line rather than dropping focus on <body>. */
  const from = useRef<HTMLElement | null>(null);
  useEffect(() => onView((v) => {
    setOpen(v === "contact");
    if (v === "contact") {
      from.current = document.activeElement as HTMLElement | null;
      setOpening((n) => n + 1);
    }
  }), []);

  useEffect(() => {
    if (open) return;
    const back = from.current;
    /* Opened from the masthead menu, the link that opened it is gone — the
       menu is hidden={!open} and unmounts it. The burger is what stands in its
       place on screen; the stop on the line is aria-hidden and no place to
       leave focus. */
    const fallback = document.querySelector<HTMLElement>(".mh-burger");
    const target = back?.isConnected ? back : fallback;
    target?.focus({ preventScroll: true });
  }, [open]);

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
      <div className="cm-wrap">
        <div className="cm-frame">
          <button className="cm-x" type="button" onClick={() => setView(null)}>
            <span className="sr">Close</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 5 19 19M19 5 5 19" />
            </svg>
          </button>
          <div className="cm-panel">
            <h2 id="cm-title">Get in touch</h2>
            <EnquiryForm key={opening} />
          </div>
        </div>
      </div>
    </dialog>
  );
}
