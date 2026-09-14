import type { HtmlTemplateProps } from "../types";

export function MovingDotCardTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const target = Number(values.target ?? 777000);
  const countDuration = Number(values.countDuration ?? 2.0);
  const orbitDuration = Number(values.orbitDuration ?? 4.0);
  const dotColor = String(values.dotColor ?? "#38bdf8");
  const labelText = String(values.labelText ?? "Views");

  const scale = Math.min(width, height) / 1080;
  const cardWidth = 460 * scale;
  const cardHeight = 280 * scale;
  const dotSize = 14 * scale;

  // Counter animation
  const progress = Math.min(1.0, time / countDuration);
  const count = Math.floor(progress * target);
  const display = count < 1000 ? count : `${Math.floor(count / 1000)}k`;

  // Orbit animation
  const p = (time / orbitDuration) % 1.0;
  let dotTop = 0;
  let dotLeft = 0;

  if (p < 0.25) {
    // 0% - 25%: top-right to top-left
    const ratio = p / 0.25;
    dotLeft = cardWidth - ratio * cardWidth;
    dotTop = 0;
  } else if (p < 0.50) {
    // 25% - 50%: top-left to bottom-left
    const ratio = (p - 0.25) / 0.25;
    dotLeft = 0;
    dotTop = ratio * cardHeight;
  } else if (p < 0.75) {
    // 50% - 75%: bottom-left to bottom-right
    const ratio = (p - 0.50) / 0.25;
    dotLeft = ratio * cardWidth;
    dotTop = cardHeight;
  } else {
    // 75% - 100%: bottom-right to top-right
    const ratio = (p - 0.75) / 0.25;
    dotLeft = cardWidth;
    dotTop = cardHeight - ratio * cardHeight;
  }

  // Adjust for dot center offset
  dotLeft = dotLeft - dotSize / 2;
  dotTop = dotTop - dotSize / 2;

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
      <div
        style={{
          position: "relative",
          width: cardWidth,
          height: cardHeight,
        }}
      >
        {/* Orbiting Dot */}
        <div
          style={{
            position: "absolute",
            width: dotSize,
            height: dotSize,
            backgroundColor: dotColor,
            borderRadius: "50%",
            boxShadow: `0 0 ${20 * scale}px ${6 * scale}px ${dotColor}`,
            zIndex: 10,
            transform: `translate(${dotLeft}px, ${dotTop}px)`,
            pointerEvents: "none",
          }}
        />

        {/* Card Body */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.1)`,
            borderRadius: `${24 * scale}px`,
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            zIndex: 5,
          }}
        >
          {/* Ambient Corner Ray */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 85% 15%, ${dotColor}1e 0%, transparent 60%)`,
              pointerEvents: "none",
            }}
          />

          {/* Value display */}
          <div
            style={{
              fontSize: `${80 * scale}px`,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            {display}
          </div>

          {/* Label display */}
          <div
            style={{
              fontSize: `${20 * scale}px`,
              fontWeight: 600,
              color: "#94a3b8",
              marginTop: `${10 * scale}px`,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {labelText}
          </div>

          {/* Glow Edges (top, bottom, left, right border highlights) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${2 * scale}px`,
              background: `linear-gradient(to right, transparent, ${dotColor}66, transparent)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: `${2 * scale}px`,
              background: `linear-gradient(to right, transparent, ${dotColor}66, transparent)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
