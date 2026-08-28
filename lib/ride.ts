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
export type Dir = "out" | "back";
export type Phase = "cover" | "clear";
export type Ride = { dir: Dir; href: string; phase: Phase } | null;

/* Half a beat to take the screen, most of a beat to give it back: covering
   wants to be decisive, arriving wants to decelerate into the stop. */
export const COVER = 500;
export const CLEAR = 700;
/* The router needs a moment to commit before the field starts to lift, or the
   first frames of the reveal show the page you just left sliding away. The
   destination is prefetched on the way out and already loaded on the way back,
   so this is small. */
export const HOLD = 140;

let ride: Ride = null;
let timers: ReturnType<typeof setTimeout>[] = [];
let navigate: ((href: string) => void) | null = null;
const subs = new Set<(r: Ride) => void>();

const emit = () => subs.forEach((f) => f(ride));
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

export const getRide = () => ride;

/* Registered by the field, which is the only thing holding a router. */
export function setNavigator(fn: (href: string) => void) { navigate = fn; }

export function startRide(dir: Dir, href: string) {
  if (ride) return;
  ride = { dir, href, phase: "cover" };
  emit();
  timers.push(setTimeout(() => { if (ride) navigate?.(href); }, COVER));
  timers.push(setTimeout(() => {
    if (!ride) return;
    ride = { ...ride, phase: "clear" };
    emit();
  }, COVER + HOLD));
  timers.push(setTimeout(
    () => { ride = null; clearTimers(); emit(); }, COVER + HOLD + CLEAR));
}

/* Back is an arrival with no departure — the browser has already moved — so
   the field is only ever seen leaving, which is what arriving looks like. */
export function arriveOnly(dir: Dir, href: string) {
  if (ride) return;
  ride = { dir, href, phase: "clear" };
  emit();
  timers.push(setTimeout(() => { ride = null; clearTimers(); emit(); }, CLEAR));
}

/* Escape, before the route has actually changed. After that the trip is
   committed — you cannot get off a train between stations. */
export function cancelRide() {
  if (!ride || ride.phase !== "cover") return;
  clearTimers();
  ride = null;
  emit();
}

export function onRide(f: (r: Ride) => void) {
  subs.add(f);
  return () => { subs.delete(f); };
}
