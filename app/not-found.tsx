import { Arrow } from "@/components/Arrow";

/* The one page nobody plans to see, in the register the rest of the site uses:
   a line that runs out. The manual's service-change signs say what is not
   running and what to do instead, and never apologise. */
export default function NotFound() {
  return (
    <main className="nf">
      <svg className="nf-line" viewBox="0 0 320 60" aria-hidden="true"
        preserveAspectRatio="xMinYMid meet">
        <path d="M14 30H236" fill="none" stroke="var(--ca)" strokeWidth="18"
          strokeLinecap="round" />
        <circle cx="14" cy="30" r="13" fill="var(--paper)" stroke="var(--ca)" strokeWidth="7" />
        <path d="M258 12 296 48M296 12 258 48" fill="none" stroke="var(--ink)"
          strokeWidth="7" strokeLinecap="round" />
      </svg>

      <p className="nf-code">404</p>
      <h1>No service to this stop</h1>
      <p className="nf-copy">
        The page you asked for is not on the map. It may have moved, or it may
        never have existed.
      </p>

      <nav className="nf-go" aria-label="Where to instead">
        <a href="/"><Arrow dir="left" size={19} /> Back to the line</a>
        <a href="/properties">Properties <Arrow dir="right" size={19} /></a>
        <a href="/#contact">Contact <Arrow dir="right" size={19} /></a>
      </nav>
    </main>
  );
}
