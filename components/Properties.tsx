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
import { MARKETS, PROPERTIES, shapeOf, summary, type Market, type Property } from "@/lib/properties";

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

export function Properties({ initial }: { initial: Market | "all" }) {
  const [market, setMarket] = useState<Market | "all">(initial);
  const [sel, setSel] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<InstanceType<typeof MLMap> | null>(null);
  const pins = useRef(new globalThis.Map<string, InstanceType<typeof Marker>>());

  const shown = useMemo(
    () => (market === "all" ? PROPERTIES : PROPERTIES.filter((p) => p.market === market)),
    [market],
  );

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
      el.addEventListener("click", () => setSel(p.id));
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
    if (!sel) return;
    document.getElementById(`row-${sel}`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  return (
    <div className="pr">
      <header className="pr-head">
        {/* The masthead belongs to the landing, where it inverts against a
            moving drawing. Here the mark is simply the way back. */}
        <a className="pr-home" href="/">
          Belle&nbsp;V<i className="ring" aria-hidden="true">
            <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38.3" fill="none"
              stroke="currentColor" strokeWidth="23.4" /></svg></i>yage&nbsp;Estates
        </a>
        <h1>Properties</h1>
        <p className="pr-note" role="note">
          Placeholder listings — this page is a template. None of the properties
          below are real or available.
        </p>
        <div className="pr-filter" role="group" aria-label="Filter by market">
          <button type="button" data-on={market === "all"} onClick={() => setMarket("all")}>
            All<span>{PROPERTIES.length}</span>
          </button>
          {MARKETS.map((mk) => (
            <button key={mk.code} type="button" data-on={market === mk.code}
              style={{ ["--c" as string]: mk.colour }} onClick={() => setMarket(mk.code)}>
              {mk.name}<span>{PROPERTIES.filter((p) => p.market === mk.code).length}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="pr-body">
        <ol className="pr-list">
          {shown.map((p: Property) => (
            <li key={p.id} id={`row-${p.id}`} data-on={sel === p.id}
              style={{ ["--c" as string]: MARKETS.find((x) => x.code === p.market)!.colour }}
              onMouseEnter={() => setSel(p.id)} onFocus={() => setSel(p.id)}>
              {/* Selects rather than navigates. Detail pages arrive with real
                  inventory; until then a link here would be twelve 404s. */}
              <button type="button" onClick={() => setSel(p.id)}>
                <span className="pr-stop" data-kind={shapeOf(p.kind)} aria-hidden="true" />
                <span className="pr-name">{p.name}</span>
                <span className="pr-city">{p.city}</span>
                <span className="pr-spec">{summary(p)}</span>
                <span className="pr-price">{p.price}</span>
                <Arrow dir="right" size={19} />
              </button>
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
