import type { Metadata } from "next";
import { Doc, CONTACT } from "@/components/Doc";
import { MARKETS } from "@/lib/properties";

export const metadata: Metadata = {
  alternates: { canonical: "/sitemap" },
  title: "Site map — Belle Voyage Estates",
  description: "Every page on the Belle Voyage Estates site, in one place.",
};

const MAP = [
  { head: "The line", links: [
    { label: "Home", href: "/" },
    { label: "Site map", href: "/sitemap" },
  ]},
  { head: "Properties", links: [
    { label: "All properties", href: "/properties" },
    ...MARKETS.map((m) => ({ label: m.name, href: `/properties?market=${m.code}` })),
  ]},
  { head: "Company", links: [
    { label: "About", href: "/#about" },
    { label: "For owners", href: "/owners" },
    { label: "Contact", href: "/#contact" },
  ]},
  { head: "Legal", links: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
    { label: "AI usage policy", href: "/ai-usage" },
  ]},
];

export default function Page() {
  return (
    <Doc title="Site map">
      <p>Every page on this site, in one place.</p>
      {MAP.map((col) => (
        <section key={col.head}>
          <h2>{col.head}</h2>
          <ul>
            {col.links.map((l) => (
              <li key={l.label}><a href={l.href}>{l.label}</a></li>
            ))}
          </ul>
        </section>
      ))}
      <p>
        Anything else you were looking for, ask{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </Doc>
  );
}
