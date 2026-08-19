"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  RUN, INTRO, FLYBY, A, B, STOPS, REGIONS, STROKE,
  onDiag, d, frame, cameraAt,
} from "@/lib/line";

const reduced = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function Shape({ shape }: { shape: "circle" | "square" | "triangle" }) {
  const p = { fill: "var(--paper)", stroke: "var(--ink)", strokeWidth: 8, strokeLinejoin: "round" as const };
  if (shape === "circle") return <circle r="30" {...p} />;
  if (shape === "square") return <rect x="-26" y="-26" width="52" height="52" {...p} />;
  return <polygon points="0,-31 28,18 -28,18" {...p} />;
}

export function Line() {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cam = useRef<SVGGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const bg = useRef<HTMLDivElement>(null);

  /* The frame follows the viewport shape so the line is never cropped. */
  useEffect(() => {
    const fit = () => {
      const el = svg.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const f = frame(r.width, r.height);
      el.setAttribute("viewBox", `${f.x} ${f.y} ${f.w} ${f.h}`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (svg.current) ro.observe(svg.current);
    addEventListener("resize", fit);
    return () => { ro.disconnect(); removeEventListener("resize", fit); };
  }, []);

  useEffect(() => {
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("motion");

    const ctx = gsap.context(() => {
      const cs = getComputedStyle(document.documentElement);
      const hue = (n: string) => cs.getPropertyValue(`--${n}`).trim();
      const RED = hue("ca") || "#C54E43";
      const BLUE = hue("eu") || "#4172D1";
      const PAPER = hue("white") || "#FFFFFF";
      const INK = hue("black") || "#000000";

      const put = (x: number, y: number) =>
        cam.current?.setAttribute("transform", `translate(${x} ${y})`);

      /* ── the descent ─────────────────────────────────────────────
         Someone travelling the line far too fast, then easing off it. */
      const seen = sessionStorage.getItem("bv-arrived");
      const intro = { v: seen ? 0 : 1 };
      const runIntro = () => {
        const c = cameraAt(0);
        /* v=1 sits at the very top of the descent; v=0 is the landing. */
        put(c.x, c.y + intro.v * (0 - INTRO[0].y) * 1);
      };
      runIntro();

      if (!seen) {
        document.documentElement.classList.add("holding");
        gsap.to(intro, {
          v: 0, duration: 3.6, ease: "expo.out", onUpdate: runIntro,
          onComplete: () => {
            sessionStorage.setItem("bv-arrived", "1");
            document.documentElement.classList.remove("holding");
          },
        });
        gsap.fromTo(".ln-stop", { opacity: 0 },
          { opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 2.7 });
        gsap.fromTo(".mh", { opacity: 0 },
          { opacity: 1, duration: 0.7, ease: "power2.out", delay: 3.1 });
      }

      /* ── the journey ─────────────────────────────────────────────
         One scalar drives the camera; everything else keys off it. */
      const s = { p: 0 };
      const move = () => { const c = cameraAt(s.p); put(c.x, c.y); };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current!, start: "top top", end: "+=520%",
          pin: true, scrub: 0.85, invalidateOnRefresh: true,
        },
      });

      tl.to(s, { p: 1, duration: 10, ease: "none", onUpdate: move }, 0)
        /* The landing's stops belong to the diagonal and leave with it. */
        .fromTo(".ln-stop", { opacity: 1 }, { opacity: 0, duration: 1, ease: "power1.out" }, 1.2)
        /* Into the regions: the ground goes black and the line goes white. */
        .to(bg.current!, { backgroundColor: INK, duration: 1.6, ease: "power1.inOut" }, 2.1)
        .to(path.current!, { stroke: PAPER, duration: 1.6, ease: "power1.inOut" }, 2.1)
        .fromTo(".ln-region", { opacity: 0 },
          { opacity: 1, duration: 0.9, stagger: 0.35, ease: "power2.out" }, 3.4)
        /* Out of the regions: back to paper, and the line turns blue. */
        .to(".ln-region", { opacity: 0, duration: 0.6, ease: "power1.in" }, 5.6)
        .to(bg.current!, { backgroundColor: PAPER, duration: 1.5, ease: "power1.inOut" }, 5.9)
        .to(path.current!, { stroke: BLUE, duration: 1.5, ease: "power1.inOut" }, 5.9);
    }, root);

    return () => {
      ctx.revert();
      document.documentElement.classList.remove("motion", "holding");
    };
  }, []);

  return (
    <>
    <div className="ln" ref={root}>
      <div className="ln-bg" ref={bg} />
      <svg ref={svg} className="ln-svg" viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid meet" role="navigation" aria-label="Main">
        <g ref={cam}>
          <path ref={path} d={d(RUN)} fill="none" stroke="var(--ca)"
            strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />

          {/* stops that fly past on the way down */}
          {FLYBY.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="19" fill="var(--paper)"
              stroke="var(--ink)" strokeWidth="8" />
          ))}

          {/* the landing — shapes, because this is navigation */}
          {STOPS.map((st) => {
            const p = onDiag(st.t);
            return (
              <g key={st.label} className="ln-stop" transform={`translate(${p.x} ${p.y})`}>
                <a href={st.href} aria-label={st.label}>
                  <circle r="62" fill="transparent" />
                  <Shape shape={st.shape} />
                  <text className="ln-lab" x="62" y="13">{st.label}</text>
                </a>
              </g>
            );
          })}

          {/* the regions — colours, because these ARE the regions */}
          {REGIONS.map((r) => (
            <g key={r.code} className="ln-region" transform={`translate(${B.x} ${r.y})`}>
              <a href={r.href} aria-label={`Properties in ${r.name}`}>
                <circle r="34" fill={r.colour} stroke="var(--white)" strokeWidth="8" />
                <rect className="ln-plate" x="78" y="-46" width="430" height="92" rx="3" />
                <text className="ln-rname" x="112" y="12">{r.name}</text>
                <g className="ln-arw" transform="translate(452 0)">
                  <path d="M-14 0h26M4 -10l10 10-10 10" fill="none" strokeWidth="4"
                    strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </a>
            </g>
          ))}
        </g>
      </svg>
    </div>

    {/* Without motion the camera never travels, so the regions would be
        unreachable. They get a plain list instead — same links, no journey. */}
    <nav className="ln-fallback" aria-label="Regions">
      {REGIONS.map((r) => (
        <a key={r.code} href={r.href}>
          <span className="lf-dot" style={{ background: r.colour }} aria-hidden="true" />
          <span>{r.name}</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12h16M13 6l6 6-6 6" /></svg>
        </a>
      ))}
    </nav>
    </>
  );
}
