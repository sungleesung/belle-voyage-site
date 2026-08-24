/* MapLibre v6 ships its tile-parsing worker as a separate module file and
   resolves it against import.meta.url. Next does not emit that file, so the
   worker request fell through to the app router and came back as HTML — the
   worker never started, no tile was ever requested, and the map rendered its
   background colour and nothing else, silently.

   Copying the two files it needs into public/ and pointing setWorkerUrl at
   them fixes it. Run from prebuild so they cannot drift from the installed
   version. */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const from = join(here, "..", "node_modules", "maplibre-gl", "dist");
const to = join(here, "..", "public", "maplibre");
mkdirSync(to, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(from, f), join(to, f));
}
console.log("maplibre worker copied to public/maplibre");
