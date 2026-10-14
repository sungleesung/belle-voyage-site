# Belle Voyage Estates

Live: **https://www.bellevoyageestates.com** · Next 15 (App Router) · TypeScript ·
hand-written CSS (no Tailwind) · GSAP ScrollTrigger · Lenis · MapLibre GL.

Real estate and rental property management, founded by Cira Vogler in Windsor,
Ontario in 2024. The site is live and **already receiving real enquiries**.

> **Handoff note.** The previous README described a nine-section scroll spine — a
> preloader, "the wash", horizontal markets, service bullets `S·R·M·V` — that was
> never built, and listed `/properties` under "known gaps" when it is the most
> developed page in the repo. It has been replaced with what is actually here.
> If you find other docs describing unbuilt features, trust the code.

---

## The idea

A transit system is an index of places joined by services; a property company is
the same object. The site is **drawn as a transit system, not decorated like one** —
markets are trunk lines (CA red / US green / EU blue), properties are stations.

The rule that outranks the rest: **the metaphor governs structure and wayfinding;
prices and addresses stay plain and stay first.** If a choice makes the metaphor
stronger and findability worse, findability wins.

## Run it

```bash
npm install
npm run dev          # localhost:3000
npm run build        # prebuild runs a spacing lint that WILL fail the build
npx next start -p 3100
```

`prebuild` = `copy-maplibre.mjs` (MapLibre's worker is not emitted by Next, so it
is copied into `public/`) + `lint-spacing.mjs` (see **The spacing law** below).

### Environment

| var | used by | notes |
|---|---|---|
| `RESEND_API_KEY` | `lib/mail.ts` | currently a key shared with another project |
| `RESEND_FROM` | `lib/mail.ts` | **still `noreply@trycrate.net`** — a different company's domain |
| `CONTACT_TO` | `components/Doc.tsx`, mail | `ciravogler@bellevoyageestates.com` |
| `IP_SALT` | `app/api/enquiry/route.ts` | per-process random if unset; set in prod |

All four are set on Vercel production. Without them the enquiry endpoint
fail-closes with a 503 and says so — that is correct, not a bug.

## Routes

```
/                 the drawing: intro → three stops on a diagonal → regions → contact
/properties       12 placeholder listings, MapLibre map, filters, expanding rows
/owners           owner-side services (thin — see open work)
/privacy /terms /ai-usage /sitemap     document pages
app/not-found.tsx  custom 404 ("No service to this stop")
app/opengraph-image.tsx  share card, drawn with next/og
```

## Architecture — the parts that will bite you

**`components/Line.tsx` is the whole landing.** A pinned GSAP ScrollTrigger
(`end: "+=280%"`, `scrub: 0.35`) drives an SVG camera — a `transform` on a `<g>`,
interpolated with monotone cubic Hermite. Geometry lives in `lib/line.ts` (27
exports: `INTRO`, `RUN`, `ONWARD`, `ABOUT_*`, `PROPS_*`, `REST_P`…). Zoom is
geometric, not linear — the eye reads `dk/k`.

**`lib/ride.ts` is the page transition** between `/` and `/properties`. A black
field with a green edge top and bottom covers the screen, the route swaps
underneath it, and it carries on in the same direction. **The sequence runs on
plain `setTimeout`, not React effects, and that is deliberate** — a route change is
a React transition, and an earlier version reached its clear phase, rendered it,
and never ran the effect that would have ended it, leaving the field covering the
screen permanently. Timers cannot be deferred by a render. Do not "clean this up"
into `useEffect`.

**`lib/overlay.ts` is module state** (`menu` | `contact` | null) shared by the
masthead and the contact popup. Since navigation is client-side now, it **survives
the page swap** — leaving a dialog open and pressing Back once brought the landing
up with the menu's chrome applied and `<main>` inert, with nothing visible to
explain it. `startRide`/`arriveOnly` clear it. Keep that.

**The masthead asks what is under it.** `paint()` in `Line.tsx` uses
`elementsFromPoint` to find the first full-bleed ground beneath the mark and sets
`mh-light`. It used to *infer* this from the timeline position and was blind to the
swallow, leaving a white slab on a black page for most of a viewport. Don't go back
to inference — there is no closed set of facts to derive it from.

**`mix-blend-mode: difference` is banned here.** White through difference renders
`255 − ground`, and this palette is pinned to luminance `Y = 0.179128` so one hex
clears AA on both white and black — which makes it the worst possible difference
ground. Measured: 1.80:1 over the trunk colours, and it emitted `#3AB1BC`,
`#FD77C8`, `#BE8D2E` — colours that appear nowhere in the identity.

## The spacing law

`scripts/lint-spacing.mjs` runs on `prebuild` and **fails the build**. It governs
*decisions, not consequences*: every number an author **types** — a fixed value, or
either endpoint of a `clamp()` — must come from

```
2 4 8 12 16 20 24 28 32 40 48 56 64 72 80 92 110
```

Values the browser computes *between* two typed endpoints are not authored and are
not governed. `.doc*` pages take fixed steps only, no spacing clamps.

Why it isn't a 4px grid: `--pad` is `clamp(20px, 4vw, 72px)`, so the gutter is off
any ladder at essentially every real viewport. "Every gap is a multiple of 4" was
written in the tokens file, referenced zero times, and could never have been true.

## Design system

Tokens in `styles/tokens.css`.

- **Colour** — hue from the three largest MTA trunk families, lightness *solved*.
  Every market sits at the equipoise luminance `Y = 0.179128`, the one value equally
  far from white and black, so a single hex serves both themes.
- **Type** — Helvetica. Scale seeded by the sign manual's cap heights
  (8″ / 4¼″ / 3″ / 1½″), rounded to whole pixels.
- **Motion** — one beat, 800ms; everything is a fraction of it. Four named easings,
  never `cubic-bezier(.4,0,.2,1)`. Stagger caps at seven concurrent items.
- **Colour is never the only channel** — equal luminance means the trunks are
  indistinguishable in greyscale, so every line carries its code and every station
  its name.

## Hard-won gotchas

- **Placeholder listings must never name real buildings.** They used to carry real
  street addresses whose coordinates resolved to a Berlin primary school, the Windsor
  duty-free shop, and private houses — with invented rents, on a page the sitemap
  asks Google to recrawl weekly. They are **districts on neighbourhood centroids**
  now (`lib/properties.ts`). If real inventory arrives, replace them wholesale.
- **GSAP context scopes selector strings to `.ln`.** Anything rendered as a sibling
  is authored, rendered, and never animated. This caused three separate bugs,
  including a heading that sat at `opacity: 0` forever.
- **Canonical goes per-route, never on the layout.** Metadata inherits, so
  `alternates: { canonical: "/" }` in `app/layout.tsx` put the homepage URL on every
  page and told Google the whole site was duplicates.
- **Satori (`next/og`) renders a CSS border-triangle as a filled box**, and without
  an explicit `viewBox` it stretches the canvas — circles become ellipses.
- **Don't run `npm run build` while `next start` is serving** the same `.next` —
  it clobbers the manifest and the running server serves an unstyled page.
- **`prefers-reduced-motion` returns before the GSAP context is built**, so anything
  the context sets up must also be handled on that path.

## Current state

The site is live, healthy, and taking enquiries. Four real sends are visible in
Resend, including one subject-lined "Sell my house" — a **seller lead, for an
audience the site does not acknowledge exists.**

Recent work (see `git log`): a client-side page transition between the landing and
the properties board; the placeholder-address fix; a keyboard/focus/contrast pass;
SEO (canonical, Open Graph, structured data, `next/og` share card); and
`COMPLIANCE.md`.

## Open — decisions first

**Read `COMPLIANCE.md`.** It is current and specific. Two questions gate a lot of
the rest and both are free to answer:

1. **Do we operate in the UK?** Four surfaces say *Canada, the US and Europe*; three
   say *…the United Kingdom and Europe*; `privacy` asserts UK GDPR applies. The
   London placeholder is filed as `market: "eu"`. Half of `COMPLIANCE.md` and all
   local SEO branch on this.
2. **Is the company registered in Ontario for what `/owners` advertises?** That page
   sells "long-term letting — finding and referencing tenants, and holding the
   tenancy," which is registrable under TRESA. It also sells *"Compliance — the
   certificates, deposits and notices each jurisdiction requires"* while the site
   publishes none of its own.

Then: **"Flagship" is not a letting type.** All three flagships are `period: "mo"`
and each is the dearest monthly in its market — it is a price tier wearing a station
shape, and filtering **Long let** returns 6 rows and *excludes all three of them*.
A real findability bug and a taxonomy decision in one.

## Open — work

- **Nothing is measured.** No analytics at all. Note `/privacy` says in writing
  "no advertising and no analytics" and "this site sets no cookies" — adding
  measurement means editing that page in the same commit or publishing something false.
- **Mail identity.** `bellevoyageestates.com` is not verified in Resend, so enquiries
  reach Cira from `noreply@trycrate.net`. Needs DNS + SPF/DKIM/DMARC.
- **No phone number anywhere in the codebase**, and no postal address.
- **No photography**, and no image slot in the `Property` type. Note that rows name
  *districts* now, so a photo of "Ossington" would be a stock street scene — the
  honest asset at this granularity is probably a drawn plan, not a photograph.
- **`/owners` is thin** — five bullets, no price, no process, no named person. It is
  the page the seller lead above would have landed on.
- Property detail pages don't exist; rows expand in place. `/properties?open=<id>`
  would buy a shareable URL for ~10 lines without a new route.
- Helvetica Now web licence unbought — falls to system Helvetica / Arial. The
  cap-height scale in `tokens.css` is derived from a face the site never serves.

## Conventions

Branch is **`belle-voyage-v1`**; there is no `main`. Preview before promoting
(`vercel deploy`, then `--prod` once approved). Commit messages here explain *why*,
including what was wrong before — keep that; it is why this handoff was possible.
