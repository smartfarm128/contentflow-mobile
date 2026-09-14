import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function ShimmerTextTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Read controls
  const text = String(values.text ?? "Introducing the future");
  const fontColor = String(values.fontColor ?? "#a855f7"); // sleek purple color by default
  const shimmerColor = String(values.shimmerColor ?? "rgba(255, 255, 255, 0.65)");
  const baseSize = Number(values.fontSize ?? 48);
  
  const shimmerDuration = Number(values.shimmerDuration ?? 1.5);
  const shimmerInterval = Number(values.shimmerInterval ?? 1.5);

  // 2. Scale factor based on canvas
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  const fontSizePx = Math.max(16, baseSize * scaleFactor * 2.2);

  // 3. Playhead-deterministic background position calculation
  // Loops over (shimmerDuration + shimmerInterval) cycles
  const { backgroundPositionX } = useMemo(() => {
    const cycleTime = shimmerDuration + shimmerInterval;
    const activeTime = time % Math.max(0.2, cycleTime);
    
    let positionPercent = 250;
    if (activeTime < shimmerDuration) {
      const progress = activeTime / shimmerDuration;
      // Interpolate from -100% to 250%
      positionPercent = -100 + progress * 360;
    }
    return { backgroundPositionX: `${positionPercent}%` };
  }, [time, shimmerDuration, shimmerInterval]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030303",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Dynamic ambient halo background */}
      <div
        style={{
          position: "absolute",
          width: `${500 * scaleFactor}px`,
          height: `${500 * scaleFactor}px`,
          background: `radial-gradient(circle, ${fontColor}08 0%, transparent 70%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ textAlign: "center", width: "100%", padding: "0 24px" }}>
        <div
          style={{
            display: "inline-block",
            fontSize: `${fontSizePx}px`,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
            color: fontColor,
            WebkitTextFillColor: "transparent",
            background: `linear-gradient(to right, ${fontColor} 0%, ${shimmerColor} 40%, ${shimmerColor} 60%, ${fontColor} 100%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            backgroundRepeat: "no-repeat",
            backgroundSize: "50% 200%",
            backgroundPositionX: backgroundPositionX,
            userSelect: "none",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
