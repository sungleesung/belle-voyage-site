import type { Metadata, Viewport } from "next";
import "@/styles/global.css";
import "@/styles/site.css";
import { Ride } from "@/components/Ride";

export const metadata: Metadata = {
  title: "Belle Voyage Estates",
  description:
    "Sales, letting and management across Canada, the United States and Europe. Square metres in Berlin, square feet in Detroit.",
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
