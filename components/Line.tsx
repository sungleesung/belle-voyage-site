"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  RUN, PASSED, HERO_A, HERO_B, STOPS, BANDS, CENTRE_X,
  at, straight, d, frame, lerp, type P,
} from "@/lib/line";

const STROKE = 15;
const reduced = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Stops stay upright and keep their shape; only their position is interpolated. */
function Stop({ shape }: { shape: "circle" | "square" | "triangle" }) {
  const p = { fill: "var(--paper)", stroke: "var(--ink)", strokeWidth: 5, strokeLinejoin: "round" as const };
  if (shape === "circle") return <circle r="17" {...p} />;
  if (shape === "square") return <rect x="-15" y="-15" width="30" height="30" {...p} />;
  return <polygon points="0,-18 16,10 -16,10" {...p} />;
}

export function Line() {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cam = useRef<SVGGElement>(null);
  const runPath = useRef<SVGPathElement>(null);
  const pastRef = useRef<SVGGElement>(null);
  const heroPath = useRef<SVGPathElement>(null);
  const stopRefs = useRef<(SVGGElement | null)[]>([]);
  const bandRefs = useRef<(SVGRectElement | null)[]>([]);

  /* The frame is a window onto path space; it must always contain the line
     whatever the viewport shape, so it is computed rather than fixed. */
  useEffect(() => {
    const fit = () => {
      const el = svg.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const f = frame(r.width, r.height);
      el.setAttribute("viewBox", `${f.x} ${f.y} ${f.w} ${f.h}`);
    };
    fit();
    addEventListener("resize", fit);
    const ro = new ResizeObserver(fit);
    if (svg.current) ro.observe(svg.current);
    return () => { removeEventListener("resize", fit); ro.disconnect(); };
  }, []);

  useEffect(() => {
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("motion");

    const ctx = gsap.context(() => {
      /* ── the arrival ─────────────────────────────────────────────
         Someone scrolling down the line far too fast, then easing off. */
      const seen = sessionStorage.getItem("bv-arrived");
      const camY = { v: seen ? 0 : RUN[0].y };
      const drawCam = () =>
        cam.current?.setAttribute("transform", `translate(0 ${-camY.v})`);
      drawCam();

      const LEAD = d(RUN.slice(-3, -1));
      const settle = () => {
        runPath.current?.setAttribute("d", LEAD);
        pastRef.current?.setAttribute("opacity", "0");
      };

      if (seen) settle();

      if (!seen) {
        document.documentElement.classList.add("holding");
        gsap.to(camY, {
          v: 0, duration: 3.4, ease: "expo.out", onUpdate: drawCam,
          onComplete: () => {
            sessionStorage.setItem("bv-arrived", "1");
            document.documentElement.classList.remove("holding");
            settle();
          },
        });
        gsap.fromTo(".ln-stop, .ln-lab", { opacity: 0 },
          { opacity: 1, duration: 0.5, stagger: 0.09, ease: "power2.out", delay: 2.5 });
        gsap.fromTo(".mh", { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out", delay: 2.9 });
      }

      /* ── the straightening ───────────────────────────────────────
         The diagonal stands up and walks to the centre, then the three
         regions grow out of it. One value drives all of it. */
      const s = { p: 0, band: 0 };
      const render = () => {
        const { p, band } = s;
        const a: P = { x: lerp(HERO_A.x, CENTRE_X, p), y: HERO_A.y };
        const b: P = { x: lerp(HERO_B.x, CENTRE_X, p), y: HERO_B.y };
        heroPath.current?.setAttribute("d", d([a, b]));

        STOPS.forEach((st, i) => {
          const from = at(st.t), to = straight(st.t);
          const x = lerp(from.x, to.x, p), y = from.y;
          stopRefs.current[i]?.setAttribute("transform", `translate(${x} ${y})`);
        });

        /* Each band grows sideways out of the line it was part of. */
        const seg = (HERO_B.y - HERO_A.y) / 3;
        bandRefs.current.forEach((r, i) => {
          if (!r) return;
          const w = lerp(STROKE, 2600, band);
          r.setAttribute("x", String(CENTRE_X - w / 2));
          r.setAttribute("y", String(HERO_A.y + i * seg));
          r.setAttribute("width", String(w));
          r.setAttribute("height", String(seg));
        });
        cam.current?.setAttribute("transform", `translate(0 ${-camY.v})`);
      };
      render();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current!, start: "top top", end: "+=260%",
          pin: true, scrub: 0.8, invalidateOnRefresh: true,
        },
      });
      /* Resolved once: GSAP cannot interpolate a var(), and the swap has to
         survive scrubbing in both directions. */
      const cs = getComputedStyle(document.documentElement);
      const hue = (c: string) => cs.getPropertyValue(`--${c.toLowerCase()}`).trim() || "#C54E43";

      tl.to(s, { p: 1, duration: 1, ease: "power2.inOut", onUpdate: render }, 0)
        .fromTo(".ln-lab", { opacity: 1 }, { opacity: 0, duration: 0.35, ease: "power1.out" }, 0.15)
        .fromTo(".ln-stop", { opacity: 1 }, { opacity: 0, duration: 0.35, ease: "power1.out" }, 0.55)
        /* The run is the past; it leaves as the line stands up. */
        .to([runPath.current!, pastRef.current!], { opacity: 0, duration: 0.5, ease: "power1.in" }, 0)
        /* The bands take over while still one stroke wide, wearing the line's
           own colour, so the handover cannot be seen. */
        .fromTo(".ln-band", { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "none" }, 0.94)
        .to(heroPath.current!, { opacity: 0, duration: 0.12, ease: "none" }, 0.94)
        .to(s, { band: 1, duration: 1, ease: "power3.inOut", onUpdate: render }, 1.06)
        /* Only once they are moving do they become three regions. */
        .to(bandRefs.current[1]!, { fill: hue("US"), duration: 0.5, ease: "none" }, 1.06)
        .to(bandRefs.current[2]!, { fill: hue("EU"), duration: 0.5, ease: "none" }, 1.06)
        .fromTo(".ln-bandlab", { opacity: 0 },
          { opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }, 1.75)
        .to({}, { duration: 0.6 });
    }, root);

    return () => { ctx.revert(); document.documentElement.classList.remove("motion", "holding"); };
  }, []);

  const seg = (HERO_B.y - HERO_A.y) / 3;

  return (
    <div className="ln" ref={root}>
      <svg ref={svg} className="ln-svg" viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet" role="navigation" aria-label="Main">
        <g ref={cam}>
          {/* the run behind — everything already travelled */}
          <path ref={runPath} d={d(RUN.slice(0, -1))} fill="none" stroke="var(--ca)"
            strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
          <g ref={pastRef}>
            {PASSED.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="11" fill="var(--paper)"
                stroke="var(--ink)" strokeWidth="5" />
            ))}
          </g>

          {/* the three regions, grown out of the line */}
          {BANDS.map((b, i) => (
            <rect key={b.code} className="ln-band" ref={(el) => { bandRefs.current[i] = el; }}
              x={CENTRE_X - STROKE / 2} y={HERO_A.y + i * seg}
              width={STROKE} height={seg} fill="var(--ca)" />
          ))}

          {/* the landing diagonal */}
          <path ref={heroPath} d={d([HERO_A, HERO_B])} fill="none" stroke="var(--ca)"
            strokeWidth={STROKE} strokeLinecap="round" />

          {STOPS.map((st, i) => {
            const p = at(st.t);
            return (
              <g key={st.label} className="ln-stop"
                ref={(el) => { stopRefs.current[i] = el; }}
                transform={`translate(${p.x} ${p.y})`}>
                <a href={st.href} className="ln-hit" aria-label={st.label}>
                  <circle r="42" fill="transparent" />
                  <Stop shape={st.shape} />
                  <text className="ln-lab" x="46" y="9">{st.label}</text>
                </a>
              </g>
            );
          })}

          {BANDS.map((b, i) => (
            <text key={b.code} className="ln-bandlab" textAnchor="middle"
              x={CENTRE_X} y={HERO_A.y + i * seg + seg / 2 + 9}>
              {b.code} · {b.name}
            </text>
          ))}
        </g>
      </svg>

    </div>
  );
}
