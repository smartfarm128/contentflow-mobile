import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function AnimatedUnderlineTextTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const text = String(values.text ?? "Namaste World!");
  const underlineDuration = Math.max(0.1, Number(values.underlineDuration ?? 1.5));
  const textColor = String(values.textColor ?? "#ffffff");
  const underlineColor = String(values.underlineColor ?? "#3b82f6");

  // Determine scaling factor relative to 1080p composition height
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Font and padding scaling
  const fontSize = Math.max(16, 72 * scaleFactor * 2.2);

  // Ease function
  const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // Text entry animations (0 to 0.6 seconds)
  const textProgress = Math.min(1, time / 0.6);
  const textY = -20 * (1 - textProgress) * scaleFactor;
  const textOpacity = textProgress;

  // Underline drawing animation (0 to underlineDuration)
  const underlineProgress = Math.min(1, time / underlineDuration);
  const pathLength = easeInOutQuad(underlineProgress);
  const pathOpacity = underlineProgress > 0 ? 1 : 0;

  // Wobble/morph calculation (cycles back and forth after drawing completes)
  const currentPath = useMemo(() => {
    let w = 0;
    if (time > underlineDuration) {
      const morphTime = time - underlineDuration;
      // Cycles 0 -> 1 -> 0 every 3 seconds
      w = 0.5 - 0.5 * Math.cos((2 * Math.PI * morphTime) / 3.0);
    }
    return `M 0,10 Q 75,${0 + 20 * w} 150,10 Q 225,${20 - 20 * w} 300,10`;
  }, [time, underlineDuration]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Animated Text */}
        <h1
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: "bold",
            textAlign: "center",
            color: textColor,
            margin: 0,
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
            lineHeight: 1.2,
          }}
        >
          {text}
        </h1>

        {/* Underline SVG */}
        <svg
          width={`${300 * scaleFactor * 2.2}px`}
          height={`${20 * scaleFactor * 2.2}px`}
          viewBox="0 0 300 20"
          style={{
            position: "absolute",
            bottom: `-${24 * scaleFactor * 2.2}px`,
            left: "50%",
            transform: "translateX(-50%)",
            opacity: pathOpacity,
          }}
        >
          <path
            d={currentPath}
            stroke={underlineColor}
            strokeWidth="3"
            fill="none"
            strokeDasharray="300"
            strokeDashoffset={300 * (1 - pathLength)}
          />
        </svg>
      </div>
    </div>
  );
}
