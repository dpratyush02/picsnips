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
          background: "linear-gradient(135deg, #09090b 0%, #111116 50%, #1a100a 100%)",
          color: "white",
          padding: "56px 64px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "26px",
                color: "#000",
              }}
            >
              ✂
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em" }}>
              PicSnips
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              fontSize: "18px",
              color: "#fb923c",
              fontWeight: 600,
            }}
          >
            Built for X&apos;s 20-Image Posts
          </div>
        </div>

        {/* 20-Slice Visual Ribbon */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "130px",
            gap: "5px",
            borderRadius: "16px",
            overflow: "hidden",
            padding: "8px",
            background: "rgba(0, 0, 0, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          {Array.from({ length: 20 }, (_, index) => {
            const hue = 15 + index * 10;
            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: "100%",
                  borderRadius: "6px",
                  background: `linear-gradient(180deg, hsl(${hue}, 85%, 60%) 0%, hsl(${hue + 25}, 80%, 40%) 100%)`,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  paddingBottom: "6px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "rgba(255, 255, 255, 0.9)",
                  fontWeight: 700,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
            );
          })}
        </div>

        {/* Bottom Headline & Callout */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              background: "linear-gradient(180deg, #ffffff 30%, #d4d4d8 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            One Image. 20 Slices. One Epic Post.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "20px", color: "#a1a1aa" }}>
            <span>⚡ Instant Client-Side Slicing</span>
            <span>•</span>
            <span>🔒 100% Private (No Uploads)</span>
            <span>•</span>
            <span>📦 Auto-Numbered ZIP</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
