"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Map as MLMap, Marker, LngLatBounds, setWorkerUrl } from "maplibre-gl";
/* Their stylesheet, not just ours. It is what makes the map a positioned
   containing block — without it every marker resolved against the page instead
   and sat a full map-height below where it belonged — and it is what places the
   attribution control, which the OSM data licence requires. Colours are
   overridden in site.css. */
import "maplibre-gl/dist/maplibre-gl.css";
import { Arrow } from "./Arrow";
import { setView, openAbout } from "@/lib/overlay";
import { startRide } from "@/lib/ride";
import { MARKETS, PROPERTIES, monthly, priceOf, shapeOf, summary,
  type Kind, type Market, type Property } from "@/lib/properties";

/* Land, water and borders. Nothing else — no basemap labels, no roads, no
   landuse. A photographic basemap would swallow the stations and undo the
   whole register; what is wanted is a diagram that happens to be accurate.
   Colours are read from the tokens so the map follows the theme. */
function style() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    version: 8 as const,
    sources: { omt: { type: "vector" as const, url: "https://tiles.openfreemap.org/planet" } },
    layers: [
      { id: "ground", type: "background" as const,
        paint: { "background-color": v("--panel", "#F5F7F8") } },
      { id: "water", type: "fill" as const, source: "omt", "source-layer": "water",
        paint: { "fill-color": v("--water", "#E7EFF4") } },
      { id: "border", type: "line" as const, source: "omt", "source-layer": "boundary",
        filter: ["<=", ["get", "admin_level"], 2] as unknown as never,
        paint: { "line-color": v("--rule", "#C9D3DA"), "line-width": 1 } },
    ],
  };
}

function glyph(kind: string, colour: string) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "pr-pin";
  el.style.setProperty("--c", colour);
  el.tabIndex = -1;                 // the list carries the same twelve, reachably
  el.setAttribute("aria-hidden", "true");
  el.innerHTML =
    kind === "ring"
      ? `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/></svg>`
      : kind === "diamond"
        ? `<svg viewBox="0 0 24 24"><rect x="5.4" y="5.4" width="13.2" height="13.2" transform="rotate(45 12 12)"/></svg>`
        : `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/></svg>`;
  if (kind === "disc") el.dataset.solid = "1";
  return el;
}

/* Airbnb's shape, minus the parts that mean nothing for property: type of
   place, a price range over a histogram, and rooms as steppers. Their amenity
   and host-language sections do not transfer — a letting agency's equivalent
   of "has a hair dryer" is the floor area, which is already on the row. */
const LETTING: { key: Kind | "any"; label: string }[] = [
  { key: "any", label: "Any" },
  { key: "standard", label: "Long let" },
  { key: "short", label: "Short stay" },
  { key: "flagship", label: "Flagship" },
];
const STEPS = ["Any", "1+", "2+", "3+", "4+", "5+"];

export function Properties({ initial }: { initial: Market | "all" }) {
  const [market, setMarket] = useState<Market | "all">(initial);
  const [kind, setKind] = useState<Kind | "any">("any");
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);
  const [lo, setLo] = useState<number | null>(null);
  const [hi, setHi] = useState<number | null>(null);
  const [panel, setPanel] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const from = useRef<"map" | "list">("list");
  const [ready, setReady] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<InstanceType<typeof MLMap> | null>(null);
  const pins = useRef(new globalThis.Map<string, InstanceType<typeof Marker>>());

  /* The slider's domain is every property, not the filtered set, so the handles
     do not move under you as you filter. */
  const [floor, ceil] = useMemo(() => {
    const v = PROPERTIES.map(monthly);
    return [Math.floor(Math.min(...v) / 100) * 100, Math.ceil(Math.max(...v) / 100) * 100];
  }, []);
  const min = lo ?? floor, max = hi ?? ceil;

  const others = useMemo(() => PROPERTIES.filter((p) =>
    (kind === "any" || p.kind === kind) &&
    (beds === 0 || (p.beds ?? 0) >= beds) &&
    (baths === 0 || p.baths >= baths) &&
    monthly(p) >= min && monthly(p) <= max,
  ), [kind, beds, baths, min, max]);
  const shown = useMemo(
    () => others.filter((p) => market === "all" || p.market === market),
    [others, market]);

  /* The distribution behind the handles, as Airbnb draws it. */
  const bars = useMemo(() => {
    const n = 22, out = new Array(n).fill(0);
    PROPERTIES.forEach((p) => {
      const i = Math.min(n - 1, Math.floor(((monthly(p) - floor) / (ceil - floor)) * n));
      out[i] += 1;
    });
    const peak = Math.max(1, ...out);
    return out.map((c, i) => ({ h: c / peak, on: floor + ((i + 0.5) / n) * (ceil - floor) }));
  }, [floor, ceil]);

  /* The price counts as a filter when it actually narrows anything, not when
     it has merely been touched. Dragging a handle out and back left the badge
     claiming one filter was on while the range excluded nothing. */
  const active = (kind !== "any" ? 1 : 0) + (beds ? 1 : 0) + (baths ? 1 : 0) +
    (min > floor || max < ceil ? 1 : 0);
  const clear = () => { setKind("any"); setBeds(0); setBaths(0); setLo(null); setHi(null); };

  useEffect(() => {
    const el = dlg.current; if (!el) return;
    if (panel && !el.open) el.showModal();
    if (!panel && el.open) el.close();
  }, [panel]);

  useEffect(() => {
    if (!host.current || map.current) return;
    /* Served from public/, because the bundler does not emit the worker module
       and the request fell through to the router as HTML. See
       scripts/copy-maplibre.mjs. */
    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    const m = new MLMap({
      container: host.current,
      style: style(),
      center: [-30, 45],
      zoom: 1.6,
      attributionControl: { compact: true },
      /* The diagram reads flat. Rotation would only ever confuse it. */
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: true,
    });
    m.touchZoomRotate?.disableRotation();
    map.current = m;
    /* Sized from the container before the grid has settled, the transform is
       wrong: it never asks for a tile and it projects markers off the bottom of
       the canvas. Resize on load, and keep resizing with the box. */
    m.on("load", () => { m.resize(); setReady(true); });
    m.on("error", (e) => console.error("[map]", e?.error?.message ?? e));
    const ro = new ResizeObserver(() => m.resize());
    ro.observe(host.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; };
  }, []);

  /* Markers follow the filter, and the frame follows the markers. */
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    pins.current.forEach((pin) => pin.remove());
    pins.current.clear();
    shown.forEach((p) => {
      const colour = MARKETS.find((x) => x.code === p.market)!.colour;
      const el = glyph(shapeOf(p.kind), colour);
      el.setAttribute("aria-label", `${p.name}, ${p.city}`);
      el.addEventListener("click", () => { from.current = "map"; setSel(p.id); });
      pins.current.set(p.id, new Marker({ element: el }).setLngLat(p.at).addTo(m));
    });
    if (!shown.length) return;
    const b = new LngLatBounds(shown[0].at, shown[0].at);
    shown.forEach((p) => b.extend(p.at));
    m.fitBounds(b, { padding: 72, maxZoom: 9, duration: 700 });
  }, [shown, ready]);

  /* Selection is one class, so hovering the list and clicking a pin light the
     same thing. */
  useEffect(() => {
    pins.current.forEach((pin, id) =>
      pin.getElement().classList.toggle("on", id === sel));
    /* Only when the selection came from the map. Hovering also sets sel, and
       scrolling the hovered row into view moved the list out from under the
       pointer: with a row open at scrollTop 120, hovering its neighbour jumped
       to 225 and hovering back jumped to 133. */
    if (!sel || from.current !== "map") return;
    document.getElementById(`row-${sel}`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  return (
    <div className="pr">
      <header className="pr-head">
        {/* The masthead belongs to the landing, where it inverts against a
            moving drawing. Here the mark is simply the way back. */}
        {/* Still an anchor: a middle-click, a new tab and a copied link all
            have to keep working. The ride only claims a plain left click. */}
        <a className="pr-home" href="/"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            startRide("back", "/");
          }}>
          Belle&nbsp;V<i className="ring" aria-hidden="true">
            <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38.3" fill="none"
              stroke="currentColor" strokeWidth="23.4" /></svg></i>yage&nbsp;Estates
        </a>
        <h1>Properties</h1>
        <p className="pr-note" role="note">
          Placeholder listings — this page is a template. None of the properties
          below are real or available.
        </p>
        <ul className="pr-key">
          {([["disc", "Long let"], ["ring", "Flagship"], ["diamond", "Short stay"]] as const)
            .map(([k, label]) => (
              <li key={k}><span className="pr-stop" data-kind={k} aria-hidden="true" />{label}</li>
            ))}
        </ul>
        <div className="pr-filter" role="group" aria-label="Filter by market">
          <button type="button" data-on={market === "all"} onClick={() => setMarket("all")}>
            All<span>{others.length}</span>
          </button>
          {MARKETS.map((mk) => (
            <button key={mk.code} type="button" data-on={market === mk.code}
              style={{ ["--c" as string]: mk.colour }} onClick={() => setMarket(mk.code)}>
              {mk.name}<span>{others.filter((p) => p.market === mk.code).length}</span>
            </button>
          ))}
          <button type="button" className="pr-more" onClick={() => setPanel(true)}
            aria-haspopup="dialog">
            Filters{active > 0 && <span className="pr-badge">{active}</span>}
          </button>
        </div>
      </header>

      <dialog ref={dlg} className="fl" aria-labelledby="fl-title"
        onClose={() => setPanel(false)}
        onClick={(e) => { if (e.target === dlg.current) setPanel(false); }}>
        <div className="fl-panel">
          <header className="fl-head">
            <h2 id="fl-title">Filters</h2>
            <button type="button" className="fl-x" onClick={() => setPanel(false)}>
              <span className="sr">Close</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19" /></svg>
            </button>
          </header>

          <section className="fl-sec">
            <h3>Type of letting</h3>
            <div className="fl-seg" role="group" aria-label="Type of letting">
              {LETTING.map((l) => (
                <button key={l.key} type="button" data-on={kind === l.key}
                  onClick={() => setKind(l.key)}>{l.label}</button>
              ))}
            </div>
          </section>

          <section className="fl-sec">
            <h3>Price range</h3>
            <p className="fl-hint">
              Monthly, in each property&rsquo;s own currency. A nightly rate is
              counted as thirty nights.
            </p>
            <div className="fl-hist" aria-hidden="true">
              {bars.map((b, i) => (
                <i key={i} style={{ height: `${Math.max(6, b.h * 100)}%` }}
                  data-on={b.on >= min && b.on <= max} />
              ))}
            </div>
            {/* Click anywhere on the track moves the nearer handle. A native
                range ships this; making the inputs pointer-events:none so the
                two can overlap took it away, leaving dragging a 26px thumb as
                the only pointer path (WCAG 2.5.7). */}
            <div className="fl-range"
              onPointerDown={(e) => {
                /* Primary button only — a right-click was silently applying a
                   filter. And a native range centres its thumb inside the
                   track, so the mapping has to inset by half a thumb or
                   pressing a handle without moving it nudges the value. */
                if (e.button !== 0) return;
                const box = e.currentTarget.getBoundingClientRect();
                const half = 13;
                const f = Math.min(1, Math.max(0,
                  (e.clientX - box.left - half) / Math.max(1, box.width - half * 2)));
                const v = Math.round((floor + f * (ceil - floor)) / 100) * 100;
                if (Math.abs(v - min) <= Math.abs(v - max)) setLo(Math.min(v, max - 100));
                else setHi(Math.max(v, min + 100));
              }}>
              <input type="range" min={floor} max={ceil} step={100} value={min}
                aria-label="Minimum price"
                onChange={(e) => setLo(Math.min(+e.target.value, max - 100))} />
              <input type="range" min={floor} max={ceil} step={100} value={max}
                aria-label="Maximum price"
                onChange={(e) => setHi(Math.max(+e.target.value, min + 100))} />
            </div>
            <div className="fl-ends">
              <span>{min.toLocaleString("en")}</span>
              <span>{max.toLocaleString("en")}{max === ceil ? "+" : ""}</span>
            </div>
          </section>

          <section className="fl-sec">
            <h3>Rooms</h3>
            {([["Bedrooms", beds, setBeds], ["Bathrooms", baths, setBaths]] as const).map(
              ([label, val, set]) => (
                <div className="fl-step" key={label}>
                  <span>{label}</span>
                  {/* aria-disabled, not disabled: disabling the button under
                      the user's own focus dropped it to <body>, outside the
                      open dialog, and the next Tab restarted from the top. */}
                  <button type="button" onClick={() => set(Math.max(0, val - 1))}
                    aria-disabled={val === 0} aria-label={`Fewer ${label.toLowerCase()}`}>&minus;</button>
                  <b>{STEPS[val]}</b>
                  <button type="button" onClick={() => set(Math.min(5, val + 1))}
                    aria-disabled={val === 5} aria-label={`More ${label.toLowerCase()}`}>+</button>
                </div>
              ))}
          </section>

          <footer className="fl-foot">
            <button type="button" className="fl-clear" onClick={clear}>Clear all</button>
            <button type="button" className="fl-show" onClick={() => setPanel(false)}>
              Show {shown.length} {shown.length === 1 ? "property" : "properties"}
            </button>
          </footer>
        </div>
      </dialog>

      <div className="pr-body">
        <ol className="pr-list">
          {!shown.length && (
            <li className="pr-none">
              <p>Nothing matches that yet.</p>
              <button type="button" onClick={clear}>Clear the filters</button>
            </li>
          )}
          {shown.map((p: Property) => (
            <li key={p.id} id={`row-${p.id}`} data-on={sel === p.id}
              style={{ ["--c" as string]: MARKETS.find((x) => x.code === p.market)!.colour }}
              onMouseEnter={() => { from.current = "list"; setSel(p.id); }}
              onFocus={() => { from.current = "list"; setSel(p.id); }}>
              {/* Opens in place rather than navigating. A detail page needs
                  real inventory behind it, and a link here would be twelve
                  404s — but the arrow was promising something and delivering a
                  faint tint, at exactly the moment someone is ready to act. */}
              <button type="button" aria-expanded={open === p.id}
                aria-controls={open === p.id ? `d-${p.id}` : undefined}
                onClick={() => { setSel(p.id); setOpen(open === p.id ? null : p.id); }}>
                <span className="pr-stop" data-kind={shapeOf(p.kind)} aria-hidden="true" />
                <span className="pr-name">{p.name}</span>
                <span className="pr-city">{p.city}</span>
                <span className="pr-spec">{summary(p)}</span>
                <span className="pr-price">{priceOf(p)}</span>
                <Arrow dir={open === p.id ? "down" : "right"} size={19} />
              </button>
              {open === p.id && (
                <div className="pr-detail" id={`d-${p.id}`}>
                  {/* The notice travels with what it disclaims. Sticky at the
                      top of the column could not help: a sticky element cannot
                      escape its parent, and on a phone .pr-head scrolls away
                      and takes it along — measured 1,567px above the fold with
                      a row open. Four addresses, four prices and an Enquire
                      button, and nothing on screen saying it is fiction. */}
                  <p className="pr-flag">Not a real listing — this page is a template.</p>
                  {/* Named for what it is. A grey rectangle pretending to be a
                      photograph is worse than an empty frame that says so. */}
                  <div className="pr-shot" aria-hidden="true"><span>Photography to come</span></div>
                  <dl className="pr-facts">
                    <div><dt>Market</dt><dd>{MARKETS.find((x) => x.code === p.market)!.name}</dd></div>
                    <div><dt>Letting</dt>
                      <dd>{LETTING.find((l) => l.key === p.kind)?.label ?? p.kind}</dd></div>
                    <div><dt>Rooms</dt><dd>{summary(p)}</dd></div>
                    <div><dt>Rate</dt><dd>{priceOf(p)}</dd></div>
                  </dl>
                  {/* Carries the property. The button said "Enquire about
                      Vieux-Montréal" and then opened a blank form — the one
                      piece of information the visitor had just given us was
                      thrown away between the click and the email. */}
                  <button type="button" className="pr-ask"
                    onClick={() => openAbout(`${p.name}, ${p.city}`)}>
                    Enquire about {p.name} <Arrow dir="right" size={17} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
        {/* No role: it is not an image, and it holds the attribution links the
            licence requires. The list beside it is the accessible copy. */}
        <div className="pr-map" ref={host} />
      </div>
    </div>
  );
}
