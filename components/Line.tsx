"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  RUN, ONWARD, INTRO, FLYBY, A, B, STOPS, REGIONS, STROKE,
  onDiag, d, dRound, frame, cameraAt, REGIONS_TITLE_Y,
} from "@/lib/line";
import { getLenis } from "@/lib/lenis";

/* Positioning the camera must happen before the browser paints, or the first
   frame is the landing. useLayoutEffect does; useEffect does not. */
const useIsoLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const reduced = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function Shape({ shape }: { shape: "circle" | "square" | "triangle" }) {
  const p = { fill: "#000", stroke: "#fff", strokeWidth: 8, strokeLinejoin: "round" as const };
  if (shape === "circle") return <circle r="30" {...p} />;
  if (shape === "square") return <rect x="-26" y="-26" width="52" height="52" {...p} />;
  return <polygon points="0,-31 28,18 -28,18" {...p} />;
}

export function Line() {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cam = useRef<SVGGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const introPath = useRef<SVGPathElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

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

  useIsoLayout(() => {
    svg.current?.classList.add("ready");
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("motion");

    const ctx = gsap.context(() => {

      const put = (x: number, y: number) =>
        cam.current?.setAttribute("transform", `translate(${x} ${y})`);

      /* ── the descent ─────────────────────────────────────────────
         The camera RIDES the line rather than sliding past it. Translating on
         Y alone made the line whip across 54% of the viewport six times in
         three seconds, because the path winds and the camera did not.

         Anchoring the travelled point and easing the anchor into the landing
         position means the ride ends exactly on frame zero — no blend, no
         seam, no correction at the end. */
      const seen = sessionStorage.getItem("bv-arrived");
      const ip = introPath.current!;
      const IL = ip.getTotalLength();
      const smooth = (a: number, b: number, v: number) => {
        const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
        return t * t * (3 - 2 * t);
      };
      const settle = () => {
        path.current?.setAttribute("d", d(ONWARD));
        gsap.set(".ln-flyby", { opacity: 0 });
      };
      const ride = { u: seen ? 1 : 0 };
      if (seen) settle();
      const runIntro = () => {
        const P = ip.getPointAtLength(ride.u * IL);
        /* Hold the travelled point mid-frame, then settle it into the exact
           spot the landing wants it, so the two states meet seamlessly. */
        const k = smooth(0.55, 0.94, ride.u);
        put((500 + (180 - 500) * k) - P.x, (470 + (200 - 470) * k) - P.y);
      };
      runIntro();

      if (!seen) {
        getLenis()?.stop();
        const arrive = gsap.to(ride, {
          u: 1, duration: 2.6, ease: "power3.out", onUpdate: runIntro,
          onComplete: () => {
            sessionStorage.setItem("bv-arrived", "1");
            settle();
            landed = true;
            getLenis()?.start();
          },
        });
        /* Anyone who reaches for the scrollbar has decided not to watch it. */
        const skip = () => arrive.duration(Math.min(arrive.duration(), arrive.time() + 0.55));
        ["wheel", "touchstart", "keydown"].forEach((e) =>
          addEventListener(e, skip, { once: true, passive: true }));

        gsap.fromTo(".ln-stop", { opacity: 0 },
          { opacity: 1, duration: 0.55, stagger: 0.1, ease: "power2.out", delay: 1.95 });
        const mh = document.querySelector(".mh");
        if (mh) gsap.fromTo(mh, { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: "power2.out", delay: 2.15 });
      }

      /* ── the journey ─────────────────────────────────────────────
         One scalar drives the camera; everything else keys off it. */
      const s = { p: 0 };
      let landed = !!seen;
      const move = () => { if (!landed) return; const c = cameraAt(s.p); put(c.x, c.y); };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current!, start: "top top", end: "+=320%",
          pin: true, scrub: 0.35, invalidateOnRefresh: true,
        },
      });

      tl.to(s, { p: 1, duration: 10, ease: "none", onUpdate: move, immediateRender: false }, 0)
        /* White sheets down over the black, and the line flips as the edge
           crosses it — so the change reads as caused by the wipe. */
        .to(".ln-stop", { opacity: 0, duration: 0.4, ease: "power1.in" }, 1.95)
        .to(sheet.current!, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power2.inOut" }, 2.1)
        .to(path.current!, { stroke: "#000000", duration: 0.3, ease: "power1.inOut" }, 2.9)
        /* Everything reaches full before the frame that shows it all together. */
        .fromTo(".ln-head", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 2.8)
        .fromTo(".ln-region", { opacity: 0 },
          { opacity: 1, duration: 0.7, stagger: 0.25, ease: "power2.out" }, 3.0)
        .to(".ln-region, .ln-head", { opacity: 0, duration: 0.5, ease: "power1.in" }, 6.2)
        /* The line keeps descending, then grows until there is nothing else. */
        .to(path.current!, { strokeWidth: 3600, duration: 1.8, ease: "power2.in" }, 7.5);
    }, root);

    return () => {
      ctx.revert();
      document.documentElement.classList.remove("motion", "holding");
    };
  }, []);

  return (
    <>
    <div className="ln" ref={root}>
      <div className="ln-bg" />
      <div className="ln-sheet" ref={sheet} />
      <svg ref={svg} className="ln-svg" viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid meet" role="navigation" aria-label="Main">
        <g ref={cam}>
          {/* Measured, never painted — it is what the camera rides. */}
          <path ref={introPath} d={dRound(INTRO)} fill="none" stroke="none" />
          <path ref={path} d={d(RUN)} fill="none" stroke="var(--ca)"
            strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />

          {/* stops that fly past on the way down */}
          {FLYBY.map((p, i) => (
            <circle key={i} className="ln-flyby" cx={p.x} cy={p.y} r="19" fill="var(--paper)"
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

          <text className="ln-head" x={B.x + 78} y={REGIONS_TITLE_Y}>Regions</text>

          {/* the regions — colours, because these ARE the regions */}
          {REGIONS.map((r) => (
            <g key={r.code} className={`ln-region ln-region-${r.code}`} transform={`translate(${B.x} ${r.y})`}>
              <a href={r.href} aria-label={`Properties in ${r.name}`}>
                <circle r="34" fill={r.colour} stroke="#000" strokeWidth="8" />
                <rect className="ln-plate" x="78" y="-46" width="430" height="92" rx="3"
                  style={{ ["--c" as string]: r.colour }} />
                <text className="ln-rname" x="112" y="0">{r.name}</text>
                <g className="ln-arw" transform="translate(452 0)" style={{ ["--c" as string]: r.colour }}>
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
