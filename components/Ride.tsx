"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onRide, setNavigator, arriveOnly, getRide, type Ride as R } from "@/lib/ride";

/* The field that owns the screen while a route swaps.

   Mounted in the layout, so it is the one thing that survives the swap — the
   pages either side of it are unmounted and remounted around it. Black with a
   green edge top and bottom: the field is the line seen from inside, so one
   edge leads on the way in and the other trails on the way out. That is the
   swallow the landing already ends with rather than a second idiom.

   One direction of travel per trip. Going out the camera runs north up the
   branch, the world slides down, and the field arrives from above and leaves
   below. Coming back it runs the other way.

   All this component does is render what lib/ride says and lend it a router.
   The sequence is not run from here on purpose — see the note in that file. */
export function Ride() {
  const [ride, setRide] = useState<R>(null);
  const router = useRouter();

  useEffect(() => {
    setNavigator((href) => router.push(href));
    return onRide(setRide);
  }, [router]);

  useEffect(() => {
    const onPop = () => { if (!getRide()) arriveOnly(location.pathname); };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  /* The phase, not just the fact of a ride: the arrival stagger has to start
     when the field begins to leave. Keyed to the ride as a whole it played
     while the field still covered the screen, and was over before anyone saw
     it. */
  useEffect(() => {
    const el = document.documentElement;
    if (ride) el.dataset.ride = ride.phase; else delete el.dataset.ride;
    /* The field stops the mouse but not the Tab key: on the return leg nothing
       else is inert, and Tab walked straight through a covered page onto rows
       that could then be activated under a black screen. */
    const main = document.querySelector<HTMLElement>("main");
    if (main) main.inert = !!ride;
    /* And focus has to land somewhere on arrival rather than on <body>. The
       attribute stays: taking it off in the same tick hands focus straight
       back to the body, and -1 keeps it out of the tab order anyway. */
    if (main) main.setAttribute("tabindex", "-1");
    if (!ride && main) main.focus({ preventScroll: true });
    return () => { delete el.dataset.ride; if (main) main.inert = false; };
  }, [ride]);

  if (!ride) return null;
  return <div className="ride" data-dir={ride.dir} data-phase={ride.phase} aria-hidden="true" />;
}
