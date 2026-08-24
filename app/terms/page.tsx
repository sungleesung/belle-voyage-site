import type { Metadata } from "next";
import { Doc, CONTACT } from "@/components/Doc";

export const metadata: Metadata = { title: "Terms of service — Belle Voyage Estates" };

export default function Page() {
  return (
    <Doc title="Terms of service" updated="21 August 2026">
      <p>
        These terms cover the use of this website. They do not cover a tenancy,
        a purchase or a management agreement — each of those is its own signed
        contract, and where these terms and that contract disagree, the contract
        wins.
      </p>

      <h2>Who we are</h2>
      <p>
        Belle Voyage Estates, founded in Windsor, Ontario, operating across
        Canada, the United States, the United Kingdom and Europe. Reach us at{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>

      <h2>What the listings are</h2>
      <p>
        Descriptions, measurements, prices and availability are given in good
        faith and can change without notice. A listing is an invitation to
        enquire, not an offer, and nothing on this site forms a contract on its
        own. Where a page is marked as a template or as an example, the
        properties on it are illustrative and are not available.
      </p>
      <p>
        Areas are stated in the unit customary to the market — square metres in
        Europe, square feet in North America — and are approximate.
      </p>

      <h2>Using the site</h2>
      <p>
        Use it for the purpose it exists for: finding a property, or asking us
        something. Do not attempt to break it, scrape it wholesale, submit
        automated enquiries, or use it to send anything unlawful.
      </p>

      <h2>What we do not promise</h2>
      <p>
        The site is provided as it is. We do not promise it will always be
        available or free of error, and we are not liable for loss arising from
        relying on it. Nothing here limits liability that cannot be limited by
        law, including for death or personal injury caused by negligence, or for
        fraud.
      </p>

      <h2>Other people&rsquo;s material</h2>
      <p>
        The map is © OpenStreetMap contributors, served by OpenFreeMap. The rest
        of the site — words, marks and drawings — belongs to Belle Voyage
        Estates.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the law of Ontario, Canada, and the courts
        of Ontario have jurisdiction. If you deal with us as a consumer
        elsewhere, this does not remove protections you have where you live.
      </p>
    </Doc>
  );
}
