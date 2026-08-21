"use client";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./Arrow";

/* One form, two doorways — the section at the foot of the page and the popup
   Contact opens. The same component in both, so there is no second copy to
   drift. Fields are wrapped in their labels, so nothing needs an id and two
   instances can sit in the DOM together without colliding.

   It posts with fetch rather than navigating. A native submit sent the visitor
   to whatever the endpoint returned, which on a form like this means leaving
   the page to read a one-line answer. */
export function EnquiryForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState<{ message: string; field?: string } | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLDivElement>(null);
  const alert = useRef<HTMLParagraphElement>(null);

  /* Disabling the button while sending blurs the thing the user just pressed,
     and nothing else would take focus — it fell to <body>, which inside the
     popup is outside the dialog altogether. Moving focus deliberately also
     gets the result announced: a live region inserted with its text already in
     it is the one case screen readers reliably miss. */
  useEffect(() => { if (state === "done") done.current?.focus(); }, [state]);
  useEffect(() => {
    if (!err) return;
    const field = err.field
      ? form.current?.querySelector<HTMLElement>(`[name="${err.field}"]`)
      : null;
    (field ?? alert.current)?.focus();
  }, [err]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (r.ok) { setState("done"); return; }
      const j = await r.json().catch(() => ({}));
      setErr({ message: j.error || "Something went wrong.", field: j.field });
      setState("idle");
    } catch {
      setErr({ message: "Could not reach the server. Please try again." });
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      /* Reachable again afterwards. Without this a visitor who sends one
         enquiry cannot send a second for the rest of the session, and the
         popup reopens onto a thank-you with no form behind it. */
      <div className="ct-done" ref={done} role="status" tabIndex={-1}>
        <p>Thank you — that has arrived. We answer everything within one working day.</p>
        <button type="button" className="ct-again" onClick={() => { setErr(null); setState("idle"); }}>
          Send another <Arrow dir="right" size={17} />
        </button>
      </div>
    );
  }

  return (
    /* The server owns validation, so the messages are ours and read the same
       whichever browser you are in. */
    <form className="ct-form" ref={form} onSubmit={submit} noValidate>
      <div className="ct-row">
        <label className="ct-f">
          <span>Name</span>
          <input name="name" type="text" autoComplete="name"
            aria-invalid={err?.field === "name" || undefined} required />
        </label>
        <label className="ct-f">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email"
            aria-invalid={err?.field === "email" || undefined} required />
        </label>
      </div>
      <label className="ct-f">
        <span>Subject</span>
        <input name="subject" type="text"
          aria-invalid={err?.field === "subject" || undefined} required />
      </label>
      <label className="ct-f">
        <span>Message</span>
        <textarea name="message" rows={5}
          aria-invalid={err?.field === "message" || undefined} required />
      </label>

      {/* Off-screen rather than display:none — a bot that checks visibility
          still fills it, and filling it is the whole tell. */}
      <div className="ct-pot" aria-hidden="true">
        <label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {err && <p className="ct-err" ref={alert} role="alert" tabIndex={-1}>{err.message}</p>}

      <button className="ct-send" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send"} <Arrow dir="right" size={20} />
      </button>
    </form>
  );
}
