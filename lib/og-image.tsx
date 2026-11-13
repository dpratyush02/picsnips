import { ImageResponse } from "next/og";

export function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          color: "white",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          {Array.from({ length: 20 }, (_, index) => (
            <div
              key={index}
              style={{
                width: "18px",
                height: "72px",
                borderRadius: "4px",
                background: `rgba(255,255,255,${0.25 + (index % 5) * 0.12})`,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, letterSpacing: "0.08em", color: "#a1a1aa" }}>
            TWENTYSPLIT
          </div>
          <div style={{ fontSize: 68, fontWeight: 650, letterSpacing: "-0.04em", marginTop: 16, lineHeight: 1.05 }}>
            One image. Twenty pieces.
          </div>
          <div style={{ fontSize: 28, color: "#d4d4d8", marginTop: 20 }}>
            Free 20-image splitter for X
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
