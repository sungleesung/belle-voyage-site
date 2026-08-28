/* The ride between the map and a page.

   The About branch is an excursion — the camera pans west, the panel arrives,
   the camera comes back, and the page never changes. Properties is a real
   destination, and a destination used to mean location.href: a full reload
   that threw away the camera, Lenis and every bit of state. Nothing survives
   a page load, so nothing could carry across it.

   The trip is client-side now, and one element outside both pages owns the
   screen while the route swaps. The sequence lives HERE rather than in that
   element's effects: a route change is a React transition, and effects
   scheduled around one are not a reliable clock — an earlier version reached
   the clear phase, rendered it, and never ran the effect that would have ended
   it, leaving the field covering the screen for good. Plain timers cannot be
   deferred by a render. */
import { setView } from "./overlay";

export type Dir = "out" | "back";
export type Phase = "cover" | "clear";
export type Ride = { dir: Dir; href: string; phase: Phase } | null;

/* Half a beat to take the screen, most of a beat to give it back: covering
   wants to be decisive, arriving wants to decelerate into the stop. */
export const COVER = 500;
export const CLEAR = 700;
/* A settle after the route has committed, so the destination has painted
   before the field lifts off it. */
export const HOLD = 140;
/* If the route never commits at all, leave anyway rather than sit on a black
   screen. Long, because the alternative to waiting is showing the wrong page. */
const GIVE_UP = 6000;

let ride: Ride = null;
/* Once the push has gone out there is nothing to cancel — the browser is
   already moving. Escape before this point still works. */
let navigated = false;
let timers: ReturnType<typeof setTimeout>[] = [];
let navigate: ((href: string) => void) | null = null;
const subs = new Set<(r: Ride) => void>();

const reduced = () =>
  typeof window !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

const emit = () => subs.forEach((f) => f(ride));
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

export const getRide = () => ride;

/* Registered by the field, which is the only thing holding a router. */
export function setNavigator(fn: (href: string) => void) { navigate = fn; }

const finish = () => {
  timers.push(setTimeout(() => {
    ride = null; navigated = false; clearTimers(); emit();
  }, CLEAR));
};

export function startRide(dir: Dir, href: string) {
  if (ride) return;
  /* Whatever was open belongs to the page being left. The menu and the popup
     are module state, and before this trip was client-side a document load
     wiped them: leaving a dialog open and pressing Back brought the landing up
     with the menu's chrome applied, main inert, and nothing on the page
     clickable. */
  setView(null);
  if (reduced()) { navigate?.(href); return; }
  ride = { dir, href, phase: "cover" };
  emit();
  timers.push(setTimeout(() => {
    if (!ride) return;
    navigated = true;
    navigate?.(href);
    /* Wait for the route to actually commit. A fixed delay was a guess about
       the network: on a slow connection the field lifted off the page you had
       just left — camera parked off the drawing, chrome inert, nothing
       clickable — and the destination arrived seconds later as a hard cut.
       Polling the location is plain timers, same as the rest of this. */
    const t0 = Date.now();
    const settled = () => {
      if (!ride) return;
      if (location.pathname === href || Date.now() - t0 > GIVE_UP) {
        timers.push(setTimeout(() => {
          if (!ride) return;
          ride = { ...ride, phase: "clear" };
          emit();
          finish();
        }, HOLD));
        return;
      }
      timers.push(setTimeout(settled, 30));
    };
    settled();
  }, COVER));
}

/* Back is an arrival with no departure — the browser has already moved — so
   the field is only ever seen leaving, which is what arriving looks like. */
export function arriveOnly(href: string) {
  if (ride) return;
  setView(null);
  if (reduced()) return;
  /* Direction is where you are going, not a constant. Hard-coding "back" made
     the Forward button play the reverse of the leg it belongs to. */
  ride = { dir: href === "/" ? "back" : "out", href, phase: "clear" };
  emit();
  finish();
}

/* Escape, before the route has actually changed. After that the trip is
   committed — you cannot get off a train between stations. */
export function cancelRide() {
  if (!ride || ride.phase !== "cover" || navigated) return;
  clearTimers();
  ride = null;
  emit();
}

export function onRide(f: (r: Ride) => void) {
  subs.add(f);
  return () => { subs.delete(f); };
}
