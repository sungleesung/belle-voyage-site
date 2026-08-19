import { Arrow } from "./Arrow";

const LEGAL = [
  { label: "Privacy policy",   href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "AI usage policy",  href: "/ai-usage" },
  { label: "Site map",         href: "/sitemap" },
];

export function Contact() {
  return (
    <section className="ct" id="contact">
      <div className="ct-inner">
        <h2>Get in touch</h2>

        <form className="ct-form" action="/api/enquiry" method="post">
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
          <button className="ct-send" type="submit">
            Send <Arrow dir="right" size={20} />
          </button>
        </form>

        {/* The two audiences this business actually has, named at the door. */}
        <div className="ct-paths">
          <a className="ct-path" href="/owners">
            <span className="ct-k">I own property</span>
            <span className="ct-v">Management, letting and compliance</span>
            <Arrow dir="right" size={22} />
          </a>
          <a className="ct-path" href="/about">
            <span className="ct-k">I want to know more</span>
            <span className="ct-v">Who we are and how we work</span>
            <Arrow dir="right" size={22} />
          </a>
        </div>
      </div>

      <footer className="ct-foot">
        <a className="ct-wm" href="/">
          Belle V<i className="ring" aria-hidden="true">
            <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38.3" fill="none"
              stroke="currentColor" strokeWidth="23.4" /></svg></i>yage
        </a>
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
