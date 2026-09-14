import type { HtmlTemplateProps } from "../types";

export function AnimatedCardChartTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const mainColor = String(values.mainColor ?? "#8b5cf6");
  const secondaryColor = String(values.secondaryColor ?? "#fbbf24");
  const gridColor = String(values.gridColor ?? "#80808015");
  const titleText = String(values.title ?? "Just find the right caption");
  const descText = String(values.description ?? "This card will tell everything you want");
  const cycleDuration = Number(values.cycleDuration ?? 6.0);

  const scale = Math.min(width, height) / 1080;
  const cardWidth = 356 * scale;
  const visualHeight = 180 * scale;

  // Pulse hover state smoothly using sine wave
  const hoverProgress = 0.5 + 0.5 * Math.sin((time * Math.PI * 2) / cycleDuration);

  // Layer 4 Bars data
  const rectsData = [
    { width: 15, height: 20, y: 110, hoverHeight: 20, hoverY: 130, x: 40, fill: "rgba(255,255,255,0.15)", hoverFill: secondaryColor },
    { width: 15, height: 20, y: 90, hoverHeight: 20, hoverY: 130, x: 60, fill: mainColor, hoverFill: mainColor },
    { width: 15, height: 40, y: 70, hoverHeight: 30, hoverY: 120, x: 80, fill: mainColor, hoverFill: mainColor },
    { width: 15, height: 30, y: 80, hoverHeight: 50, hoverY: 100, x: 100, fill: mainColor, hoverFill: mainColor },
    { width: 15, height: 30, y: 110, hoverHeight: 40, hoverY: 110, x: 120, fill: "rgba(255,255,255,0.15)", hoverFill: secondaryColor },
    { width: 15, height: 50, y: 110, hoverHeight: 20, hoverY: 130, x: 140, fill: "rgba(255,255,255,0.15)", hoverFill: secondaryColor },
    { width: 15, height: 50, y: 60, hoverHeight: 30, hoverY: 120, x: 160, fill: mainColor, hoverFill: mainColor },
    { width: 15, height: 30, y: 80, hoverHeight: 20, hoverY: 130, x: 180, fill: mainColor, hoverFill: mainColor },
    { width: 15, height: 20, y: 110, hoverHeight: 40, hoverY: 110, x: 200, fill: "rgba(255,255,255,0.15)", hoverFill: secondaryColor },
    { width: 15, height: 40, y: 70, hoverHeight: 60, hoverY: 90, x: 220, fill: mainColor, hoverFill: mainColor },
    { width: 15, height: 30, y: 110, hoverHeight: 70, hoverY: 80, x: 240, fill: "rgba(255,255,255,0.15)", hoverFill: secondaryColor },
    { width: 15, height: 50, y: 110, hoverHeight: 50, hoverY: 100, x: 260, fill: "rgba(255,255,255,0.15)", hoverFill: secondaryColor },
    { width: 15, height: 20, y: 110, hoverHeight: 80, hoverY: 70, x: 280, fill: "rgba(255,255,255,0.15)", hoverFill: secondaryColor },
    { width: 15, height: 30, y: 80, hoverHeight: 90, hoverY: 60, x: 300, fill: mainColor, hoverFill: mainColor },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Centered Premium Card */}
      <div
        style={{
          position: "relative",
          width: cardWidth,
          overflow: "hidden",
          borderRadius: `${24 * scale}px`,
          border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
          background: "rgba(9, 9, 11, 0.95)",
          boxShadow: `0 ${10 * scale}px ${30 * scale}px rgba(0, 0, 0, 0.5)`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Visual Box */}
        <div
          style={{
            position: "relative",
            width: cardWidth,
            height: visualHeight,
            overflow: "hidden",
            borderBottom: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
          }}
        >
          {/* Radial ambient glow centered in visual area */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 50% 50%, ${mainColor}2a 0%, ${mainColor}05 50%, transparent 80%)`,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* Grid lines layer */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
              backgroundSize: `${20 * scale}px ${20 * scale}px`,
              backgroundPosition: "center",
              opacity: 0.6,
              zIndex: 2,
              maskImage: `radial-gradient(ellipse at 50% 50%, black 50%, transparent 100%)`,
              WebkitMaskImage: `radial-gradient(ellipse at 50% 50%, black 50%, transparent 100%)`,
            }}
          />

          {/* Layer 1: Staggered stats pills (fading out during simulated hover) */}
          <div
            style={{
              position: "absolute",
              top: `${16 * scale}px`,
              left: `${16 * scale}px`,
              zIndex: 8,
              display: "flex",
              gap: `${6 * scale}px`,
              opacity: 1 - hoverProgress,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: `${20 * scale}px`,
                border: `${1 * scale}px solid rgba(255, 255, 255, 0.1)`,
                background: "rgba(0, 0, 0, 0.4)",
                padding: `${4 * scale}px ${8 * scale}px`,
                backdropFilter: "blur(4px)",
              }}
            >
              <div style={{ width: `${6 * scale}px`, height: `${6 * scale}px`, borderRadius: "50%", backgroundColor: mainColor }} />
              <span style={{ marginLeft: `${6 * scale}px`, fontSize: `${10 * scale}px`, color: "#ffffff", fontWeight: 600 }}>+15,2%</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: `${20 * scale}px`,
                border: `${1 * scale}px solid rgba(255, 255, 255, 0.1)`,
                background: "rgba(0, 0, 0, 0.4)",
                padding: `${4 * scale}px ${8 * scale}px`,
                backdropFilter: "blur(4px)",
              }}
            >
              <div style={{ width: `${6 * scale}px`, height: `${6 * scale}px`, borderRadius: "50%", backgroundColor: secondaryColor }} />
              <span style={{ marginLeft: `${6 * scale}px`, fontSize: `${10 * scale}px`, color: "#ffffff", fontWeight: 600 }}>+18,7%</span>
            </div>
          </div>

          {/* Layer 2: Slide up metadata card */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 7,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: `${16 * scale}px`,
              transform: `translateY(${(1 - hoverProgress) * 100}px)`,
              opacity: hoverProgress,
            }}
          >
            <div
              style={{
                borderRadius: `${8 * scale}px`,
                border: `${1 * scale}px solid rgba(255, 255, 255, 0.15)`,
                background: "rgba(0, 0, 0, 0.65)",
                padding: `${10 * scale}px ${16 * scale}px`,
                backdropFilter: "blur(8px)",
                display: "flex",
                flexDirection: "column",
                gap: `${4 * scale}px`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: `${8 * scale}px` }}>
                <div style={{ width: `${8 * scale}px`, height: `${8 * scale}px`, borderRadius: "50%", backgroundColor: mainColor }} />
                <span style={{ fontSize: `${12 * scale}px`, color: "#ffffff", fontWeight: 600 }}>Random Data Visualization</span>
              </div>
              <span style={{ fontSize: `${11 * scale}px`, color: "#94a3b8" }}>Displaying some interesting stats.</span>
            </div>
          </div>

          {/* Layer 3: Linear Gradient highlight block */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 6,
              background: `linear-gradient(to bottom, transparent 30%, ${mainColor}3a 100%)`,
              opacity: hoverProgress,
            }}
          />

          {/* Layer 4: Floating animated bar chart rects (zoomed on hover) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${1 + hoverProgress * 0.15})`,
            }}
          >
            <svg
              width={cardWidth}
              height={visualHeight}
              viewBox="0 0 356 180"
              style={{ width: "100%", height: "100%" }}
            >
              {rectsData.map((rect, index) => {
                const currentHeight = rect.height + (rect.hoverHeight - rect.height) * hoverProgress;
                const currentY = rect.y + (rect.hoverY - rect.y) * hoverProgress;
                const currentFill = hoverProgress > 0.5 ? rect.hoverFill : rect.fill;
                return (
                  <rect
                    key={index}
                    width={rect.width}
                    height={currentHeight}
                    x={rect.x}
                    y={currentY}
                    fill={currentFill}
                    rx="2"
                    ry="2"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Card Body */}
        <div
          style={{
            padding: `${20 * scale}px`,
            display: "flex",
            flexDirection: "column",
            gap: `${6 * scale}px`,
          }}
        >
          <span
            style={{
              fontSize: `${20 * scale}px`,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.01em",
            }}
          >
            {titleText}
          </span>
          <span
            style={{
              fontSize: `${14 * scale}px`,
              color: "#94a3b8",
              lineHeight: 1.4,
            }}
          >
            {descText}
          </span>
        </div>
      </div>
    </div>
  );
}
