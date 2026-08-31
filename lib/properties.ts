/* Placeholder inventory. Realistic on purpose — a template with [Property name]
   in it cannot show whether the layout survives a long German street address or
   a four-figure price — but the page says so plainly at the top, because this
   is a live site and nobody should mistake these for listings. */
export type Market = "ca" | "us" | "eu";
export type Kind = "flagship" | "standard" | "short";

export type Property = {
  id: string;
  name: string;
  city: string;
  market: Market;
  kind: Kind;
  beds: number | null;      // null = studio
  baths: number;
  area: string;             // stated in the unit that market uses
  amount: number;           // in its own currency, no conversion
  currency: "$" | "£" | "€";
  period: "mo" | "night";
  at: [number, number];     // lng, lat
};

/* Nightly and monthly cannot be compared as they stand, and converting between
   currencies would mean inventing a rate. Multiplying a nightly rate by thirty
   puts everything on one scale in its own currency, which is enough for a
   filter to be useful and honest about what it is. */
export const monthly = (p: Property) =>
  p.period === "night" ? p.amount * 30 : p.amount;

export const priceOf = (p: Property) =>
  `${p.currency}${p.amount.toLocaleString("en")} / ${p.period}`;

export const MARKETS: { code: Market; name: string; colour: string }[] = [
  { code: "ca", name: "Canada",        colour: "var(--ca)" },
  { code: "us", name: "United States", colour: "var(--us)" },
  { code: "eu", name: "Europe",        colour: "var(--eu)" },
];

/* Square metres in Berlin, square feet in Detroit — the site's own promise, so
   the template has to honour it rather than normalise everything to one unit. */
/* Placeholders name a DISTRICT, never a building.
   They used to carry street addresses with coordinates to match, and every one
   of them landed on a real, occupied, identifiable place — a private house in
   Trinity-Bellwoods, the Tunnel Duty Free Shop in Windsor, the Freie
   Waldorfschule in Berlin-Mitte. Fabricated bedroom counts and rents, pinned
   to somebody's school, under a real company name, on a page the sitemap asks
   Google to recrawl weekly.

   A district is a claim we can actually make: these are the areas the company
   works in. Every coordinate below is a neighbourhood centroid returned by
   Nominatim as a suburb/quarter/neighbourhood polygon — none resolves to
   premises. It is also closer to the brand than a house number ever was, since
   a station is named for the place it serves.

   If real inventory arrives with real addresses, they replace these wholesale
   and this comment goes with them. Until then nothing here points at a door. */
export const PROPERTIES: Property[] = [
  { id: "mtl-stpaul", name: "Vieux-Montréal", city: "Montréal, QC", market: "ca",
    kind: "standard", beds: 2, baths: 1, area: "74 m²", amount: 2400, currency: "$", period: "mo", at: [-73.5574, 45.5034] },
  { id: "yyz-ossington", name: "Ossington", city: "Toronto, ON", market: "ca",
    kind: "flagship", beds: 3, baths: 2, area: "121 m²", amount: 4150, currency: "$", period: "mo", at: [-79.4153, 43.6506] },
  { id: "yqg-riverside", name: "Walkerville", city: "Windsor, ON", market: "ca",
    kind: "standard", beds: 4, baths: 2, area: "198 m²", amount: 3200, currency: "$", period: "mo", at: [-83.0133, 42.3102] },
  { id: "yvr-mainst", name: "Mount Pleasant", city: "Vancouver, BC", market: "ca",
    kind: "short", beds: null, baths: 1, area: "44 m²", amount: 185, currency: "$", period: "night", at: [-123.0966, 49.2633] },

  { id: "det-corktown", name: "Corktown", city: "Detroit, MI", market: "us",
    kind: "flagship", beds: 3, baths: 2, area: "2,040 sq ft", amount: 2950, currency: "$", period: "mo", at: [-83.072, 42.3302] },
  { id: "chi-pilsen", name: "Pilsen", city: "Chicago, IL", market: "us",
    kind: "standard", beds: 2, baths: 1, area: "1,120 sq ft", amount: 2250, currency: "$", period: "mo", at: [-87.6619, 41.857] },
  { id: "atx-eastside", name: "East Cesar Chavez", city: "Austin, TX", market: "us",
    kind: "short", beds: 1, baths: 1, area: "680 sq ft", amount: 210, currency: "$", period: "night", at: [-97.7317, 30.2559] },
  { id: "buf-elmwood", name: "Elmwood Village", city: "Buffalo, NY", market: "us",
    kind: "standard", beds: 3, baths: 1, area: "1,480 sq ft", amount: 1850, currency: "$", period: "mo", at: [-78.877, 42.9172] },

  { id: "ber-schonhauser", name: "Mitte", city: "Berlin, DE", market: "eu",
    kind: "short", beds: null, baths: 1, area: "41 m²", amount: 120, currency: "€", period: "night", at: [13.4041, 52.5179] },
  { id: "lon-wolseley", name: "Clerkenwell", city: "London, UK", market: "eu",
    kind: "flagship", beds: 3, baths: 2, area: "118 m²", amount: 4950, currency: "£", period: "mo", at: [-0.1056, 51.5237] },
  { id: "lis-alfama", name: "Alfama", city: "Lisbon, PT", market: "eu",
    kind: "standard", beds: 2, baths: 1, area: "68 m²", amount: 1650, currency: "€", period: "mo", at: [-9.1284, 38.7118] },
  { id: "dub-portobello", name: "Portobello", city: "Dublin, IE", market: "eu",
    kind: "standard", beds: 2, baths: 1, area: "82 m²", amount: 2300, currency: "€", period: "mo", at: [-6.2688, 53.3313] },
];

export const shapeOf = (k: Kind) =>
  k === "flagship" ? "ring" : k === "short" ? "diamond" : "disc";

export const summary = (p: Property) =>
  [p.beds === null ? "Studio" : `${p.beds} bed`, `${p.baths} bath`, p.area].join(" · ");
