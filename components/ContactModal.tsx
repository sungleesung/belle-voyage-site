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

  /* Whatever had focus when it opened, so closing returns there. */
  const from = useRef<HTMLElement | null>(null);
  const everOpened = useRef(false);
  useEffect(() => onView((v) => {
    setOpen(v === "contact");
    if (v === "contact") {
      from.current = document.activeElement as HTMLElement | null;
      setOpening((n) => n + 1);
    }
  }), []);

  /* A native dialog carries the focus trap, the Escape key and the inert
     background itself. Hand-rolling those is where modals usually go wrong. */
  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    if (open && !el.open) { everOpened.current = true; el.showModal(); return; }
    if (!open && el.open) {
      el.close();
      /* After close(), never before. A dialog restores focus itself on close,
         to whatever was focused when it opened — which here is a link inside a
         hidden menu, so the restore is refused and focus lands on <body>.
         Anything we do earlier in the same commit gets overwritten by that. */
      if (!everOpened.current) return;
      const back = from.current;
      /* isConnected is the wrong question: hidden={!open} does not unmount the
         menu's links, it makes them unfocusable. And the stop on the line is
         aria-hidden with tabindex -1, so leaving focus there means the next Tab
         restarts from the top of the document. */
      /* getClientRects, not offsetParent — offsetParent is null for any
         position:fixed element whether or not it is visible. */
      const usable = back?.isConnected && back.getClientRects().length > 0
        && !back.closest("svg") ? back : null;
      (usable ?? document.querySelector<HTMLElement>(".mh-burger"))
        ?.focus({ preventScroll: true });
    }
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
