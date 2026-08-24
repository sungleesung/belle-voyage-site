import type { Metadata } from "next";
import { Doc, CONTACT } from "@/components/Doc";

export const metadata: Metadata = {
  title: "Privacy policy — Belle Voyage Estates",
  description: "What this website does with information about you, described specifically rather than in general terms.",
};

export default function Page() {
  return (
    <Doc title="Privacy policy" updated="21 August 2026">
      <p>
        This policy describes what this website does with information about you.
        It is deliberately specific: it describes what the site actually does,
        rather than everything a website of this kind might conceivably do.
      </p>

      <h2>What we collect</h2>
      <p>
        Only what you type into the contact form: your name, your email address,
        a subject and a message. There are no accounts, no newsletter, no
        advertising and no analytics. We do not track you across other sites.
      </p>

      <h2>What your browser stores</h2>
      <p>
        This site sets no cookies. It stores one thing in your browser: a flag
        recording that you have seen the opening animation, so it plays once
        rather than every time you open a page. It does not identify you, it
        never leaves your device, and it is discarded when you close the tab.
      </p>

      <h2>What happens to an enquiry</h2>
      <p>
        It is emailed to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. The reply
        address is set to yours, so a reply goes straight back to you. It is not
        added to any list and it is not shared with anyone else.
      </p>
      <p>
        If that email fails to send, you are told so on the spot, with the
        address to write to instead — you are never shown a confirmation for a
        message that did not arrive. The contents are also written to our server
        log so the failure can be diagnosed. Those logs are kept briefly, about
        an hour, and then deleted automatically; they are a diagnostic record
        and not a place your enquiry is stored.
      </p>

      <h2>Preventing abuse</h2>
      <p>
        To stop automated submissions, the form counts recent submissions
        against a one-way hash of your IP address, held in memory for up to an
        hour and never written to disk. The hash is salted with a secret that is
        not published, so it cannot be worked backwards to the address.
      </p>

      <h2>Who else is involved</h2>
      <dl>
        <dt>Vercel</dt>
        <dd>
          Hosts the site. Like any web host it records requests, including IP
          addresses, for a short period.
        </dd>
        <dt>Resend</dt>
        <dd>Delivers the enquiry email. It sees what you wrote, in order to send it.</dd>
        <dt>OpenFreeMap and OpenStreetMap</dt>
        <dd>
          Supply the map on the properties page. When that map loads, your IP
          address is visible to them, as it is to any server your browser
          requests a file from.
        </dd>
      </dl>

      <h2>Your rights</h2>
      <p>
        You can ask what we hold about you, ask for it to be corrected, or ask
        for it to be deleted. Write to{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we will answer.
      </p>
      <p>
        Belle Voyage Estates operates in Canada, the United States, the United
        Kingdom and the European Union, and handles personal information in line
        with the law of the place you are in — PIPEDA in Canada, the UK GDPR and
        the GDPR in the United Kingdom and Europe. Where we rely on a lawful
        basis to hold an enquiry, it is our legitimate interest in answering the
        person who sent it.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the date at the top changes with it. We do not
        make changes retroactively.
      </p>
    </Doc>
  );
}
