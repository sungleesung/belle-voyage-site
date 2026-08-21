/* Resend over raw fetch, no dependency — which is what most of the other sites
   here do. Two invariants, both load-bearing:

   - A missing key is a no-op, never a throw. The route decides what that means.
   - reply_to is the person who wrote in, so the owner's address never appears
     on the page and Reply goes to the enquiry. */
type Sent = { ok: boolean; reason?: string };

export const mailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO);

export async function sendEnquiry(e: {
  name: string; email: string; subject: string; message: string;
}): Promise<Sent> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!key || !to) return { ok: false, reason: "not configured" };

  const body = {
    from: process.env.RESEND_FROM || "Belle Voyage Estates <onboarding@resend.dev>",
    to,
    reply_to: e.email,
    subject: `Enquiry — ${e.subject}`,
    text: [
      `Name     ${e.name}`,
      `Email    ${e.email}`,
      `Subject  ${e.subject}`,
      "",
      e.message,
    ].join("\n"),
  };

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("[enquiry:resend]", r.status, detail.slice(0, 300));
      return { ok: false, reason: `resend ${r.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[enquiry:resend]", (err as Error).message);
    return { ok: false, reason: (err as Error).message };
  }
}
