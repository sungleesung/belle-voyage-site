export type Market = "CA" | "US" | "EU";

export const MARKETS: Record<Market, { name: string; colour: string; surface: string; ink: string }> = {
  CA: { name: "Canada",        colour: "var(--ca)", surface: "var(--ca-surface)", ink: "var(--ca-ink)" },
  US: { name: "United States", colour: "var(--us)", surface: "var(--us-surface)", ink: "var(--us-ink)" },
  EU: { name: "Europe",        colour: "var(--eu)", surface: "var(--eu-surface)", ink: "var(--eu-ink)" },
};

export const SERVICES = [
  { key: "S", name: "Sales",      blurb: "Buying and selling, in four currencies and three legal systems.", shape: "disc" },
  { key: "R", name: "Rental",     blurb: "Long lets. Twelve months and over, managed end to end.",           shape: "disc" },
  { key: "M", name: "Management", blurb: "For owners. Tenanting, compliance, maintenance, accounts.",        shape: "disc" },
  { key: "V", name: "Voyage",     blurb: "Short stay and seasonal — the line that does not run all year.",   shape: "diamond" },
] as const;

export type Station = {
  x: number; y: number; name: string; type: StationType;
  flag: boolean; svc: string; from: string; count: number;
  label: "above" | "below" | "right";
};
export type StationType = "apartment" | "house" | "building" | "short" | "student";

/* Grid coords on a 1280x700 field. Every value is a multiple of 10 so the
   octilinear router always lands on the grid. */
export const NET: Record<Market, Station[]> = {
  CA: [
    { x:120, y:130, name:"Vancouver", type:"apartment", flag:false, svc:"RM",   from:"$2,140", count:9,  label:"below" },
    { x:360, y:130, name:"Calgary",   type:"house",     flag:false, svc:"SM",   from:"$1,780", count:6,  label:"below" },
    { x:620, y:130, name:"Montréal",  type:"apartment", flag:false, svc:"RV",   from:"$1,690", count:11, label:"below" },
    { x:800, y:190, name:"Toronto",   type:"building",  flag:true,  svc:"SRMV", from:"$2,460", count:18, label:"below" },
    { x:1010,y:190, name:"Windsor",   type:"house",     flag:false, svc:"SR",   from:"$1,240", count:7,  label:"above" },
  ],
  US: [
    { x:120, y:390, name:"Los Angeles", type:"building",  flag:true,  svc:"SRMV", from:"$3,310", count:21, label:"below" },
    { x:400, y:390, name:"Chicago",     type:"apartment", flag:false, svc:"RM",   from:"$2,020", count:12, label:"below" },
    { x:700, y:330, name:"New York",    type:"building",  flag:true,  svc:"SRMV", from:"$4,180", count:26, label:"above" },
    { x:880, y:330, name:"Miami",       type:"short",     flag:false, svc:"V",    from:"$2,760", count:8,  label:"above" },
    { x:1010,y:270, name:"Detroit",     type:"house",     flag:false, svc:"SRM",  from:"$1,180", count:14, label:"right" },
  ],
  EU: [
    { x:180, y:640, name:"Lisbon",    type:"short",     flag:false, svc:"V",    from:"€1,410", count:5,  label:"below" },
    { x:420, y:640, name:"Paris",     type:"apartment", flag:false, svc:"RV",   from:"€2,880", count:13, label:"below" },
    { x:700, y:580, name:"London",    type:"building",  flag:true,  svc:"SRMV", from:"£3,240", count:24, label:"below" },
    { x:940, y:580, name:"Amsterdam", type:"apartment", flag:false, svc:"RM",   from:"€2,310", count:10, label:"above" },
    { x:1140,y:640, name:"Berlin",    type:"student",   flag:false, svc:"RM",   from:"€1,120", count:6,  label:"below" },
  ],
};

export const TOTAL = Object.values(NET).flat().reduce((t, s) => t + s.count, 0);

/* One axial run plus one 45° diagonal; the diagonal always takes the shorter leg.
   The constraint every transit diagram since Beck has obeyed. */
export function elbow(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (ax === 0 || ay === 0) return null;
  const sx = Math.sign(dx), sy = Math.sign(dy);
  return ax > ay ? { x: a.x + sx * (ax - ay), y: a.y } : { x: a.x, y: a.y + sy * (ay - ax) };
}
export function route(pts: { x: number; y: number }[]) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const e = elbow(pts[i - 1], pts[i]);
    if (e) out.push(e);
    out.push(pts[i]);
  }
  return out;
}
export const pathOf = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
