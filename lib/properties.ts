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
export const PROPERTIES: Property[] = [
  { id: "mtl-stpaul", name: "12 Rue Saint-Paul", city: "Montréal, QC", market: "ca",
    kind: "standard", beds: 2, baths: 1, area: "74 m²", amount: 2400, currency: "$", period: "mo", at: [-73.5525, 45.5064] },
  { id: "yyz-ossington", name: "88 Ossington Avenue", city: "Toronto, ON", market: "ca",
    kind: "flagship", beds: 3, baths: 2, area: "121 m²", amount: 4150, currency: "$", period: "mo", at: [-79.4203, 43.6465] },
  { id: "yqg-riverside", name: "417 Riverside Drive", city: "Windsor, ON", market: "ca",
    kind: "standard", beds: 4, baths: 2, area: "198 m²", amount: 3200, currency: "$", period: "mo", at: [-83.0364, 42.3170] },
  { id: "yvr-mainst", name: "2100 Main Street", city: "Vancouver, BC", market: "ca",
    kind: "short", beds: null, baths: 1, area: "44 m²", amount: 185, currency: "$", period: "night", at: [-123.1007, 49.2640] },

  { id: "det-corktown", name: "1420 Michigan Avenue", city: "Detroit, MI", market: "us",
    kind: "flagship", beds: 3, baths: 2, area: "2,040 sq ft", amount: 2950, currency: "$", period: "mo", at: [-83.0752, 42.3298] },
  { id: "chi-pilsen", name: "1809 South Racine", city: "Chicago, IL", market: "us",
    kind: "standard", beds: 2, baths: 1, area: "1,120 sq ft", amount: 2250, currency: "$", period: "mo", at: [-87.6564, 41.8567] },
  { id: "atx-eastside", name: "2312 East 6th Street", city: "Austin, TX", market: "us",
    kind: "short", beds: 1, baths: 1, area: "680 sq ft", amount: 210, currency: "$", period: "night", at: [-97.7195, 30.2622] },
  { id: "buf-elmwood", name: "706 Elmwood Avenue", city: "Buffalo, NY", market: "us",
    kind: "standard", beds: 3, baths: 1, area: "1,480 sq ft", amount: 1850, currency: "$", period: "mo", at: [-78.8784, 42.9219] },

  { id: "ber-schonhauser", name: "Alte Schönhauser Straße 8", city: "Berlin, DE", market: "eu",
    kind: "short", beds: null, baths: 1, area: "41 m²", amount: 120, currency: "€", period: "night", at: [13.4062, 52.5266] },
  { id: "lon-wolseley", name: "The Wolseley Building", city: "London, UK", market: "eu",
    kind: "flagship", beds: 3, baths: 2, area: "118 m²", amount: 4950, currency: "£", period: "mo", at: [-0.1246, 51.5203] },
  { id: "lis-alfama", name: "Rua dos Remédios 44", city: "Lisbon, PT", market: "eu",
    kind: "standard", beds: 2, baths: 1, area: "68 m²", amount: 1650, currency: "€", period: "mo", at: [-9.1275, 38.7128] },
  { id: "dub-portobello", name: "31 Lennox Street", city: "Dublin, IE", market: "eu",
    kind: "standard", beds: 2, baths: 1, area: "82 m²", amount: 2300, currency: "€", period: "mo", at: [-6.2650, 53.3316] },
];

export const shapeOf = (k: Kind) =>
  k === "flagship" ? "ring" : k === "short" ? "diamond" : "disc";

export const summary = (p: Property) =>
  [p.beds === null ? "Studio" : `${p.beds} bed`, `${p.baths} bath`, p.area].join(" · ");
