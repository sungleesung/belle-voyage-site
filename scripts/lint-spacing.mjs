/* The spacing law, checked on the source rather than the render.

   VOCAB governs every number an author TYPES in a spacing declaration — a
   fixed value, either endpoint of a clamp, a term inside a calc. What the
   browser computes BETWEEN two typed endpoints is a consequence, not a
   decision, and is not governed.
   SCOPE: .doc* is a document grid, not a viewport fit — fixed steps only.

   An earlier version skipped any declaration containing var(), calc() or a
   percentage, and let a clamp anywhere in the value discard every other number
   beside it. That let eight live violations through, and a value was moved
   into a calc() in the same commit that added the gate. So: no declaration is
   skipped, and every px token in the value is checked. */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const VOCAB = new Set([0, 1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80, 92, 110]);
const PROPS = /^(gap|row-gap|column-gap|margin|padding|inset|top|right|bottom|left|(scroll-)?(margin|padding)-(top|right|bottom|left|block|inline)(-(start|end))?|scroll-(margin|padding)|inset-(block|inline)(-(start|end))?)$/;
/* The honeypot lives at -9999px. Nothing that far off screen is spacing. */
const OFFSCREEN = 1000;
const DIR = join(process.cwd(), "styles");
const bad = [];

for (const f of readdirSync(DIR).filter((n) => n.endsWith(".css"))) {
  const src = readFileSync(join(DIR, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const lines = src.split("\n");
  const lineOf = (i) => src.slice(0, i).split("\n").length;
  for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim();
    /* .doc as a class token, not as a substring of .doc-something-else's parent */
    const doc = /(^|[\s,>+~])\.doc\b/.test(sel);
    for (const decl of m[2].split(";")) {
      const at = decl.indexOf(":");
      if (at < 0) continue;
      const prop = decl.slice(0, at).trim();
      const val = decl.slice(at + 1).trim();
      if (!PROPS.test(prop) || !val) continue;
      const where = `${f}:${lineOf(m.index + m[0].indexOf(decl))}`;
      if (doc && val.includes("clamp(")) {
        bad.push(`${where}  ${sel.slice(0, 44)}  ${prop}: ${val}\n    .doc* takes fixed steps, not clamps`);
        continue;
      }
      for (const n of val.matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
        const v = Math.abs(Number(n[1]));
        if (v >= OFFSCREEN) continue;
        if (!VOCAB.has(v)) {
          bad.push(`${where}  ${sel.slice(0, 44)}  ${prop}: ${val}\n    ${n[1]}px is not in the vocabulary`);
        }
      }
    }
  }
}
if (bad.length) {
  console.error(`spacing law: ${bad.length} typed value(s) off the vocabulary\n\n${bad.join("\n")}`);
  process.exit(1);
}
console.log("spacing law: clean");
