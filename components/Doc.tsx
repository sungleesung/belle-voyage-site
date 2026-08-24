import { Arrow } from "./Arrow";

/* Same value the endpoint actually mails to, so the policy cannot promise one
   address while enquiries go to another. The literal is the fallback for local
   work where the variable is not set. */
export const CONTACT =
  process.env.CONTACT_TO || "ciravogler@bellevoyageestates.com";

/* Every page that is mostly words: the policies, the site map, owners. Same
   chrome, one measure, so they read as one document set rather than three
   pages that happened to be written separately. */
export function Doc(
  { title, updated, children }:
  { title: string; updated?: string; children: React.ReactNode },
) {
  return (
    <main className="doc">
      <a className="doc-home" href="/">
        Belle&nbsp;V<i className="ring" aria-hidden="true">
          <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38.3" fill="none"
            stroke="currentColor" strokeWidth="23.4" /></svg></i>yage&nbsp;Estates
      </a>
      <h1>{title}</h1>
      {updated && <p className="doc-date">Last updated {updated}</p>}
      <div className="doc-body">{children}</div>
      <nav className="doc-go" aria-label="Elsewhere">
        <a href="/"><Arrow dir="left" size={18} /> Back to the line</a>
        <a href="/properties">Properties <Arrow dir="right" size={18} /></a>
        <a href="/sitemap">Site map <Arrow dir="right" size={18} /></a>
      </nav>
    </main>
  );
}
