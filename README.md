# Belle Voyage Estates

Sales, letting and management across **Canada, the United States and Europe**.

Next 15 (App Router) · TypeScript · hand-written CSS (no Tailwind) · GSAP ScrollTrigger · Lenis.

## The idea

A transit system is an index of places joined by services; a property company is the
same object. The site is **drawn as a transit system, not decorated like one** — markets
are trunk lines (`CA` `US` `EU`), services are route bullets (S · R · M · V), properties
are stations.

The rule that outranks the rest: **the metaphor governs structure and wayfinding;
search, prices and addresses stay plain and stay first.** If a choice makes the metaphor
stronger and findability worse, findability wins.

## Scroll spine

| | section | mechanic |
|---|---|---|
| 00 | Preloader | counter to the real listing total, three trunks draw, curtain lifts |
| 01 | Hero | the live network, drifting below the perceptual threshold |
| 02 | Lines draw | pinned 280%, scrubbed — the network builds itself, stations in waves of ≤7 |
| 03 | **The wash** | pinned 220% — the signature |
| 04 | Markets | pinned horizontal, three full-bleed fields, each with its own trunk |
| 05 | Services | pinned 320%, one bullet per beat, the field changing under it |
| 06 | Board | listings, hairline-ruled, rows arriving in waves |
| 07 | Two paths | owners ↓ / renters → |
| 08 | Platform sign | footer built as a real 1½ : ⅛ : 12 sign |

**The wash** is lifted from Mini Metro's week transition: the board does not dim to black,
it fades toward paper, blurs, and keeps drifting while the decision resolves on top of it.

## Design system

Tokens in `styles/tokens.css`. Full brand book in Notion; identity, motion, board and
ad-mat specimens are published as separate live pages.

- **Colour** — hue inherited from the three largest MTA trunk families, lightness *solved*.
  Every market bullet sits at the equipoise luminance `Y = 0.179128`, the one value equally
  far from white and black, so a single value serves both themes with no variant.
- **Type** — Helvetica. Scale seeded by the sign manual's cap heights (8″ / 4¼″ / 3″ / 1½″),
  rounded to whole pixels. A bullet's letter is 53.1% of its diameter.
- **Motion** — one beat, 800ms; everything is a fraction of it. Four named easings, never
  `cubic-bezier(.4,0,.2,1)`. Stagger caps at seven concurrent items.
- **Colour is never the only channel** — equal luminance means the trunks are indistinguishable
  in greyscale, so every line carries its two-letter code and every station its name.

## Known gaps

- Helvetica Now web licence unbought; falls to system Helvetica on Apple, Arial on Windows.
- No property photography — everything is drawn marks and type.
- Listings are static fixtures; no CMS, no search, no bedroom filter yet.
- `/properties`, `/markets/[code]` and the owner funnel are not built — the homepage anchors
  point within the page.
