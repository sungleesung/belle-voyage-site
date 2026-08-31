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
  title: {
    default: "Belle Voyage Estates — property management, Windsor Ontario",
    template: "%s · Belle Voyage Estates",
  },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <noscript><style>{`.ln-svg{opacity:1!important}`}</style></noscript>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        {children}
        {/* Outside both pages, so it is the one thing that survives the swap. */}
        <Ride />
      </body>
    </html>
  );
}
