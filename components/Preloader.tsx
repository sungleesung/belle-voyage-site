"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { TOTAL } from "@/lib/net";

/* The departure. A counter to the real listing total, three trunks drawing
   across the field, then the curtain lifts into the hero mid-motion.
   Runs once per session — never on a back-navigation. */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("bv-arrived");
    const el = root.current;
    if (!el) return;

    if (seen || reduce) {
      el.style.display = "none";
      document.documentElement.classList.add("arrived");
      return;
    }
    el.classList.add("pl--armed");
    document.documentElement.classList.add("holding");

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem("bv-arrived", "1");
          document.documentElement.classList.remove("holding");
          document.documentElement.classList.add("arrived");
          if (el) el.style.display = "none";
        },
      });
      const count = { v: 0 };
      tl.to(count, {
        v: TOTAL, duration: 1.6, ease: "power2.inOut",
        onUpdate: () => setN(Math.round(count.v)),
      }, 0);
      el.querySelectorAll<SVGPathElement>(".pl-line").forEach((p, i) => {
        const L = p.getTotalLength();
        gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
        tl.to(p, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, i * 0.13);
      });
      tl.to(".pl-body", { opacity: 0, duration: 0.4, ease: "power2.in" }, 1.9);
      /* The curtain lifts rather than fades — the sign is a physical object. */
      tl.to(el, { yPercent: -100, duration: 1.0, ease: "expo.inOut" }, 2.1);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className="pl" ref={root} aria-hidden="true">
      {/* Fail open. Without JS the curtain is never dismissed, so it must not
          be visible in the first place. */}
      <noscript><style>{`.pl{display:none!important}`}</style></noscript>
      <div className="pl-body">
        <svg className="pl-svg" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid meet">
          <path className="pl-line" d="M60 90 L300 90 L380 170 L620 170" stroke="var(--ca)" />
          <path className="pl-line" d="M60 170 L200 170 L280 90 L940 90" stroke="var(--us)" />
          <path className="pl-line" d="M60 250 L520 250 L600 170 L940 170" stroke="var(--eu)" />
        </svg>
        <div className="pl-n"><span>{String(n).padStart(3, "0")}</span> properties</div>
      </div>
    </div>
  );
}
