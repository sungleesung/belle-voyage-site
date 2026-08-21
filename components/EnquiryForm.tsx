"use client";
import { useState } from "react";
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
  const [err, setErr] = useState<string | null>(null);

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
      setErr(j.error || "Something went wrong.");
      setState("idle");
    } catch {
      setErr("Could not reach the server. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="ct-done" role="status" tabIndex={-1}>
        Thank you — that has arrived. We answer everything within one working day.
      </p>
    );
  }

  return (
    /* The server owns validation, so the messages are ours and read the same
       whichever browser you are in. */
    <form className="ct-form" onSubmit={submit} noValidate>
      <div className="ct-row">
        <label className="ct-f">
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" required />
        </label>
        <label className="ct-f">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
      </div>
      <label className="ct-f">
        <span>Subject</span>
        <input name="subject" type="text" required />
      </label>
      <label className="ct-f">
        <span>Message</span>
        <textarea name="message" rows={5} required />
      </label>

      {/* Off-screen rather than display:none — a bot that checks visibility
          still fills it, and filling it is the whole tell. */}
      <div className="ct-pot" aria-hidden="true">
        <label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {err && <p className="ct-err" role="alert">{err}</p>}

      <button className="ct-send" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send"} <Arrow dir="right" size={20} />
      </button>
    </form>
  );
}
