import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { mailConfigured, sendEnquiry } from "@/lib/mail";

/* The contact form's only destination. It refuses rather than pretends: a form
   that answers "thanks" while dropping the message loses real enquiries and
   nobody finds out for weeks. */

const MAX = { name: 120, email: 160, subject: 200, message: 4000 };
const BODY_CAP = 32_000;

const str = (v: unknown, cap: number) =>
  typeof v === "string" ? v.trim().slice(0, cap) : "";

/* Length is checked BEFORE anything is trimmed to fit. Slicing silently threw
   away the end of a long message — including, in testing, the phone number the
   sender had put last — and still answered success. */
const over = (v: unknown, cap: number) =>
  typeof v === "string" && v.trim().length > cap;

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

/* Best effort, and only that: each serverless instance has its own memory, so
   this stops casual hammering rather than a determined script. It earns its
   place because the Resend key is shared with another site — a burnt quota
   would take that one down too. */
const hits = new Map<string, number[]>();
const RATE = { max: 5, window: 60 * 60 * 1000 };
function tooMany(req: NextRequest) {
  const raw = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "0.0.0.0";
  /* One-way, so what is held is a counter against a hash and never an address.
     The privacy policy says exactly this, so it has to stay true. */
  const ip = createHash("sha256")
    .update(raw + (process.env.IP_SALT || "belle-voyage")).digest("hex");
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const seen = (hits.get(ip) || []).filter((t) => now - t < RATE.window);
  seen.push(now);
  hits.set(ip, seen);
  return seen.length > RATE.max;
}

const fail = (error: string, status: number, field?: string) =>
  NextResponse.json(field ? { error, field } : { error }, { status });

export async function POST(req: NextRequest) {
  if (!originOk(req)) {
    /* Logged without the body: this is the one branch that refuses an enquiry
       outright, and a cross-origin redirect replaying a POST arrives here as
       `Origin: null`, so it needs to be diagnosable. */
    console.warn("[enquiry:origin]", req.headers.get("origin"), "vs", req.headers.get("host"));
    return fail("Rejected.", 403);
  }

  const raw = await req.text();
  if (raw.length > BODY_CAP) return fail("That message is too long.", 413);

  let body: unknown;
  try { body = JSON.parse(raw); } catch { return fail("Malformed request.", 400); }
  /* null is valid JSON, and reading a property off it threw a bare 500. */
  if (!body || typeof body !== "object" || Array.isArray(body))
    return fail("Malformed request.", 400);
  const b = body as Record<string, unknown>;

  /* Off-screen field no human sees. Answer 200 so the crawler is never taught
     that it was caught. */
  if (str(b.website, 200)) return NextResponse.json({ ok: true });

  const name = str(b.name, MAX.name);
  const email = str(b.email, MAX.email);
  const subject = str(b.subject, MAX.subject);
  const message = str(b.message, MAX.message);

  if (!name) return fail("Please add your name.", 422, "name");
  if (over(b.name, MAX.name)) return fail("That name is too long.", 422, "name");
  if (!emailOk(email)) return fail("That email address looks wrong.", 422, "email");
  if (!subject) return fail("Please add a subject.", 422, "subject");
  if (over(b.subject, MAX.subject)) return fail("That subject is too long.", 422, "subject");
  if (message.length < 10)
    return fail("Tell us a little more — a sentence is plenty.", 422, "message");
  if (over(b.message, MAX.message))
    return fail(`That message is over ${MAX.message} characters — please shorten it.`, 422, "message");

  if (tooMany(req))
    return fail("That is a lot of enquiries from one connection. Please try again later.", 429);

  if (!mailConfigured()) {
    /* Logged so the enquiry is at least diagnosable, then refused so the sender
       knows it did not get through. Runtime logs are kept for an hour on Hobby
       and a day on Pro, so this is a debugging aid and NOT durable storage —
       the guarantee that holds is that nobody is told "thanks" for a message
       that went nowhere. */
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
    const to = process.env.CONTACT_TO;
    return fail(
      to ? `We could not send that just now. Please try again, or email ${to}.`
         : "We could not send that just now. Please try again in a moment.",
      502,
    );
  }
  return NextResponse.json({ ok: true });
}
