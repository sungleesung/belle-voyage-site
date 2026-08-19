"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Diagram } from "./Diagram";
import { Bullet, Diamond, Glyph } from "./Glyph";
import { Nav } from "./Nav";
import { MARKETS, NET, SERVICES, TOTAL, route, pathOf, type Market } from "@/lib/net";

const reduced = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ──────────────────────────────────────────────────────────────
   01 · HERO — the live network, drifting below the threshold.
   ────────────────────────────────────────────────────────────── */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });
      tl.from(".hero-brand > *", { y: 18, opacity: 0, duration: 0.8, stagger: 0.05, ease: "expo.out" })
        .from(".hero-hud", { opacity: 0, duration: 0.6, ease: "power2.out" }, 0.3)
        .from(".bar-inner > *", { y: 26, opacity: 0, duration: 0.9, stagger: 0.06, ease: "expo.out" }, 0.35);

      /* The frame is never still and nobody notices it moving — but it stops
         when the hero is off screen rather than burning a tween forever. */
      const drift = gsap.to(".dgm", {
        scale: 1.055, duration: 300, ease: "none", repeat: -1, yoyo: true,
        transformOrigin: "50% 50%", paused: true,
      });
      ScrollTrigger.create({
        trigger: root.current!, start: "top bottom", end: "bottom top",
        onToggle: (self) => (self.isActive ? drift.play() : drift.pause()),
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <header className="hero" ref={root}>
      <div className="hero-map"><Diagram id="map-hero" /></div>

      <div className="hero-brand">
        <a className="wm" href="/">
          <Bullet ch="BV" size={30} fill="var(--ink)" fg="var(--paper)" title="Belle Voyage Estates" />
          <span>Belle V<i className="ring" aria-hidden="true">
            <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38.3" fill="none"
              stroke="currentColor" strokeWidth="23.4" /></svg></i>yage</span>
        </a>
        <Nav />
      </div>

      <div className="hero-hud" aria-hidden="true">
        <div className="hud-1"><b>{TOTAL}</b>
          <svg width="17" height="19" viewBox="0 0 17 19" fill="var(--ink)">
            <circle cx="9.4" cy="3" r="3" />
            <path d="M8 6.6 4.4 10v5h2.3v-3.6l1.9-1.6 2.4 4V19h2.3v-5.6l-2.5-4.1.7-3 2.4 1.5.9 2.4 2-.7-1-2.9-4.2-2.6z" />
          </svg>
        </div>
        <div className="eyebrow">properties listed</div>
      </div>

      <div className="bar">
        <div className="bar-inner">
          <div className="bar-now">
            <span className="eyebrow">Belle Voyage Estates</span>
            <h1 className="bar-v">Sales, letting and management — Canada, the United States, Europe</h1>
          </div>
          <div className="bar-svc">
            {SERVICES.map((s) => s.shape === "diamond"
              ? <Diamond key={s.key} ch={s.key} size={30} fill="var(--paper)" fg="var(--ink)" title={s.name} />
              : <Bullet key={s.key} ch={s.key} size={30} fill="var(--paper)" fg="var(--ink)" title={s.name} />)}
          </div>
        </div>
      </div>
      <div className="hero-scroll eyebrow" aria-hidden="true">Scroll</div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────────
   02 · THE LINES DRAW — pinned, scrubbed. The network builds itself.
   ────────────────────────────────────────────────────────────── */
export function LinesDraw() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const paths = gsap.utils.toArray<SVGPathElement>(".dgm-trunk");
      paths.forEach((p) => {
        const L = p.getTotalLength();
        gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
      });
      gsap.set(".dgm-stn, .draw .dgm-cross, .draw .dgm-code, .draw .dgm-xing", { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current!, start: "top top", end: "+=280%", pin: true, scrub: 0.6 },
      });
      tl.to(".dgm-trunk", { strokeDashoffset: 0, duration: 3, stagger: 0.35, ease: "none" }, 0)
        .to(".dgm-code", { opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 1.2)
        /* Waves of no more than seven — as many distinct arrivals as anyone counts. */
        .to(".dgm-stn", { opacity: 1, duration: 0.45, stagger: { each: 0.1, from: "start" }, ease: "power2.out" }, 1.6)
        .to(".dgm-xing, .draw .dgm-cross", { opacity: 1, duration: 0.5, ease: "power2.out" }, 3.2)
        .from(".draw-say", { yPercent: 110, duration: 1.2, ease: "expo.out" }, 3.0);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="draw" ref={root} aria-label="The network">
      <div className="draw-map"><Diagram id="map-draw" /></div>
      <div className="draw-copy">
        <div className="draw-mask"><h2 className="draw-say">Three markets.<br />One network.</h2></div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   03 · THE WASH — the signature, lifted from the week transition.
   The board does not dim to black. It fades toward paper, blurs, and
   keeps drifting while the statement resolves on top of it.
   ────────────────────────────────────────────────────────────── */
export function Wash() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current!, start: "top top", end: "+=220%", pin: true, scrub: 0.7 },
      });
      tl.to(".dgm", {
        opacity: 0.17, filter: "blur(15px)", scale: 1.14, rotate: -1.8,
        transformOrigin: "56% 44%", duration: 2, ease: "power1.inOut",
      }, 0)
        .from(".wash-line", { yPercent: 115, duration: 1.1, stagger: 0.14, ease: "expo.out" }, 0.5)
        .from(".wash-sub", { opacity: 0, y: 22, duration: 0.9, ease: "power2.out" }, 1.5);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="wash" ref={root} aria-label="What we do">
      <div className="wash-map"><Diagram id="map-wash" labels={false} /></div>
      <div className="wash-copy">
        <h2>
          <span className="wash-mask"><span className="wash-line">Square metres in Berlin.</span></span>
          <span className="wash-mask"><span className="wash-line">Square feet in Detroit.</span></span>
        </h2>
        <p className="wash-sub">
          The rent is due on the first, in four currencies and three legal systems.
          Most of this business is knowing which set of rules you are in.
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   04 · MARKETS — pinned horizontal. Three full-bleed fields.
   ────────────────────────────────────────────────────────────── */
export function Markets() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const track = root.current!.querySelector<HTMLElement>(".mk-track")!;
      const dist = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: root.current!, start: "top top", end: () => `+=${dist()}`,
          pin: true, scrub: 0.6, invalidateOnRefresh: true,
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="markets" id="markets" ref={root} aria-label="Markets">
      <div className="mk-track">
        {(Object.keys(NET) as Market[]).map((k) => {
          const m = MARKETS[k];
          const count = NET[k].reduce((t, s) => t + s.count, 0);
          return (
            <article className="mk" key={k} style={{ ["--field" as string]: m.surface, ["--fink" as string]: m.ink }}>
              <div className="mk-head">
                <Bullet ch={k} size={62} fill={m.colour} fg="#fff" title={`${m.name} line`} />
                <div>
                  <h3>{m.name}</h3>
                  <span className="eyebrow">{count} properties · {NET[k].length} cities</span>
                </div>
              </div>
              <MiniLine market={k} />
              <ul className="mk-list">
                {NET[k].map((s) => (
                  <li key={s.name}>
                    <Glyph type={s.type} size={22} />
                    <b>{s.name}</b>
                    <span className="mk-from">from {s.from}</span>
                    <span className="mk-n">{s.count}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* Each market panel carries its own trunk as a diagram — the same octilinear
   geometry as the big map, normalised into the panel. */
function MiniLine({ market }: { market: Market }) {
  const st = NET[market];
  const xs = st.map((s) => s.x), ys = st.map((s) => s.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const spanY = Math.max(y1 - y0, 1);
  const norm = st.map((s) => ({
    x: 40 + ((s.x - x0) / (x1 - x0)) * 920,
    y: 60 + ((s.y - y0) / spanY) * (y1 === y0 ? 0 : 60),
  }));
  return (
    <div className="mk-mini" aria-hidden="true">
      <svg viewBox="0 0 1000 160" preserveAspectRatio="xMidYMid meet">
        <path d={pathOf(route(norm))} fill="none" stroke="currentColor"
          strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
        {norm.map((p, i) => (
          <g key={i} transform={`translate(${p.x - 11} ${p.y - 11})`}>
            <Glyph type={st[i].type} size={22} />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   05 · SERVICES — one bullet per beat; the field wipes as each takes over.
   ────────────────────────────────────────────────────────────── */
export function Services() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".sv");
      const fields = gsap.utils.toArray<HTMLElement>(".sv-field");
      gsap.set(cards, { opacity: 0, scale: 0.9 });
      gsap.set(fields, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current!, start: "top top", end: "+=300%", pin: true, scrub: 0.6, invalidateOnRefresh: true },
      });
      /* One bullet per beat. Each card is fully gone before the next arrives —
         a crossfade of identical layouts just reads as a collision. */
      cards.forEach((c, i) => {
        const at = i * 1;
        const last = i === cards.length - 1;
        tl.to(fields[i], { opacity: 1, duration: 0.3, ease: "power1.inOut" }, at)
          .to(c, { opacity: 1, scale: 1, duration: 0.42, ease: "expo.out" }, at + 0.06);
        /* The last card holds to the end of the pin — otherwise the section
           spends its final viewport as an empty panel. */
        if (!last) {
          tl.to(c, { opacity: 0, scale: 1.04, duration: 0.3, ease: "power2.in" }, at + 0.72)
            .to(fields[i], { opacity: 0, duration: 0.3, ease: "power1.inOut" }, at + 0.8);
        }
        tl.to(".sv-rail span", { opacity: (j: number) => (j === i ? 1 : 0.3), duration: 0.28 }, at);
      });
      tl.to({}, { duration: 0.35 });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="services" ref={root} aria-label="Services">
      {/* Stacked tinted fields rather than a background tween — GSAP cannot
          interpolate a CSS variable, and the theme has to keep working. */}
      <div className="sv-fields" aria-hidden="true">
        {SERVICES.map((s) => <div key={s.key} className={`sv-field f-${s.key}`} />)}
      </div>
      <div className="sv-stack">
        {SERVICES.map((s) => (
          <article className="sv" key={s.key}>
            {s.shape === "diamond"
              ? <Diamond ch={s.key} size={92} title={s.name} />
              : <Bullet ch={s.key} size={92} title={s.name} />}
            <h3>{s.name}</h3>
            <p>{s.blurb}</p>
          </article>
        ))}
      </div>
      <div className="sv-rail" aria-hidden="true">
        {SERVICES.map((s) => <span key={s.key}>{s.name}</span>)}
      </div>
    </section>
  );
}
