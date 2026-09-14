import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function HeroHighlightTemplate({ time, progress, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const textVal = String(values.text ?? "With insomnia, nothing's real. Everything is far away. Everything is a");
  const highlightVal = String(values.highlightText ?? "copy, of a copy, of a copy.");
  const dotColorDark = String(values.dotColorDark ?? "rgba(38, 38, 38, 0.7)");
  const spotlightRadius = Number(values.spotlightRadius ?? 250);
  const spotlightColor = String(values.spotlightColor ?? "rgb(99, 102, 241)"); // indigo-500

  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Let's compute the circular trajectory of the spotlight coordinate (x, y) based on time
  const spotlightX = useMemo(() => {
    const rx = width * 0.22;
    return width / 2 + Math.cos(time * 1.5) * rx;
  }, [time, width]);

  const spotlightY = useMemo(() => {
    const ry = height * 0.18;
    return height / 2 + Math.sin(time * 1.8) * ry;
  }, [time, height]);

  // Dot patterns

  const dotPatternDark = useMemo(() => ({
    backgroundImage: `radial-gradient(circle, ${dotColorDark} 1px, transparent 1px)`,
    backgroundSize: `${16 * scaleFactor}px ${16 * scaleFactor}px`,
  }), [dotColorDark, scaleFactor]);

  const dotPatternSpotlight = useMemo(() => ({
    backgroundImage: `radial-gradient(circle, ${spotlightColor} 1px, transparent 1px)`,
    backgroundSize: `${16 * scaleFactor}px ${16 * scaleFactor}px`,
  }), [spotlightColor, scaleFactor]);

  // Calculate the gradient width of the highlighted text background
  // Let's sweep it from 0% to 100% between progress = 0.2 and 0.8
  const highlightProgress = Math.min(1, Math.max(0, (progress - 0.2) / 0.6));
  const highlightWidth = `${highlightProgress * 100}%`;

  // Scale fonts and spacing
  const fontSize = Math.max(16, 48 * scaleFactor);
  const paddingX = 40 * scaleFactor;
  const maxTextWidth = 1000 * scaleFactor;
  const scaledRadius = spotlightRadius * scaleFactor;

  // Mask string for WebkitMaskImage/maskImage
  const maskStyle = {
    WebkitMaskImage: `radial-gradient(${scaledRadius}px circle at ${spotlightX}px ${spotlightY}px, black 0%, transparent 100%)`,
    maskImage: `radial-gradient(${scaledRadius}px circle at ${spotlightX}px ${spotlightY}px, black 0%, transparent 100%)`,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030712",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Muted neutral dot background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.8,
          pointerEvents: "none",
          ...dotPatternDark,
        }}
      />

      {/* Spotlight Colored Dot Background (Revealed via Mask) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          ...dotPatternSpotlight,
          ...maskStyle,
        }}
      />

      {/* Ambient soft glow following the spotlight */}
      <div
        style={{
          position: "absolute",
          left: `${spotlightX - scaledRadius * 1.5}px`,
          top: `${spotlightY - scaledRadius * 1.5}px`,
          width: `${scaledRadius * 3}px`,
          height: `${scaledRadius * 3}px`,
          background: `radial-gradient(circle, ${spotlightColor}15 0%, transparent 70%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Typography Overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          paddingLeft: `${paddingX}px`,
          paddingRight: `${paddingX}px`,
          maxWidth: `${maxTextWidth}px`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.5,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {textVal}{" "}
          <span
            style={{
              position: "relative",
              display: "inline",
              paddingBottom: `${4 * scaleFactor}px`,
              paddingLeft: `${6 * scaleFactor}px`,
              paddingRight: `${6 * scaleFactor}px`,
              borderRadius: `${8 * scaleFactor}px`,
              backgroundImage: "linear-gradient(to right, #6366f1, #a855f7)",
              backgroundSize: `${highlightWidth} 100%`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "left center",
              color: "#ffffff",
            }}
          >
            {highlightVal}
          </span>
        </h1>
      </div>
    </div>
  );
}
