"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis } from "@/lib/lenis";

/* One scroll system for the whole site. Lenis drives ScrollTrigger; nothing else
   instantiates a smoother. allowNestedScroll keeps inner scrollers alive —
   data-lenis-prevent is a scroll trap and is never used here. */
export function Scroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, allowNestedScroll: true });
    setLenis(lenis);
    /* Held until the ride finishes. overflow:hidden never did this — Lenis is
       not the document scroller. */
    let held = false;
    try { held = !sessionStorage.getItem("bv-arrived"); } catch {}
    if (held) lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      setLenis(null);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
  return <>{children}</>;
}
