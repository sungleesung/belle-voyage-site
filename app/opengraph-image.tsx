import { ImageResponse } from "next/og";

export const alt = "Belle Voyage Estates — sales, letting and management across Canada, the United States and Europe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Drawn, not photographed. The site has no photography and inventing some for
   a share card would be the one thing this project keeps deciding not to do —
   so the card is the drawing: the red trunk, the two branches, and the three
   station shapes, in the same colours the map uses. */
export default function OG() {
  const CA = "#C54E43", US = "#028837", EU = "#4172D1";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#000",
        position: "relative", fontFamily: "sans-serif" }}>
        {/* The drawing keeps to the right so the wordmark gets the clear space
            the brand book asks for. A CSS border-triangle renders as a filled
            box in Satori, so the shapes are real SVG. */}
        <div style={{ position: "absolute", left: 596, top: -120, width: 34, height: 820,
          background: CA, transform: "rotate(-40deg)", transformOrigin: "top left",
          borderRadius: 17 }} />
        {/* the green branch runs north out of the ring, the blue west out of
            the square — both terminate ON the trunk, not near it */}
        <div style={{ position: "absolute", left: 803, top: 0, width: 34, height: 120,
          background: US, borderRadius: 17 }} />
        <div style={{ position: "absolute", left: 540, top: 204, width: 364, height: 34,
          background: EU, borderRadius: 17 }} />
        <svg width="1200" height="630" viewBox="0 0 1200 630"
          style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx="820" cy="120" r="37" fill="none" stroke="#fff" strokeWidth="12" />
          <rect x="867" y="184" width="74" height="74" fill="none"
            stroke="#fff" strokeWidth="12" />
          <polygon points="989,277 1039,363 939,363"
            fill="none" stroke="#fff" strokeWidth="12" strokeLinejoin="round" />
        </svg>
        <div style={{ position: "absolute", left: 72, bottom: 72, display: "flex",
          flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#fff", letterSpacing: -2 }}>
            Belle Voyage Estates
          </div>
          <div style={{ fontSize: 29, color: "rgba(255,255,255,.72)", marginTop: 12 }}>
            Sales, letting and management
          </div>
          <div style={{ fontSize: 29, color: "rgba(255,255,255,.72)", marginTop: 4 }}>
            Canada · United States · Europe
          </div>
        </div>
      </div>
    ),
    size,
  );
}
