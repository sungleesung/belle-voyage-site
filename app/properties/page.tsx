import type { Metadata } from "next";
import { Properties } from "@/components/Properties";
import type { Market } from "@/lib/properties";

export const metadata: Metadata = {
  title: "Properties — Belle Voyage Estates",
  description:
    "Sales, letting and short stay across Canada, the United States and Europe.",
};

const OK = ["ca", "us", "eu"] as const;

export default async function Page(
  { searchParams }: { searchParams: Promise<{ market?: string }> },
) {
  const { market } = await searchParams;
  /* The region plates on the landing link here with ?market=ca|us|eu. */
  const initial = (OK as readonly string[]).includes(market ?? "")
    ? (market as Market) : "all";
  return <main><Properties initial={initial} /></main>;
}
