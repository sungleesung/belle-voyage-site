import type { Metadata } from "next";
import { Doc, CONTACT } from "@/components/Doc";

export const metadata: Metadata = {
  alternates: { canonical: "/owners" },
  title: "For owners — Belle Voyage Estates",
  description: "Letting, short stay, management, compliance and development for property owners across Canada, the United States, the United Kingdom and Europe.",
};

export default function Page() {
  return (
    <Doc title="For owners">
      <p>
        If you own property and would rather not run it yourself, this is the
        side of Belle Voyage Estates that does that.
      </p>

      <h2>What we take on</h2>
      <ul>
        <li>Long-term letting — finding and referencing tenants, and holding the tenancy.</li>
        <li>Short stay — listing, pricing, turnover and guest contact.</li>
        <li>Day-to-day management — rent, maintenance, and the calls at nine on a Sunday.</li>
        <li>Compliance — the certificates, deposits and notices each jurisdiction requires.</li>
        <li>Development and wholesaling, where a property is worth more changed than kept.</li>
      </ul>

      <h2>Where we operate</h2>
      <p>
        Canada, the United States, the United Kingdom and Europe. Each of those
        has its own rules about deposits, notice and what a landlord may and may
        not do; the point of handing it over is not having to know all of them.
      </p>

      <h2>Talking to us</h2>
      <p>
        Tell us what you own and where, and what you want it to do. Write to{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a> or use the{" "}
        <a href="/#contact">contact form</a> — either reaches the same place.
      </p>
    </Doc>
  );
}
