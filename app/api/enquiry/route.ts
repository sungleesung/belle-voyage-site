import { NextRequest, NextResponse } from "next/server";
import { mailConfigured, sendEnquiry } from "@/lib/mail";

/* The contact form's only destination. It refuses rather than pretends: a form
   that answers "thanks" while dropping the message loses real enquiries and
   nobody finds out for weeks. */

const MAX = { name: 120, email: 160, subject: 200, message: 4000 };
const BODY_CAP = 32_000;

const str = (v: unknown, cap: number) =>
  typeof v === "string" ? v.trim().slice(0, cap) : "";

const emailOk = (e: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= MAX.email;

/* Origin must be present AND match. A missing Origin on a cross-site POST is
   the easy way past a check that only compares when one is supplied. */
function originOk(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.get("host"); }
  catch { return false; }
}

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  if (!originOk(req)) return fail("Rejected.", 403);

  const raw = await req.text();
  if (raw.length > BODY_CAP) return fail("That message is too long.", 413);

  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return fail("Malformed request.", 400); }

  /* Off-screen field no human sees. Answer 200 so the crawler is never taught
     that it was caught. */
  if (str(body.website, 200)) return NextResponse.json({ ok: true });

  const name = str(body.name, MAX.name);
  const email = str(body.email, MAX.email);
  const subject = str(body.subject, MAX.subject);
  const message = str(body.message, MAX.message);

  if (!name) return fail("Please add your name.", 422);
  if (!emailOk(email)) return fail("That email address looks wrong.", 422);
  if (!subject) return fail("Please add a subject.", 422);
  if (message.length < 10)
    return fail("Tell us a little more — a sentence is plenty.", 422);

  if (!mailConfigured()) {
    /* Logged so nothing written in good faith is lost, then refused so the
       sender knows to use another route. */
    console.error("[enquiry:unsent]", JSON.stringify({ name, email, subject, message }));
    const to = process.env.CONTACT_TO;
    return fail(
      to ? `The form is not connected yet. Please email ${to}.`
         : "The form is not connected yet. Please try again later.",
      503,
    );
  }

  const sent = await sendEnquiry({ name, email, subject, message });
  if (!sent.ok) {
    console.error("[enquiry:unsent]", JSON.stringify({ name, email, subject, message }));
    return fail("We could not send that just now. Please try again.", 502);
  }
  return NextResponse.json({ ok: true });
}
