import { ImageResponse } from "next/og";

export function OgImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff", color: "#000000", padding: 54 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 600 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: "#000000" }}>
          {[1, 2, 3, 4, 5].map((bar) => (
            <div key={bar} style={{ width: 3, height: 24, borderRadius: 1, background: "#ffffff", opacity: 1.1 - bar * 0.13 }} />
          ))}
        </div>
        PicSnips
      </div>
      <div style={{ display: "flex", height: 154, gap: 5, padding: 10, background: "#f8f8f8", borderRadius: 16 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} style={{ flex: 1, borderRadius: 5, background: `hsl(0, 0%, ${13 + Math.round(Math.sin(i / 19 * Math.PI) * 52)}%)` }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 67, letterSpacing: "-0.035em", lineHeight: 1.08 }}>Your creative toolkit.</div>
        <div style={{ fontSize: 27, color: "#333333" }}>Image grids, video frames, and voice cleanup right in your browser.</div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
