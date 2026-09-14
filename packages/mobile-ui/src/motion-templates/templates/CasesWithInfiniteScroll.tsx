import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function CasesWithInfiniteScrollTemplate({ time, width, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Trusted by thousands of businesses worldwide");
  const scrollSpeed = Number(values.scrollSpeed ?? 80); // Pixels per second
  const logoCount = Number(values.logoCount ?? 8);
  const accentColor = String(values.accentColor ?? "#ffffff");

  const scale = width / 1920;
  const paddingY = 80 * scale;
  const gap = 32 * scale;
  const logoSize = 120 * scale;
  const fontSize = Math.max(16, 40 * scale);

  // Set of 8 distinct geometric icons/logo SVG shapes to render dynamically
  const logoSVGs = useMemo(() => {
    return [
      // 1. Diamond
      <polygon points="50,15 85,50 50,85 15,50" fill="currentColor" opacity="0.8" />,
      // 2. Double circle
      <>
        <circle cx="40" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.8" />
        <circle cx="60" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.6" />
      </>,
      // 3. Hexagon
      <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.8" />,
      // 4. Triangle stack
      <>
        <polygon points="50,18 80,75 20,75" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.8" />
        <polygon points="50,38 70,75 30,75" fill="currentColor" opacity="0.4" />
      </>,
      // 5. Grid/Squares
      <>
        <rect x="20" y="20" width="22" height="22" fill="currentColor" opacity="0.8" />
        <rect x="58" y="20" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.8" />
        <rect x="20" y="58" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.8" />
        <rect x="58" y="58" width="22" height="22" fill="currentColor" opacity="0.8" />
      </>,
      // 6. Shield
      <path d="M50,15 L80,25 L80,55 C80,75 50,85 50,85 C50,85 20,75 20,55 L20,25 Z" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.8" />,
      // 7. Infinity loop
      <path d="M35,38 C25,38 20,44 20,50 C20,56 25,62 35,62 C45,62 55,38 65,38 C75,38 80,44 80,50 C80,56 75,62 65,62 C55,62 45,38 35,38 Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.8" />,
      // 8. Abstract Star
      <polygon points="50,10 62,38 90,38 68,56 76,84 50,67 24,84 32,56 10,38 38,38" fill="currentColor" opacity="0.8" />
    ];
  }, []);

  const totalCycleWidth = logoCount * (logoSize + gap);

  // Compute translation X offset deterministically by wrapping playhead time
  const scrollOffset = (time * scrollSpeed * scale) % totalCycleWidth;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: `0 ${64 * scale}px`,
        overflow: "hidden",
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: `${40 * scale}px`,
          width: "100%",
          padding: `${paddingY}px 0`,
        }}
      >
        <h2
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: accentColor,
            maxWidth: "600px",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {title}
        </h2>

        {/* Outer Scrolling Viewport */}
        <div
          style={{
            width: "100%",
            overflow: "hidden",
            position: "relative",
            padding: `${8 * scale}px 0`,
          }}
        >
          {/* Scrolling Content Track */}
          <div
            style={{
              display: "flex",
              gap: `${gap}px`,
              transform: `translateX(-${scrollOffset}px)`,
              width: "max-content",
            }}
          >
            {/* Render items twice to ensure a seamless looping sequence */}
            {[...Array(logoCount * 3)].map((_, index) => {
              const logoIdx = index % logoCount;
              return (
                <div
                  key={index}
                  style={{
                    width: `${logoSize}px`,
                    height: `${logoSize}px`,
                    borderRadius: `${12 * scale}px`,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    padding: `${20 * scale}px`,
                    flexShrink: 0,
                  }}
                >
                  <svg
                    viewBox="0 0 100 100"
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {logoSVGs[logoIdx % logoSVGs.length]}
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
