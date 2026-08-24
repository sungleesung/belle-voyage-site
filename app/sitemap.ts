import type { MetadataRoute } from "next";
import { MARKETS } from "@/lib/properties";

/* sitemap.xml for crawlers. The human-readable one lives at /sitemap; the two
   are different files and different routes, and both are wanted. */
const BASE = "https://bellevoyageestates.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const at = new Date("2026-08-21");
  const paths = [
    "/", "/properties", "/owners", "/sitemap",
    "/privacy", "/terms", "/ai-usage",
    ...MARKETS.map((m) => `/properties?market=${m.code}`),
  ];
  return paths.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: at,
    changeFrequency: p === "/properties" ? "weekly" : "monthly",
    priority: p === "/" ? 1 : p === "/properties" ? 0.9 : 0.4,
  }));
}
