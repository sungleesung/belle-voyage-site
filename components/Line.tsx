"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  RUN, ONWARD, INTRO, FLYBY, LEAD, INTRO_ANCHOR, PLATE_GAP,
  A, B, C, STOPS, REGIONS, STROKE,
  onDiag, d, dRound, frame, cameraAt, capPan, REGIONS_TITLE_Y,
} from "@/lib/line";
import type { P } from "@/lib/line";
import { getLenis } from "@/lib/lenis";
import { getView, openContact } from "@/lib/overlay";

/* Positioning the camera must happen before the browser paints, or the first
   frame is the landing. useLayoutEffect does; useEffect does not. */
const useIsoLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const reduced = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function Shape({ shape }: { shape: "circle" | "square" | "triangle" }) {
  const p = { className: "ln-shape", fill: "#000", stroke: "#fff",
    strokeWidth: 8, strokeLinejoin: "round" as const };
  if (shape === "circle") return <circle r="30" {...p} />;
  if (shape === "square") return <rect x="-26" y="-26" width="52" height="52" {...p} />;
  return <polygon points="0,-31 28,18 -28,18" {...p} />;
}

export function Line() {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cam = useRef<SVGGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const gulp = useRef<SVGPathElement>(null);
  const introPath = useRef<SVGPathElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const capped = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  /* Set while the intro owns the camera, so a resize re-derives it. Null after
     the intro hands over, because then the scroll owns the camera. */
  const reframe = useRef<(() => void) | null>(null);

  /* The frame follows the viewport shape so the line is never cropped.

     Declared out here and called from the LAYOUT effect as well as from resize.
     The markup ships an SSR viewBox that is only a placeholder; if the only
     thing that replaces it is a passive effect, the first composited frame
     shows the drawing at the placeholder's scale while the plate — HTML, placed
     from the real frame — has already been positioned for the true one, and
     they disagree for a frame. */
  const fit = () => {
    const el = svg.current; if (!el) return;
    const r = el.getBoundingClientRect();
    capped.current = capPan(r.width, r.height);
    const f = frame(r.width, r.height);
    el.setAttribute("viewBox", `${f.x} ${f.y} ${f.w} ${f.h}`);
    /* Nothing is tweening during the held beat, so without this a resize leaves
       the camera and the plate placed for the frame that has just gone. */
    reframe.current?.();
    fitPlate.current?.();
  };
  const fitPlate = useRef<(() => void) | null>(null);

  useEffect(() => {
    const ro = new ResizeObserver(fit);
    if (svg.current) ro.observe(svg.current);
    addEventListener("resize", fit);
    return () => { ro.disconnect(); removeEventListener("resize", fit); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useIsoLayout(() => {
    /* Before .ready, so nothing is ever shown at the placeholder scale. */
    fit();
    svg.current?.classList.add("ready");
    if (reduced()) return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("motion");

    const ctx = gsap.context(() => {

      const put = (x: number, y: number) =>
        cam.current?.setAttribute("transform", `translate(${x} ${y})`);

      /* ── the opening ─────────────────────────────────────────────
         The line down the left with its first station named beside it: a stop
         and a plate, the same construction the regions use further down, so
         the first thing on screen is already the system rather than a title
         card laid over it. The plate goes; the station does not — it gets left
         behind on the line like every other stop.

         Then the camera RIDES the line down. Translating on Y alone made the
         line whip across the viewport, because the path turns and the camera
         did not. Anchoring the travelled point and easing that anchor into the
         landing position means the ride ends exactly on frame zero — no blend,
         no seam, no correction at the end. */
      /* Assigned only if the intro actually arms. Runs on ctx.revert(). */
      let closeIntro = () => {};
      const seen = sessionStorage.getItem("bv-arrived");
      const ip = introPath.current!;
      const IL = ip.getTotalLength();
      const smooth = (a: number, b: number, v: number) => {
        const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
        return t * t * (3 - 2 * t);
      };
      /* The anchor slides home over the last stretch, measured in path units
         still to run rather than as a fraction of u — so it stays tied to the
         detour and to A, and does not drift when the path length changes. It
         begins as the detour arrives and ends just short of A, which makes the
         turn and the settle read as one move. */
      const SLIDE_FROM = 1850, SLIDE_TO = 245;
      const settle = () => {
        path.current?.setAttribute("d", d(ONWARD));
        gsap.set(".ln-flyby", { opacity: 0 });
      };
      /* The plate is HTML, so it is placed in screen terms from the same frame
         the camera uses. The camera does start moving 200ms before the plate has
         finished fading, and the plate does not follow it — by then it is under
         20% opacity and the drift is 3px, but anything that retimes either tween
         has to keep that true.

         Placement is cheap and idempotent, so it can run every ride frame.
         Fitting the type is not — it reads layout — so that runs only when the
         frame actually changes. */
      const placePlate = () => {
        const el = box.current;
        if (!el) return;
        const f = frame(window.innerWidth, window.innerHeight);
        el.style.setProperty("--px",
          `${((INTRO_ANCHOR.x + PLATE_GAP) - f.x) / f.w * 100}%`);
        el.style.setProperty("--py", `${(INTRO_ANCHOR.y - f.y) / f.h * 100}%`);
      };
      /* max-width cannot shrink the wordmark — the lines are nowrap, so a
         constrained box just overflows. The font-size clamp was the only real
         defence and it is a function of width alone, while the room the line
         leaves depends on the aspect ratio too: on a short, wide frame the
         wordmark ran out through its own keyline. Measuring the rendered text
         is exact, and survives the font falling back to Arial on Windows,
         which no hand-tuned clamp would. */
      fitPlate.current = () => {
        const pn = box.current?.querySelector<HTMLElement>(".ln-box-panel");
        if (!pn) return;
        pn.style.removeProperty("font-size");
        /* Range, not scrollWidth. On a block with visible overflow scrollWidth
           reports the layout width and simply does not see text spilling out of
           it — the exact reading that hid this in the first place. */
        const rng = document.createRange();
        let widest = 0;
        pn.querySelectorAll<HTMLElement>(".ln-box-l").forEach((n) => {
          rng.selectNodeContents(n);
          widest = Math.max(widest, rng.getBoundingClientRect().width);
        });
        const cs = getComputedStyle(pn);
        const room = pn.clientWidth
          - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        if (widest > room && room > 0) {
          const now = parseFloat(getComputedStyle(pn).fontSize);
          pn.style.fontSize = `${Math.max(15, now * (room / widest))}px`;
        }
      };
      const intro = { u: seen ? 1 : LEAD / IL };
      if (seen) settle();
      const runIntro = () => {
        const P = ip.getPointAtLength(intro.u * IL);
        const a = smooth(1 - SLIDE_FROM / IL, 1 - SLIDE_TO / IL, intro.u);
        put((INTRO_ANCHOR.x + (A.x - INTRO_ANCHOR.x) * a) - P.x,
            (INTRO_ANCHOR.y + (A.y - INTRO_ANCHOR.y) * a) - P.y);
        placePlate();
      };
      runIntro();
      fitPlate.current();

      if (!seen) {
        getLenis()?.stop();
        reframe.current = runIntro;
        gsap.set(".ln-box-panel", { opacity: 1 });
        gsap.set(".ln-flyby", { opacity: 1 });
        /* once:true would only ever remove the one that fired. */
        const EVS = ["wheel", "touchstart", "keydown"] as const;
        const drop = () => EVS.forEach((e) => removeEventListener(e, skip));
        const open = gsap.timeline({
          onComplete: () => {
            sessionStorage.setItem("bv-arrived", "1");
            settle();
            landed = true;
            reframe.current = null;
            drop();
            /* The masthead is reachable during the intro, so an overlay can
               already be open by the time this fires. Starting Lenis anyway
               scrolled the page behind it. */
            if (!getView()) getLenis()?.start();
          },
        });
        open
          /* Held long enough to be read, then it goes and the journey starts —
             the last of the fade runs under the first of the ride, so leaving
             the station is one move rather than two. */
          .to(".ln-box-panel", { opacity: 0, duration: 0.55, ease: "power2.in" }, 0.75)
          .to(intro, { u: 1, duration: 1.95, ease: "power2.inOut", onUpdate: runIntro }, 1.10)
          .fromTo(".ln-stop", { opacity: 0 },
            { opacity: 1, duration: 0.55, stagger: 0.1, ease: "power2.out" }, 2.45)
          /* The stops passed on the way down belong to the descent, so they go
             out with it — landing exactly when the camera stops, rather than
             being cut a frame later when settle() swaps the path out. */
          .to(".ln-flyby", { opacity: 0, duration: 0.5, ease: "power2.in" }, 2.55);
        const mh = document.querySelector<HTMLElement>(".mh");
        if (mh) {
          /* opacity 0 does not stop a click or a Tab. Same fault as the region
             links: an invisible control that still works. */
          mh.inert = true;
          open.fromTo(mh, { opacity: 0 },
            { opacity: 1, duration: 0.6, ease: "power2.out" }, 2.65)
            .set(mh, { inert: false }, 2.65);
        }

        /* Anyone who reaches for the scrollbar has decided not to watch it —
           so land 0.55s from the input, whenever it lands. */
        const skip = () => {
          const left = open.duration() - open.time();
          if (left > 0.55) open.timeScale(left / 0.55);
          drop();
        };
        EVS.forEach((e) => addEventListener(e, skip, { passive: true }));
        /* Unmounting mid-intro would otherwise leave three window listeners
           attached and Lenis stopped — a page that can never scroll again. */
        closeIntro = () => { drop(); if (!landed) getLenis()?.start(); };
      }

      /* ── the journey ─────────────────────────────────────────────
         One scalar drives the camera; everything else keys off it. */
      const s = { p: 0 };
      let landed = !!seen;
      const move = () => { if (!landed) return; const c = cameraAt(s.p, capped.current); put(c.x, c.y); };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current!, start: "top top", end: "+=280%",
          pin: true, scrub: 0.35, invalidateOnRefresh: true,
        },
      });

      tl.to(s, { p: 1, duration: 10, ease: "none", onUpdate: move, immediateRender: false }, 0)
        /* White sheets down over the black, and the line flips as the edge
           crosses it — so the change reads as caused by the wipe. */
        .to(sheet.current!, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power2.inOut" }, 2.1)
        .to(path.current!, { stroke: "#000000", duration: 0.3, ease: "power1.inOut" }, 2.9)
        /* A station is the ground knocked out with a keyline, so when the
           ground changes the station has to change with it. */
        .to(".ln-shape", { fill: "#ffffff", stroke: "#000000", duration: 0.32, ease: "power1.inOut" }, 2.42)
        .to(".ln-lab", { fill: "#000000", duration: 0.32, ease: "power1.inOut" }, 2.42)
        /* Everything reaches full before the frame that shows it all together. */
        .fromTo(".ln-head", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 2.8)
        .fromTo(".ln-region", { opacity: 0 },
          { opacity: 1, duration: 0.7, stagger: 0.25, ease: "power2.out" }, 3.0)
        /* opacity:0 does not stop a tap. Without this the region links sit
           live under the bottom-right of the landing screen. */
        .set(".ln-region", { pointerEvents: "auto" }, 3.0)
        /* Nothing is dismissed. The line keeps descending and then grows until
           it has taken the regions and the rest of the frame with it. */
        .to(gulp.current!, {
          strokeWidth: () => {
            /* Measured off the viewport, NOT off the svg's viewBox attribute.
               On a resize, ScrollTrigger pins the section at hard pixel sizes
               and refreshes before the ResizeObserver has rewritten the
               viewBox — so reading the attribute here yields the pre-rotation
               frame, and the end value latches to it for good. innerWidth /
               innerHeight are already correct at that instant. */
            const vpw = window.innerWidth, vph = window.innerHeight;
            const f = frame(vpw, vph);
            const c = cameraAt(1, capPan(vpw, vph));
            /* Exact: the furthest frame corner from the line, measured
               perpendicular to it. Measuring the horizontal gap instead
               overstates the diagonal by root-2, and the stroke then went on
               growing for a fifth of a screen after the frame was already
               covered — which is where the black-only pause came from. */
            const seg: [P, P][] = [
              [{ x: A.x, y: A.y - 6000 }, A], [A, B], [B, C],
              [C, { x: C.x, y: C.y + 6000 }],
            ];
            let need = 0;
            for (const px of [f.x - c.x, f.x + f.w - c.x])
              for (const py of [f.y - c.y, f.y + f.h - c.y]) {
                let best = Infinity;
                for (const [p, q] of seg) {
                  const vx = q.x - p.x, vy = q.y - p.y;
                  const wx = px - p.x, wy = py - p.y;
                  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
                  best = Math.min(best, Math.hypot(wx - t * vx, wy - t * vy));
                }
                need = Math.max(need, best);
              }
            return Math.ceil(need * 2 * 1.06);
          },
          duration: 1.8, ease: "power2.in",
        }, 8.2);
      return () => closeIntro();
    }, root);

    return () => {
      reframe.current = null;
      fitPlate.current = null;
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
          {/* The first is the named station — the one the plate belongs to — so
              it is drawn larger, the same way the region stations are larger
              than the stops passed on the way down. */}
          {FLYBY.map((p, i) => (
            <circle key={i} className="ln-flyby" cx={p.x} cy={p.y}
              r={i === 0 ? 30 : 19} fill="#000" stroke="#fff" strokeWidth={i === 0 ? 9 : 8} />
          ))}

          {/* the landing — shapes, because this is navigation */}
          {STOPS.map((st) => {
            const p = onDiag(st.t);
            return (
              <g key={st.label} className="ln-stop" transform={`translate(${p.x} ${p.y})`}>
                <a href={st.href} aria-label={st.label}
                  onClick={st.href === "#contact" ? openContact : undefined}>
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
                <rect className="ln-hit" x="72" y="-60" width="446" height="120" fill="transparent" />
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

          {/* Paints last, so what it grows over includes the regions. */}
          <path ref={gulp} d={d(ONWARD)} fill="none" stroke="#000" strokeWidth="0"
            strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      {/* The opening: the station on the line, named. Decorative — the
          masthead carries the real wordmark. */}
      <div className="ln-box" ref={box} aria-hidden="true">
        <span className="ln-box-panel">
          <span className="ln-box-l">Belle&nbsp;V<i className="ring">
            <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38.3" fill="none"
              stroke="currentColor" strokeWidth="23.4" /></svg></i>yage</span>
          <span className="ln-box-l">Estates</span>
        </span>
      </div>
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
