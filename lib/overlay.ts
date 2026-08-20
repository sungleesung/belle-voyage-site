/* The overlay has one occupant at a time — the menu, or the contact popup.
   They share a backdrop, and opening one on top of the other would stack two
   blurs and two scrims.

   Module-level for the same reason lib/lenis.ts is: the components that drive
   it are siblings and neither owns the other. Contact can be reached from the
   stop on the line and from the menu, and both must land in the same place. */
export type View = null | "menu" | "contact";

let view: View = null;
const subs = new Set<(v: View) => void>();

export const getView = () => view;

export function setView(v: View) {
  if (v === view) return;
  view = v;
  subs.forEach((f) => f(v));
}

export function onView(f: (v: View) => void) {
  subs.add(f);
  return () => { subs.delete(f); };
}

/* Contact is a stop, not a page. Used by the stop on the line and by the menu. */
export function openContact(e: { preventDefault(): void }) {
  e.preventDefault();
  setView("contact");
}
