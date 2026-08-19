"use client";
import { forwardRef } from "react";
import { MARKETS, NET, route, pathOf, type Market } from "@/lib/net";
import { Glyph } from "./Glyph";

/* The network diagram. Rendered independently by the hero, the draw section and
   the wash, so each can be animated on its own timeline. */
export const Diagram = forwardRef<SVGSVGElement, { id?: string; labels?: boolean }>(
  function Diagram({ id = "map", labels = true }, ref) {
    return (
      <svg ref={ref} id={id} className="dgm" viewBox="0 0 1280 700"
        preserveAspectRatio="xMidYMid meet" role="img"
        aria-label="Belle Voyage Estates network — Canada, the United States and Europe">
        <g className="dgm-water">
          {/* The Atlantic. One strip between the continents. */}
          <rect x="0" y="452" width="1280" height="74" fill="var(--water)" />
          {/* The Detroit River — Windsor and Detroit are one metro split by it. */}
          <rect x="952" y="219" width="116" height="23" rx="10" fill="var(--water)" />
        </g>

        <g className="dgm-lines">
          {(Object.keys(NET) as Market[]).map((k) => (
            <path key={k} className="dgm-trunk" data-trunk={k}
              d={pathOf(route(NET[k]))} fill="none" stroke={MARKETS[k].colour}
              strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {/* Dashed = an out-of-system transfer: you cross on foot, with a document. */}
          <path className="dgm-xing" d="M700 330 L700 580" fill="none" stroke="var(--ink)"
            strokeWidth="5" strokeDasharray="13 11" opacity=".55" />
          <path className="dgm-xing" d="M1010 190 L1010 270" fill="none" stroke="var(--ink)"
            strokeWidth="5" strokeDasharray="13 11" opacity=".55" />
          {[{ x: 700, y: 489, n: "Atlantic" }, { x: 1010, y: 230, n: "Border" }].map((c) => (
            <g key={c.n} className="dgm-cross" transform={`translate(${c.x} ${c.y})`}>
              <circle r="13" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
              <path transform="scale(1.05)" fill="var(--ink)"
                d="M1.2-6.4a2.3 2.3 0 1 0 0-.1zM0-3.6-3 -.8v4.2h1.9V-.4l1.6-1.3 2 3.3v5.1h1.9V1.1L1.3-2.3l.6-2.5 2 1.2.7 2 1.7-.6-.8-2.4-3.5-2.2z" />
              {labels && <text className="dgm-xlab" x="21" y="4" textAnchor="start">{c.n}</text>}
            </g>
          ))}
          {/* Colour is never the only channel: every trunk carries its code at both
              ends, so the diagram survives greyscale and colour blindness. */}
          {(Object.keys(NET) as Market[]).map((k) => {
            const st = NET[k];
            return [st[0]].map((e, i) => (
              <g key={`${k}-${i}`} className="dgm-code" role="img" aria-label={`${MARKETS[k].name} line`}
                transform={`translate(${e.x - 46} ${e.y})`}>
                <circle r="15" fill={MARKETS[k].colour} />
                <text y="5.4" textAnchor="middle" fontSize="16" fontWeight="700"
                  fontFamily="Helvetica Neue,Helvetica,Arial" letterSpacing="-.8" fill="#fff">{k}</text>
              </g>
            ));
          })}
        </g>

        <g className="dgm-stations">
          {(Object.keys(NET) as Market[]).flatMap((k) =>
            NET[k].map((s) => {
              const side = s.label === "right";
              const ty = side ? -4 : s.label === "above" ? -42 : 36;
              const tx = side ? 26 : 0;
              const anc = side ? "start" : "middle";
              return (
                <g key={`${k}-${s.name}`} className="dgm-stn" data-market={k} data-svc={s.svc}
                  transform={`translate(${s.x} ${s.y})`}>
                  <g className="dgm-glyph">
                    <g transform="translate(-12 -12)"><Glyph type={s.type} size={24} /></g>
                  </g>
                  {labels && <>
                    <text className="dgm-lab" x={tx} y={ty} textAnchor={anc}>{s.name}</text>
                    <text className="dgm-sub" x={tx} y={ty + 16} textAnchor={anc}>from {s.from}</text>
                  </>}
                </g>
              );
            })
          )}
        </g>
      </svg>
    );
  }
);
