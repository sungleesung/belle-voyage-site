/* The spacing law, on the source rather than the render.
   VOCAB governs every number an author types — a fixed value, or either
   endpoint of a clamp. What the browser computes between two typed endpoints
   is a consequence, not a decision, and is not governed.
   AXIS: vertical steps track dvh, horizontal steps track vw.
   SCOPE: .doc* takes fixed steps only, no spacing clamps. */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const VOCAB = new Set([0, 1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80, 92, 110]);
const PROPS = /^(gap|row-gap|column-gap|margin|padding|inset|top|right|bottom|left)(-(top|right|bottom|left|block|inline))?$/;
const DIR = join(process.cwd(), "styles");
const bad = [];

for (const f of readdirSync(DIR).filter((n) => n.endsWith(".css"))) {
  const src = readFileSync(join(DIR, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, sel, body] of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const doc = /\.doc/.test(sel);
    for (const decl of body.split(";")) {
      const [rawProp, ...rest] = decl.split(":");
      const prop = rawProp.trim();
      const val = rest.join(":").trim();
      if (!PROPS.test(prop) || !val) continue;
      if (/var\(|calc\(|auto|inherit|%/.test(val) && !val.includes("clamp(")) continue;
      if (doc && val.includes("clamp(")) {
        bad.push(`${f}  ${sel.trim().slice(0, 40)}  ${prop}: ${val}  — .doc* takes fixed steps`);
        continue;
      }
      /* Clamp endpoints are typed; the middle term is the fluid coefficient. */
      const typed = [...val.matchAll(/clamp\(\s*([\d.]+)px\s*,[^,]+,\s*([\d.]+)px\s*\)/g)]
        .flatMap((m) => [m[1], m[2]]);
      const plain = val.includes("clamp(") ? typed
        : [...val.matchAll(/(?<![\w.])(\d+(?:\.\d+)?)px/g)].map((m) => m[1]);
      for (const n of plain) {
        /* Off-screen idioms (the honeypot at -9999px) are not spacing. */
        if (Number(n) >= 200) continue;
        if (!VOCAB.has(Number(n))) {
          bad.push(`${f}  ${sel.trim().slice(0, 40)}  ${prop}: ${val}  — ${n}px off vocabulary`);
        }
      }
    }
  }
}
if (bad.length) {
  console.error(`spacing law: ${bad.length} typed value(s) off the vocabulary\n` + bad.join("\n"));
  process.exit(1);
}
console.log("spacing law: clean");
