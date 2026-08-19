"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bullet, Diamond, Glyph, Arrow } from "./Glyph";
import { MARKETS, NET, TOTAL, type Market } from "@/lib/net";

const reduced = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

type Row = {
  addr: string; city: string; m: Market; type: Parameters<typeof Glyph>[0]["type"];
  svc: string; cad: number; m2: number; bed: number; ba: number; open: boolean;
};
const ROWS: Row[] = [
  { addr:"48 Bathurst St",       city:"Toronto",     m:"CA", type:"building",  svc:"SRM",  cad:3980, m2:96,  bed:2, ba:2, open:true  },
  { addr:"1204 Rue Saint-Denis", city:"Montréal",    m:"CA", type:"apartment", svc:"RV",   cad:2240, m2:63,  bed:1, ba:1, open:true  },
  { addr:"77 Ouellette Av",      city:"Windsor",     m:"CA", type:"house",     svc:"SR",   cad:1640, m2:121, bed:3, ba:2, open:false },
  { addr:"215 W 29th St",        city:"New York",    m:"US", type:"building",  svc:"SRMV", cad:5720, m2:84,  bed:2, ba:2, open:true  },
  { addr:"1841 Michigan Av",     city:"Detroit",     m:"US", type:"house",     svc:"SRM",  cad:1520, m2:167, bed:4, ba:2, open:true  },
  { addr:"1100 Collins Av",      city:"Miami",       m:"US", type:"short",     svc:"V",    cad:3640, m2:58,  bed:1, ba:1, open:true  },
  { addr:"14 Rivington St",      city:"London",      m:"EU", type:"building",  svc:"SRMV", cad:5410, m2:77,  bed:2, ba:2, open:true  },
  { addr:"22 Rue Oberkampf",     city:"Paris",       m:"EU", type:"apartment", svc:"RV",   cad:3880, m2:54,  bed:1, ba:1, open:false },
  { addr:"31 Oranienstraße",     city:"Berlin",      m:"EU", type:"student",   svc:"RM",   cad:1180, m2:24,  bed:1, ba:1, open:true  },
];
/* Areas are held in m² and converted for display. The unit follows the market,
   not the currency — a Toronto flat stays metric whichever money you pick. */
const FX: Record<string, { r: number; s: string }> = {
  CAD: { r: 1, s: "$" }, USD: { r: 0.73, s: "US$" }, EUR: { r: 0.68, s: "€" }, GBP: { r: 0.58, s: "£" },
};
const IMPERIAL: Market[] = ["US"];

/* ──────────────────────────────────────────────────────────────
   06 · THE BOARD — hairlines, never gaps. Rows arrive in waves of seven.
   ────────────────────────────────────────────────────────────── */
export function Board() {
  const root = useRef<HTMLElement>(null);
  const [cur, setCur] = useState("CAD");
  const [mk, setMk] = useState<Set<Market>>(new Set(["CA", "US", "EU"]));

  useEffect(() => {
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(".bd-row", {
        scrollTrigger: { trigger: root.current!, start: "top 72%" },
        yPercent: 40, opacity: 0, duration: 0.7, ease: "expo.out",
        stagger: { each: 0.05, from: "start" },
      });
      gsap.from(".bd-sign", {
        scrollTrigger: { trigger: root.current!, start: "top 82%" },
        scaleY: 0, transformOrigin: "0 0", duration: 0.8, ease: "expo.out",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const money = (cad: number) => FX[cur].s + Math.round(cad * FX[cur].r).toLocaleString("en-US");
  const area = (m2: number, m: Market) =>
    IMPERIAL.includes(m) ? `${Math.round(m2 * 10.7639).toLocaleString("en-US")} ft²` : `${m2} m²`;
  const shown = ROWS.filter((r) => mk.has(r.m));
  const toggle = (k: Market) => {
    const n = new Set(mk);
    n.has(k) ? n.delete(k) : n.add(k);
    if (n.size) setMk(n);
  };

  return (
    <section className="board" id="board" ref={root} aria-label="Properties">
      <div className="bd-sign">
        <div className="bd-b1" /><div className="bd-b2" />
        <div className="bd-b3">
          <h2>Departures</h2><span className="grow" />
          <span className="eyebrow bd-cnt">{shown.length} of {TOTAL} shown</span>
        </div>
      </div>

      <div className="bd-controls">
        <span className="eyebrow">Market</span>
        <div className="seg">
          {(Object.keys(MARKETS) as Market[]).map((k) => (
            <button key={k} type="button" aria-pressed={mk.has(k)} onClick={() => toggle(k)}>
              {MARKETS[k].name}
            </button>
          ))}
        </div>
        <span className="grow" />
        <span className="eyebrow">Show in</span>
        <div className="seg">
          {Object.keys(FX).map((c) => (
            <button key={c} type="button" aria-pressed={cur === c} onClick={() => setCur(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="bd-rows">
        {shown.map((r) => (
          <article className="bd-row" key={r.addr} data-multi={r.svc.length > 1}>
            <span className="bd-band" style={{ background: MARKETS[r.m].colour }} />
            <span className="bd-mk"><Bullet ch={r.m} size={28} fill={MARKETS[r.m].colour} fg="#fff"
              title={MARKETS[r.m].name} /></span>
            <span className="bd-a">
              <Glyph type={r.type} size={21} />
              <span><b>{r.addr}</b><br /><span className="bd-city">{r.city} · {MARKETS[r.m].name}</span></span>
            </span>
            <span className="bd-svc">
              {[...r.svc].sort().map((c) => c === "V"
                ? <Diamond key={c} ch={c} size={23} title="Voyage" />
                : <Bullet key={c} ch={c} size={22} title={c} />)}
            </span>
            <span className="bd-price">{money(r.cad)}</span>
            <span className="bd-spec">{r.bed} bed · {r.ba} bath · {area(r.m2, r.m)}</span>
            <span className="bd-stat">
              <i className="globe" style={{ background: r.open ? "var(--us)" : "var(--ca)" }} />
              {r.open ? "Viewings today" : "By appointment"}
            </span>
          </article>
        ))}
      </div>

      <footer className="bd-legend">
        <span><Glyph type="apartment" size={17} /> Apartment</span>
        <span><Glyph type="house" size={17} /> House</span>
        <span><Glyph type="building" size={17} /> Building</span>
        <span><Glyph type="short" size={17} /> Short stay</span>
        <span><Glyph type="student" size={17} /> Student</span>
        <span className="bd-legend-note"><b>Wide band</b> runs more than one service</span>
      </footer>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   07 · TWO PATHS — the one thing the whole category gets wrong.
   Owners and renters are different journeys; say so at the door.
   ────────────────────────────────────────────────────────────── */
export function TwoPaths() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(".pt", {
        scrollTrigger: { trigger: root.current!, start: "top 68%" },
        clipPath: "inset(0 0 100% 0)", duration: 1.1, stagger: 0.14, ease: "expo.out",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="paths" id="paths" ref={root} aria-label="Owners and renters">
      <a className="pt pt-o" href="#board">
        <span className="pt-arw"><Arrow dir="down" size={26} /></span>
        <h3>I own property</h3>
        <p>Management, tenanting, compliance and accounts. We publish our average time
          to let, dated and per market — ask any competitor for theirs.</p>
        <span className="eyebrow">Owners →</span>
      </a>
      <a className="pt pt-r" href="#board">
        <span className="pt-arw"><Arrow dir="right" size={26} /></span>
        <h3>I am looking for somewhere</h3>
        <p>Every listing with its price, its size in the unit its market uses, and
          whether you can see it today. No form in front of the number.</p>
        <span className="eyebrow">Renters and buyers →</span>
      </a>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   08 · PLATFORM SIGN — the footer built as a real sign:
   1½″ black band, ⅛″ white band, 12″ message panel.
   ────────────────────────────────────────────────────────────── */
export function PlatformSign() {
  return (
    <footer className="sign" aria-label="Contact">
      <div className="sg-b1" /><div className="sg-b2" />
      <div className="sg-b3">
        <div className="sg-l">
          <div className="sg-wm">
            <Bullet ch="BV" size={34} fill="var(--paper)" fg="var(--ink)" title="Belle Voyage Estates" />
            <span>Belle Voyage Estates</span>
          </div>
          <p className="sg-desc">Sales, letting and management — Canada, the United States, Europe.</p>
        </div>
        <div className="sg-r">
          {(Object.keys(MARKETS) as Market[]).map((k) => (
            <div className="sg-mk" key={k}>
              <Bullet ch={k} size={26} fill={MARKETS[k].colour} fg="#fff" title={MARKETS[k].name} />
              <span>{MARKETS[k].name}</span>
              <span className="sg-n">{NET[k].reduce((t, s) => t + s.count, 0)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sg-fine">
        <span>Offices open 9 to 6 local</span>
        <span>Designed by Sung — <a href="mailto:hello@sungshil.com">hello@sungshil.com</a></span>
      </div>
    </footer>
  );
}
