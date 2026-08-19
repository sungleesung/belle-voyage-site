"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* One scroll system for the whole site. Lenis drives ScrollTrigger; nothing else
   instantiates a smoother. allowNestedScroll keeps inner scrollers alive —
   data-lenis-prevent is a scroll trap and is never used here. */
export function Scroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, allowNestedScroll: true });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
  return <>{children}</>;
}
