import { BANDS } from "@/lib/line";

const LEGAL = [
  { label: "Privacy policy",   href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "AI usage policy",  href: "/ai-usage" },
  { label: "Site map",         href: "/sitemap" },
];

export function Contact() {
  return (
    <section className="ct" id="contact">
      <h2>Contact</h2>
      <div className="ct-grid">
        <div className="ct-say">
          <p>
            Sales, letting and management across Canada, the United States and Europe.
            Tell us which market you are in and we will put you with the person who
            works it.
          </p>
          <a className="ct-mail" href="mailto:hello@belle-voyage.com">
            hello@belle-voyage.com
          </a>
        </div>
        <ul className="ct-mk">
          {BANDS.map((b) => (
            <li key={b.code} style={{ ["--c" as string]: b.colour }}>
              <span className="ct-dot" aria-hidden="true" />
              <b>{b.name}</b>
              <span className="ct-hrs">9 to 6 local</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="ct-foot">
        <nav aria-label="Legal">
          {LEGAL.map((l) => <a key={l.label} href={l.href}>{l.label}</a>)}
        </nav>
        <p className="ct-credit">
          Designed by Sung — <a href="mailto:hello@sungshil.com">hello@sungshil.com</a>
        </p>
      </footer>
    </section>
  );
}
