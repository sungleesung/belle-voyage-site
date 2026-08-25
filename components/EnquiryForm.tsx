"use client";
import { useEffect, useId, useRef, useState } from "react";
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
  /* Keyed on this, so an identical second rejection remounts the message. A
     role="alert" whose text React merely reconciles never fires again, and the
     field already holds focus, so nothing else would have spoken. */
  const [seq, setSeq] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const uid = useId();
  const done = useRef<HTMLDivElement>(null);
  const alert = useRef<HTMLParagraphElement>(null);

  /* Disabling the button while sending blurs the thing the user just pressed,
     and nothing else would take focus — it fell to <body>, which inside the
     popup is outside the dialog altogether. Moving focus deliberately also
     gets the result announced: a live region inserted with its text already in
     it is the one case screen readers reliably miss. */
  useEffect(() => { if (state === "done") done.current?.focus(); }, [state]);
  /* The message belongs to a field, so it renders under that field and is
     named by it. It used to sit above the button — up to 344px from the input
     it was about, and connected to it by nothing a screen reader could follow,
     so focus landed on a field whose problem was announced nowhere. */
  const at = (name: string) =>
    err?.field === name
      ? { "aria-invalid": true as const, "aria-describedby": `${uid}-${name}` }
      : {};

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
      setSeq((n) => n + 1);
      setState("idle");
    } catch {
      setErr({ message: "Could not reach the server. Please try again." });
      setSeq((n) => n + 1);
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
       whichever browser you are in.

       Labelled by id rather than wrapped: an error rendered inside its own
       <label> becomes part of the field's accessible name, and the name was
       being read out as "EMAIL That email address looks wrong."

       role="alert" on the message as well as aria-describedby, because the
       second identical rejection announced nothing at all — the field already
       held focus, so re-focusing it fired no event and there was no live
       region left to speak. */
    <form className="ct-form" ref={form} onSubmit={submit} noValidate>
      <div className="ct-row">
        <div className="ct-f">
          <label htmlFor={`${uid}-name-f`}>Name</label>
          <input id={`${uid}-name-f`} name="name" type="text" autoComplete="name"
            {...at("name")} required />
          {err?.field === "name" &&
            <em className="ct-fe" role="alert" key={seq} id={`${uid}-name`}>{err.message}</em>}
        </div>
        <div className="ct-f">
          <label htmlFor={`${uid}-email-f`}>Email</label>
          <input id={`${uid}-email-f`} name="email" type="email" autoComplete="email"
            {...at("email")} required />
          {err?.field === "email" &&
            <em className="ct-fe" role="alert" key={seq} id={`${uid}-email`}>{err.message}</em>}
        </div>
      </div>
      <div className="ct-f">
        <label htmlFor={`${uid}-subject-f`}>Subject</label>
        <input id={`${uid}-subject-f`} name="subject" type="text" {...at("subject")} required />
        {err?.field === "subject" &&
          <em className="ct-fe" role="alert" key={seq} id={`${uid}-subject`}>{err.message}</em>}
      </div>
      <div className="ct-f">
        <label htmlFor={`${uid}-message-f`}>Message</label>
        <textarea id={`${uid}-message-f`} name="message" rows={5} {...at("message")} required />
        {err?.field === "message" &&
          <em className="ct-fe" role="alert" key={seq} id={`${uid}-message`}>{err.message}</em>}
      </div>

      {/* Off-screen rather than display:none — a bot that checks visibility
          still fills it, and filling it is the whole tell. */}
      <div className="ct-pot" aria-hidden="true">
        <label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {/* Only what no field owns — a network failure, a rate limit. */}
      {err && !err.field &&
        <p className="ct-err" ref={alert} role="alert" tabIndex={-1}>{err.message}</p>}

      <button className="ct-send" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send"} <Arrow dir="right" size={20} />
      </button>
    </form>
  );
}
