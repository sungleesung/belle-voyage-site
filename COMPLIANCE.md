# Compliance — what we have to go over

Working list for Belle Voyage Estates. Written 2026-08-30 from an audit of the
live site and the repo, not from a template: every item below points at
something actually published or actually missing.

**I am not a lawyer and none of this is legal advice.** Items marked ⚖️ need a
real opinion before anything is published, because getting them wrong publishes
a claim we cannot stand behind — which is worse than publishing nothing.

Owner column: **S** = Sung (code/site) · **C** = Cira (business fact or decision)
· **⚖️** = needs professional advice first.

---

## A. The company does not exist on its own website

Nothing on the site identifies a legal entity. Greps for corporation number,
company number, registered office, licence number, RECO, HST/GST/VAT return
nothing. The only contact surface anywhere is one `mailto:` — no telephone
number exists in the codebase, and no postal address.

| | Item | Owner |
|---|---|---|
| A1 | Publish the registered legal name and Ontario corporation number | C |
| A2 | Publish a business address (or at minimum "Windsor, Ontario") | C |
| A3 | Publish a telephone number, or state plainly that we are email-only | C |
| A4 | Decide whether the operating name and the registered name differ, and if so say both | C |

Why this is first: it is free, it is true today, and it is the only
third-party-verifiable credential we can publish without acquiring anything.
Every other trust claim rests on it.

---

## B. We contradict ourselves about where we operate

Four surfaces say **Canada, the United States and Europe**:
`app/layout.tsx:7` · `app/properties/page.tsx:9` · `README.md:3` · the
`MARKETS` array in `lib/properties.ts` (ca / us / eu, no UK).

Three say **Canada, the United States, the United Kingdom and Europe**:
`app/terms/page.tsx:22` · `app/owners/page.tsx:6` · `app/owners/page.tsx:28`.

And `app/privacy/page.tsx:80` asserts we operate in all four *and* that PIPEDA,
UK GDPR and EU GDPR apply to us.

The London placeholder is filed as `market: "eu"` in `lib/properties.ts`, which
has been wrong since Brexit for every legal purpose on this page.

| | Item | Owner |
|---|---|---|
| B1 | **Decide: do we operate in the UK, yes or no?** Everything in §D depends on this | C |
| B2 | Make all seven surfaces agree with the answer | S |
| B3 | If yes, split UK out of `eu` in the market model — it is a separate regime | S |

This is the load-bearing decision on the page. A trust section built on a market
claim the site disputes with itself is worse than no trust section.

---

## C. Ontario — are we registered for what /owners advertises? ⚖️

`app/owners/page.tsx` sells five things. The first and third are the exposure:

> "Long-term letting — finding and referencing tenants, and holding the tenancy."
> "Day-to-day management — rent, maintenance, and the calls at nine on a Sunday."

Under TRESA a lease is a trade in real estate, and doing it for another person
for compensation is registrable. Development and **wholesaling** — assigning
your own contract, acting as principal — are normally the *exempt* activities,
which is the opposite of the intuition.

| | Item | Owner |
|---|---|---|
| C1 | **Are we registered, or operating under a brokerage, for Ontario letting and management?** | C ⚖️ |
| C2 | If yes — publish the registration. It is the strongest credential we have | C |
| C3 | If no — get an opinion before making the owner funnel louder | C ⚖️ |
| C4 | Do **not** publish a RECO number we do not hold. Publishing the gap is worse than the gap | S |

---

## D. United Kingdom — only if B1 says yes ⚖️

If we let property in the UK, several of these are not optional, and two of them
are obligations **to display on the website**, which makes them simultaneously a
legal duty and the independent third-party proof the site currently lacks.

| | Item | Owner |
|---|---|---|
| D1 | Redress scheme membership (TPO or PRS) — mandatory for letting agents, and **must be displayed**; failure to display is separately enforceable | C ⚖️ |
| D2 | Client Money Protection — mandatory if we hold client money; certificate must be displayed | C ⚖️ |
| D3 | Tenancy deposit protection — deposits into an authorised scheme, prescribed information served | C ⚖️ |
| D4 | EPC rating shown in property advertising | C |
| D5 | Right to Rent checks (England) | C ⚖️ |
| D6 | Tenant Fees Act — which fees we may charge at all | C ⚖️ |
| D7 | Publish the fee schedule where required | S |

**Do not list Propertymark as a regulator.** It is a voluntary trade
association. Advertising a membership we do not hold is the exact
misrepresentation this section exists to avoid.

---

## E. Advertising the placeholder listings ⚖️

`/properties` publishes twelve listings with bedroom counts, floor areas and
monthly rents. None are real, and the page says so.

Already fixed today: the listings used to carry real street addresses whose
coordinates resolved to real occupied buildings — a Berlin primary school, the
Windsor duty-free shop, private houses in Trinity-Bellwoods and Corktown — on a
page our own sitemap asked Google to recrawl weekly. They are districts on
neighbourhood centroids now, and nothing points at a door.

What remains is that these are still priced advertisements for properties that
do not exist.

| | Item | Owner |
|---|---|---|
| E1 | **Decide the page's future**: real inventory, fewer honest listings, or strip the invented facts and make it an availability request | C |
| E2 | Until then, keep the disclaimer adjacent to the content — done, but do not let it be removed as "unfinished-looking" | S |
| E3 | Confirm the fabricated-price advertising is defensible under Competition Act (CA) / CPRs (UK) while the banner stands | ⚖️ |
| E4 | `/owners` sells "Compliance — the certificates, deposits and notices each jurisdiction requires" while the site publishes none of its own | C |

E4 is the sharpest one on this page. We are selling compliance as a service.

---

## F. Data protection — the strongest part of the site, with three gaps

Credit where due: `app/privacy/page.tsx` names Vercel, Resend **and
OpenFreeMap/OpenStreetMap** as recipients and states that the map exposes the
visitor's IP. Most sites never disclose their tile provider. It states a lawful
basis (legitimate interest) and commits to non-retroactive changes.

Verified against the code: the site genuinely sets no cookies, and the only
thing written to browser storage is the `bv-arrived` session flag, exactly as
described. (`bv-theme` is read in `app/layout.tsx:42` and written nowhere —
dead code, not an undisclosed store.)

| | Item | Owner |
|---|---|---|
| F1 | No retention period is stated for enquiry emails. Resend is holding them indefinitely — 25+ visible today | S / C |
| F2 | The policy names no data controller, because §A publishes no entity | C |
| F3 | If UK/EU GDPR applies with no UK/EU establishment, an Article 27 representative may be required | ⚖️ |
| F4 | **Adding analytics falsifies a published page.** `/privacy` says "no advertising and no analytics" and "this site sets no cookies" — any measurement must ship in the same commit as the policy edit | S |

---

## G. Mail identity

Enquiries reach Cira from **`noreply@trycrate.net`** — a different company's
domain. Verified: four Belle Voyage enquiries delivered, all from that sender,
including one subject-lined "Sell my house."

| | Item | Owner |
|---|---|---|
| G1 | Verify `bellevoyageestates.com` in Resend (DNS records on the domain) | C + S |
| G2 | Send from a Belle Voyage address once verified | S |
| G3 | SPF / DKIM / DMARC for the domain | S |
| G4 | BCC an archive mailbox Cira can search, so a lead cannot vanish | S |

---

## H. Accessibility — record the determination, do not guess

The site has had several accessibility passes and holds up well. What is
missing is a written answer to whether either regime actually binds us.

| | Item | Owner |
|---|---|---|
| H1 | AODA (Ontario): the WCAG obligation attaches above an employee threshold — record whether we are under it | C |
| H2 | European Accessibility Act: applies to e-commerce services from June 2025. We take no payments today, so likely out of scope — but that changes the day we do | C ⚖️ |

---

## I. Terms

| | Item | Owner |
|---|---|---|
| I1 | Governing law is Ontario while we serve UK/EU consumers, whose local protections cannot be contracted away | ⚖️ |
| I2 | No distance-selling withdrawal rights are stated — relevant if we ever transact online | ⚖️ |
| I3 | The three legal pages contain claims about **how we work** that were inferred, not supplied. Cira should read them line by line | C |

---

## Order I would take these in

1. **B1** — do we operate in the UK? Half this document branches on it.
2. **C1** — are we registered in Ontario for what `/owners` advertises?
3. **A1–A3** — publish the entity, an address and a phone number. Free, true today.
4. **G1** — get our own domain sending our own mail.
5. **E1** — decide what `/properties` is for.
6. Everything else.

1 and 2 are questions only Cira can answer, and neither costs anything to answer.
