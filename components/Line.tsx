"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  RUN, ONWARD, INTRO, FLYBY, LEAD, INTRO_ANCHOR, PLATE_GAP, REST_P,
  ABOUT_STOP, ABOUT_END, ABOUT_CAM, PROPS_STOP, PROPS_END, PROPS_CAM,
  A, B, C, STOPS, REGIONS, STROKE,
  onDiag, d, dRound, frame, cameraAt, capPan, REGIONS_TITLE_Y,
} from "@/lib/line";
import type { P } from "@/lib/line";
import { getLenis } from "@/lib/lenis";
import { Arrow } from "./Arrow";

/* Rendered twice — at the end of the branch, and flat for anyone without
   motion — so there is one copy of the words, not two to drift. */
const ABOUT_COPY = [
  "Belle Voyage Estates was founded by Cira Vogler in Windsor, Ontario in 2024 with four properties across Europe and the UK. Since then, we\u2019ve expanded to North America across short and long-term rental properties, real estate wholesaling, and real estate development and management projects.",
  "We strive to offer the best possible service to both our clients and their customers.",
];
import { getView, onView, openContact, setView } from "@/lib/overlay";

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
  /* Matched by area, not by box. The disc and the square were already tuned to
     each other; a triangle in the same 60-unit frame carries half their visual
     mass, so it is scaled until the ink matches — which makes it wider than
     both, and correct. */
  return <polygon points="0,-43 39,25 -39,25" {...p} />;
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
  /* Cached on fit so the per-frame placement never reads layout. */
  const size = useRef({ w: 0, h: 0 });
  const anchor = useRef<HTMLDivElement>(null);
  /* The panel's own offset inside the anchor. Constant until layout changes,
     and read there rather than per frame. */
  const aboutTop = useRef(60);
  const gutter = useRef(20);
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
  /* Which pole the mark is standing on. The first version worked this out from
     the timeline's position and where the contact sheet had reached, and was
     blind to the swallow — which blacks the whole frame about a screen before
     the contact sheet arrives, so the panel stayed white on a black page for
     most of a viewport. Inference cannot be made complete here; every ground
     the site ever grows would have to be taught to it.

     So ask instead. elementsFromPoint returns the whole stack under the mark,
     the mark's own layers are skipped, and the first full-bleed ground decides.
     Strokes and plates on the way are stepped over: they are drawn ON a ground
     rather than being one. Contrast does not depend on any of this — the ink
     is on the panel at 21:1 either way — so a wrong answer costs a visible
     edge, never a legible mark. */
  const paint = () => {
    const mh = document.querySelector<HTMLElement>(".mh");
    if (!mh) return;
    const box = mh.getBoundingClientRect();
    let lit = false;
    for (const el of document.elementsFromPoint(box.left + box.width / 2, box.bottom + 6)) {
      if (el.closest(".mh")) continue;
      const c = el.classList;
      if (c.contains("ln-gulp") || c.contains("ln-bg")) break;
      if (c.contains("ln-sheet") || el.closest(".ln-fallback")) { lit = true; break; }
      if (el.closest(".ct") || el.closest(".ft")) break;
    }
    document.documentElement.classList.toggle("mh-light", lit);
  };

  const fit = () => {
    const panel = anchor.current?.querySelector<HTMLElement>(".ln-about");
    if (panel) aboutTop.current = panel.offsetTop;
    gutter.current = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--pad")) || 20;
    paint();
    const el = svg.current; if (!el) return;
    const r = el.getBoundingClientRect();
    size.current = { w: r.width, h: r.height };
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
    if (reduced()) {
      paint();
      const repaint = () => paint();
      addEventListener("scroll", repaint, { passive: true });
      addEventListener("resize", repaint);
      return () => {
        removeEventListener("scroll", repaint);
        removeEventListener("resize", repaint);
        document.documentElement.classList.remove("mh-light");
      };
    }
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
      /* The intro is what raises the statement, and a second visit in the same
         session never runs it — so without this the sentence is authored,
         rendered, and permanently invisible for everyone who comes back. */
      if (seen) { settle(); gsap.set(".ln-say", { opacity: 1, y: 0 }); }
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
            if (wanted) { wanted = false; goAbout(); }
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
          .fromTo(".ln-say", { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 2.6)
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
      /* The excursion west and the scroll south both move the same camera, so
         they go through one renderer and add rather than fight. */
      const away = { x: 0, y: 0, live: false };
      /* The About copy belongs to the terminus, so it is placed from the live
         camera every frame rather than parked at the arrival position. It used
         to be fixed on screen and cross-faded, and the fade was only there to
         hide the fact that it did not move — the words appeared out of nowhere
         instead of arriving with the station they belong to. */
      const carry = (cx: number, cy: number) => {
        const el = anchor.current;
        if (!el || (!away.live && away.x === 0)) return;
        const f = frame(window.innerWidth, window.innerHeight);
        const ax = ((ABOUT_END.x + cx - f.x) / f.w) * size.current.w;
        const ay = ((ABOUT_END.y + cy - f.y) / f.h) * size.current.h;
        el.style.setProperty("--atx", `${ax}px`);
        el.style.setProperty("--aty", `${ay}px`);
        /* What is actually left of the frame from where the panel starts. Both
           are arithmetic on numbers already in hand — no layout read. The
           margin is the page's own gutter, read once per fit rather than
           typed: an 18 here matched --pad at no viewport it ever ran at. */
        const edge = gutter.current;
        el.style.setProperty("--aw",
          `${Math.max(240, window.innerWidth - ax - edge)}px`);
        el.style.setProperty("--ah",
          `${Math.max(150, window.innerHeight - ay - aboutTop.current - edge)}px`);
      };
      const render = () => {
        const c = cameraAt(s.p, capped.current);
        put(c.x + away.x, c.y + away.y);
        carry(c.x + away.x, c.y + away.y);
        paint();
      };
      const move = () => { if (!landed) return; render(); };

      const tl: gsap.core.Timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root.current!, start: "top top", end: "+=280%",
          pin: true, scrub: 0.35, invalidateOnRefresh: true,
        },
      });

      /* ── the excursion west ──────────────────────────────────────
         About is not a page, it is a stop on a branch — so reaching it is a
         journey along that branch rather than a navigation away from it. The
         branch is level, so this is a pure sideways pan and the camera tracks
         the line exactly.

         Delegated from the document, so every About link goes the same way:
         the stop on the diagonal, the menu, the footer and the audience path
         at the foot of the contact sheet. */
      const panel = () => root.current?.querySelector<HTMLElement>(".ln-about");
      /* Coming back puts you at the junction, so that is where focus belongs —
         not on whatever was clicked. Restoring focus to a footer link scrolled
         the browser back down to it, undoing the return journey in one frame,
         and the menu's link no longer exists by then anyway. */
      /* The panel and its Back button are about to be torn down. If focus is
         on either — or has already fallen to <body> because they went first —
         it has to land on something real and on screen; leaving it on the stop
         it came from means the next Tab restarts from the top. */
      const junction = () => {
        const live = document.activeElement;
        const held = live && live !== document.body
          && !root.current?.contains(live);
        if (held) return;
        document.querySelector<HTMLElement>(".mh-burger")?.focus({ preventScroll: true });
      };
      /* Nothing behind the panel is reachable while it is up. Two Tabs used to
         land in the enquiry form, and the browser's own scroll-into-view then
         moved the document out from under a camera that was holding still —
         lenis.stop() does not prevent that, it only stops wheel and touch. */
      const contain = (on: boolean) => {
        const mh = document.querySelector<HTMLElement>(".mh");
        const ct = document.querySelector<HTMLElement>(".ct");
        /* The fallback nav is the one live thing left inside <main>, and it
           slides itself up on focus — so without this, Tab out of the About
           panel raised it over the excursion it was meant to be behind. */
        const fb = document.querySelector<HTMLElement>(".ln-fallback");
        if (mh) mh.inert = on;
        if (ct) ct.inert = on;
        if (fb) fb.inert = on;
      };

      let trip = 0;
      let wanted = false;
      let warmed: HTMLLinkElement | null = null;
      const arrive = () => {
        contain(true);
        render();
        gsap.to(".ln-say", { opacity: 0, duration: 0.35, ease: "power1.out" });
        gsap.to(away, { x: ABOUT_CAM.x, y: ABOUT_CAM.y, duration: 1.15,
          ease: "power2.inOut", onUpdate: render,
          onComplete: () => panel()?.focus({ preventScroll: true }) });
      };
      const goAbout = () => {
        if (away.live) return;
        /* Asked for before the intro has landed — remembered rather than
           dropped, which is what a click in that window used to be. */
        if (!landed) { wanted = true; return; }
        away.live = true;
        document.documentElement.classList.add("at-about");
        const token = ++trip;
        const lenis = getLenis();
        /* The branch only exists at the landing, so come back up the line
           first — from the footer this reads as retracing the route. The trip
           is claimed before this runs, so Escape works during it. */
        if (window.scrollY > 4 && lenis) {
          lenis.scrollTo(0, { duration: 0.8, easing: (x: number) => 1 - Math.pow(1 - x, 3),
            onComplete: () => { if (token !== trip) return; lenis.stop(); arrive(); } });
          return;
        }
        lenis?.stop();
        arrive();
      };
      const leaveAbout = () => {
        if (!away.live) return;
        trip++;                      // cancels an arrival still on its way
        gsap.killTweensOf(away);     // and stops a departure mid-flight
        warmed?.remove(); warmed = null;   // a cancelled trip warms nothing
        gsap.to(".ln-say", { opacity: (tl.time() >= 0.36 ? 0 : 1), duration: 0.5,
          ease: "power1.out", delay: 0.4 });
        gsap.to(away, { x: 0, y: 0, duration: 1, ease: "power2.inOut", onUpdate: render,
          onComplete: () => {
            away.live = false;
            document.documentElement.classList.remove("at-about");
            contain(false);
            if (!getView()) getLenis()?.start();
            junction();
          } });
      };

      /* Properties is a page, so its branch is a departure rather than an
         excursion: the camera runs north along the green line and the page
         takes over as it goes. Accelerating, because it is leaving. */
      const goProps = () => {
        if (away.live || !landed) return;
        away.live = true;
        contain(true);
        getLenis()?.stop();
        /* Warmed while the camera travels, so the end of the line is the page
           rather than a white flash. */
        const pre = document.createElement("link");
        pre.rel = "prefetch"; pre.href = "/properties";
        document.head.appendChild(pre);
        warmed = pre;
        const token = ++trip;
        gsap.to(away, { x: PROPS_CAM.x, y: PROPS_CAM.y, duration: 0.95,
          ease: "power2.in", onUpdate: render,
          /* Escape bumps the token. Without this the camera visibly turned
             back and the page navigated anyway — the user cancelled and went
             regardless. */
          onComplete: () => { if (token === trip) location.href = "/properties"; } });
      };

      const onAboutClick = (e: MouseEvent) => {
        /* Leave cmd/ctrl/shift-click and any non-primary button alone, so
           "open in new tab" still opens a tab. */
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const t = e.target as Element | null;
        /* Only the stop on the diagonal departs along the green line — the
           menu and footer links to the same page are ordinary navigation. */
        if (t?.closest?.('.ln-stop a[href="/properties"]')) {
          e.preventDefault();
          setView(null);
          goProps();
          return;
        }
        const a = t?.closest?.('a[href="#about"]');
        if (!a) return;
        e.preventDefault();
        setView(null);
        goAbout();
      };
      const onAboutKey = (e: KeyboardEvent) => {
        /* An overlay on top gets the key first — one Escape used to close the
           popup and leave About together. */
        if (e.key === "Escape" && away.live && !getView()) leaveAbout();
      };
      /* Leaving for /properties parks the camera off the drawing, stops Lenis
         and inerts everything. The back button restores all of that from the
         bfcache — a page with nothing clickable anywhere on it. Undo it on the
         way back in. */
      const onShow = (e: PageTransitionEvent) => {
        if (!e.persisted) return;
        gsap.killTweensOf(away);
        away.x = 0; away.y = 0; away.live = false;
        trip++;
        document.documentElement.classList.remove("at-about");
        contain(false);
        render();
        if (!getView()) getLenis()?.start();
      };
      addEventListener("pageshow", onShow);
      addEventListener("click", onAboutClick);
      addEventListener("keydown", onAboutKey);
      /* A shared or bookmarked #about has to arrive at About. With motion on,
         the flat section it points at is display:none, so the link used to land
         on the plain landing with no About anywhere on the page. One frame's
         wait, because Lenis is created by the parent effect after this one. */
      if (location.hash === "#about")
        requestAnimationFrame(() => { if (landed) goAbout(); else wanted = true; });
      root.current?.querySelector(".ln-back")?.addEventListener("click", leaveAbout);

      /* ── settling ────────────────────────────────────────────────
         Three places are worth standing in: the landing, the regions, and the
         contact sheet. Everything between is a transition, so when the scroll
         goes quiet it eases onto the nearest of the three rather than staying
         wherever the wheel ran out.

         Against absolute scroll positions rather than ScrollTrigger's own snap,
         because two of the three live inside the pin and one lives past it, and
         a trigger's snap cannot reach outside its own range. */
      const restAt = () => {
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const out: number[] = [0];
        const st = tl.scrollTrigger;
        if (st) REST_P.forEach((q) => out.push(st.start + (st.end - st.start) * q));
        const ct = document.querySelector<HTMLElement>(".ct");
        if (ct) out.push(ct.getBoundingClientRect().top + window.scrollY);
        /* Clamped before dedupe: a rest point past the end of the document can
           never be reached, and the settle would retry against it forever. */
        return [...new Set(out.map((v) => Math.round(Math.min(max, Math.max(0, v)))))]
          .sort((a, b) => a - b);
      };

      let idle: ReturnType<typeof setTimeout> | undefined;
      let touching = false;
      let lastY = window.scrollY, dir = 1;
      const settleScroll = () => {
        const lenis = getLenis();
        /* Not mid-gesture, not under an open overlay, not during the ride. */
        if (!lenis || touching || getView() || !landed || away.live) return;
        const y = window.scrollY;
        const pts = restAt();
        /* The contact sheet is the last rest there is. Below it sits a form
           and a footer, both taller than the frame on a phone, and settling
           over them left the submit button and both audience paths with no
           scroll position the user was allowed to stop at. Read-and-type
           content scrolls freely. */
        if (y > pts[pts.length - 1] + 4) return;
        const lo = pts.filter((q) => q <= y).pop() ?? pts[0];
        const hi = pts.find((q) => q >= y) ?? pts[pts.length - 1];
        if (hi === lo) return;
        /* Settles the way you were already going. Nearest-point snapping drags
           you back over a screen and a half if you pause halfway through the
           swallow, which is the opposite of what pausing means. The 0.18 is
           hysteresis: nudge the wheel and you stay put rather than being fired
           at the next stop. */
        const f = (y - lo) / (hi - lo);
        const to = dir > 0 ? (f > 0.18 ? hi : lo) : (f < 0.82 ? lo : hi);
        const gap = Math.abs(to - y);
        /* Already there. This is also what stops the settle driving itself:
           its own animation emits the scroll events that reset the timer, and
           when they stop it lands here and does nothing. */
        if (gap < 2) return;
        lenis.scrollTo(to, {
          duration: Math.min(1, 0.32 + (gap / window.innerHeight) * 0.6),
          easing: (x: number) => 1 - Math.pow(1 - x, 3),
        });
      };
      tl.to(".ln-say", { opacity: 0, duration: 0.3, ease: "power1.out" }, 0.06);

      const onScroll = () => {
        paint();
        const y = window.scrollY;
        if (y !== lastY) { dir = y > lastY ? 1 : -1; lastY = y; }
        clearTimeout(idle); idle = setTimeout(settleScroll, 180);
      };
      const onDown = () => { touching = true; clearTimeout(idle); };
      /* One touchend fires per finger. Clearing on the first one scheduled a
         settle while a finger was still down, and the page moved under it. */
      const onUp = (e: TouchEvent) => {
        if (e.touches.length) return;
        touching = false;
        onScroll();
      };
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("touchstart", onDown, { passive: true });
      addEventListener("touchend", onUp, { passive: true });
      addEventListener("touchcancel", onUp, { passive: true });
      /* An overlay blocks the settle, and Lenis.stop() kills one already in
         flight — so opening the menu mid-transition parked the page on a
         half-run reveal and left it there. Closing re-arms it. */
      const offView = onView((v) => { if (!v) onScroll(); });
      const stopSettling = () => {
        offView();
        removeEventListener("pageshow", onShow);
        removeEventListener("click", onAboutClick);
        removeEventListener("keydown", onAboutKey);
        clearTimeout(idle);
        removeEventListener("scroll", onScroll);
        removeEventListener("touchstart", onDown);
        removeEventListener("touchend", onUp);
        removeEventListener("touchcancel", onUp);
        document.documentElement.classList.remove("mh-light");
      };

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
      return () => { closeIntro(); stopSettling(); };
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
      {/* Lives inside .ln, not beside it: the GSAP context scopes every
          selector string to this element, so a heading rendered as a sibling
          in page.tsx was authored, rendered, and never animated — it simply
          stayed at the opacity the stylesheet gave it. It used to be clipped
          to a 1x1 pixel, which left the homepage with two visible paragraphs,
          both in the footer. The line can be the statement and still not be
          the sentence. */}
      <h1 className="ln-say">
        Sales, letting and management across
        {" "}<b>Canada</b>, the <b>United States</b> and <b>Europe</b>
      </h1>
      {/* Not a landmark: every link inside is aria-hidden, so a nav role here
          announces as an empty navigation. The real one is .ln-fallback. */}
      <svg ref={svg} className="ln-svg" viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g ref={cam}>
          {/* Measured, never painted — it is what the camera rides. */}
          <path ref={introPath} d={dRound(INTRO)} fill="none" stroke="none" />
          {/* The About branch, under the trunk at the junction the way a
              branch passes beneath the line it leaves. */}
          <path className="ln-branch"
            d={`M${ABOUT_STOP.x} ${ABOUT_STOP.y}H${ABOUT_END.x}`}
            fill="none" stroke="var(--eu)" strokeWidth={STROKE} strokeLinecap="round" />
          <circle className="ln-branch-end" cx={ABOUT_END.x} cy={ABOUT_END.y} r="30"
            fill="#000" stroke="var(--eu)" strokeWidth="9" />
          <path className="ln-branch"
            d={`M${PROPS_STOP.x} ${PROPS_STOP.y}V${PROPS_END.y}`}
            fill="none" stroke="var(--us)" strokeWidth={STROKE} strokeLinecap="round" />

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
                {/* Same as the regions: focus could land here and the browser
                    could never scroll a pinned drawing to show it. The menu
                    carries all three, reachably. */}
                <a href={st.href} tabIndex={-1} aria-hidden="true"
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
              {/* Out of the tab order and out of the accessibility tree: it
                  lives inside a pinned drawing the browser cannot scroll to, so
                  focus could reach it and then never show it. The same three
                  links are in .ln-fallback, which can be reached. */}
              <a href={r.href} tabIndex={-1} aria-hidden="true">
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
          <path ref={gulp} className="ln-gulp" d={d(ONWARD)} fill="none" stroke="#000" strokeWidth="0"
            strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      {/* The opening: the station on the line, named. Decorative — the
          masthead carries the real wordmark. */}
      {/* At the end of the branch. Screen-space rather than in the drawing:
          SVG text does not wrap, and anything drawn in the world scales with
          the frame — a paragraph would be vast on a laptop and unreadable on
          a phone. */}
      <div className="ln-about-at" ref={anchor} aria-hidden={undefined}>
      <div className="ln-about" data-lenis-prevent tabIndex={-1} role="region"
        aria-label="About Belle Voyage Estates">
        <h2>About</h2>
        {ABOUT_COPY.map((t) => <p key={t.slice(0, 24)}>{t}</p>)}
        <button type="button" className="ln-back">
          <Arrow dir="left" size={18} /> Back to the line
        </button>
      </div>
      </div>

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
    <nav className="ln-fallback" aria-label="Main">
      {STOPS.map((st) => (
        <a key={st.label} href={st.href}>
          <span className="lf-dot lf-plain" aria-hidden="true" />
          <span>{st.label}</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12h16M13 6l6 6-6 6" /></svg>
        </a>
      ))}
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

    {/* Without motion there is no journey west, so About is simply here, and
        the #about link reaches it with no JavaScript at all. */}
    <section className="ln-about-flat" id="about"
      aria-label="About Belle Voyage Estates">
      <h2>About</h2>
      {ABOUT_COPY.map((t) => <p key={t.slice(0, 24)}>{t}</p>)}
    </section>
    </>
  );
}
