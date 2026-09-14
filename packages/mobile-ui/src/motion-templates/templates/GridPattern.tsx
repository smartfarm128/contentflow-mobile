import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function GridPatternTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const gridWidth = Number(values.gridWidth ?? 50);
  const gridHeight = Number(values.gridHeight ?? 50);
  const strokeColor = String(values.strokeColor ?? "rgba(255, 255, 255, 0.05)");
  const highlightColor = String(values.highlightColor ?? "#6366f1");
  const textTitle = String(values.title ?? "GRID PATTERN LAYER");

  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Render a fixed matrix of squares for clean algebraic animation performance
  const cols = 20;
  const rows = 12;

  // Calculate coordinates of grid squares and their playhead-driven ripple opacity
  const activeSquares = useMemo(() => {
    const list = [];
    const centerX = cols / 2;
    const centerY = rows / 2;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Mathematical distance from center
        const dist = Math.hypot(c - centerX, r - centerY);
        
        // Sine wave ripple originating from the center
        const wave = Math.sin(time * 3 - dist * 0.7);
        
        // Convert to a sharp pulse decay
        const opacity = Math.max(0, Math.min(0.35, wave));

        if (opacity > 0.05) {
          list.push({ col: c, row: r, opacity });
        }
      }
    }
    return list;
  }, [time, cols, rows]);

  // Scaled dimensions
  const cellWidth = gridWidth * scaleFactor;
  const cellHeight = gridHeight * scaleFactor;
  const fontSize = Math.max(24, 48 * scaleFactor);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030014",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Sleek SVG Grid */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern
            id="template-grid"
            width={cellWidth}
            height={cellHeight}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${cellWidth} 0 L 0 0 0 ${cellHeight}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1"
            />
          </pattern>
          {/* Radial gradient mask to fade grid edges */}
          <radialGradient id="grid-mask" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="60%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="fade-mask">
            <rect width="100%" height="100%" fill="url(#grid-mask)" />
          </mask>
        </defs>

        {/* Masked Grid Layout */}
        <g mask="url(#fade-mask)">
          <rect width="100%" height="100%" fill="url(#template-grid)" />

          {/* Render playhead-rippling highlight squares */}
          {activeSquares.map((sq, i) => (
            <rect
              key={i}
              x={sq.col * cellWidth}
              y={sq.row * cellHeight}
              width={cellWidth - 1}
              height={cellHeight - 1}
              fill={highlightColor}
              opacity={sq.opacity}
              style={{
                mixBlendMode: "screen",
                transition: "opacity 0.1s linear",
              }}
            />
          ))}
        </g>
      </svg>

      {/* Floating Center Typographic Title */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            margin: 0,
            textShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
            opacity: 0.9 + 0.1 * Math.sin(time * 4), // soft pulsing opacity
          }}
        >
          {textTitle}
        </h1>
      </div>
    </div>
  );
}
