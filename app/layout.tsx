import type { Metadata, Viewport } from "next";
import "@/styles/global.css";
import "@/styles/site.css";
import { Ride } from "@/components/Ride";

const DESC =
  "Sales, letting and management across Canada, the United States and Europe. " +
  "Square metres in Berlin, square feet in Detroit.";

/* A link to this site pasted into a message rendered as a bare grey URL —
   there was no metadataBase, no canonical and no Open Graph at all, on a
   business that travels by referral. The title carries the city and the trade
   too; "Belle Voyage Estates" alone is unfindable for anyone who does not
   already know the name. */
export const metadata: Metadata = {
  metadataBase: new URL("https://www.bellevoyageestates.com"),
  /* No template: every page already carries the brand in its own title, and a
     template appended it a second time — "Properties — Belle Voyage Estates ·
     Belle Voyage Estates". And no canonical here: metadata inherits, so a
     canonical on the layout put https://www.bellevoyageestates.com on EVERY
     page, telling Google that /properties and /owners are duplicates of the
     homepage. Canonicals are declared per route. */
  title: "Belle Voyage Estates — property management, Windsor Ontario",
  description: DESC,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Belle Voyage Estates",
    title: "Belle Voyage Estates — property management, Windsor Ontario",
    description: DESC,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Belle Voyage Estates", description: DESC },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

/* Theme is resolved before paint so the page never flashes the wrong ground. */
const BOOT = `(function(){try{var t=localStorage.getItem('bv-theme');
if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();`;

/* Structured data asserts only what the site already publishes: the founder,
   the year, the markets and an email. Deliberately no address, telephone,
   rating or price range — we have none of those, and inventing them here to
   win a rich result is the same fabrication the rest of this project keeps
   refusing. areaServed follows the homepage's claim; if the UK question in
   COMPLIANCE.md is settled the other way, this changes with it. */
const LD = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Belle Voyage Estates",
  url: "https://www.bellevoyageestates.com",
  description: DESC,
  email: "ciravogler@bellevoyageestates.com",
  foundingDate: "2024",
  founder: { "@type": "Person", name: "Cira Vogler" },
  image: "https://www.bellevoyageestates.com/opengraph-image",
  areaServed: [
    { "@type": "Country", name: "Canada" },
    { "@type": "Country", name: "United States" },
    { "@type": "Place", name: "Europe" },
  ],
  knowsAbout: [
    "Property management", "Long-term letting", "Short stay letting",
    "Real estate development", "Real estate wholesaling",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <noscript><style>{`.ln-svg{opacity:1!important}`}</style></noscript>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
        {children}
        {/* Outside both pages, so it is the one thing that survives the swap. */}
        <Ride />
      </body>
    </html>
  );
}
