import type { HtmlTemplateProps } from "../types";

export function AnimatedTextTemplate({
  progress,
  width,
  height,
  values,
}: HtmlTemplateProps) {
  const scaleFactor = Math.min(width, height) / 1080;

  const text = String(values.text ?? "Mishra Hub");
  const textColor = String(values.textColor ?? "#ffffff");
  const underlineGradient = String(
    values.underlineGradient ?? "from-blue-500 via-purple-500 to-pink-500"
  );
  const underlineHeight = Number(values.underlineHeight ?? 8) * scaleFactor;
  const underlineOffset = Number(values.underlineOffset ?? 16) * scaleFactor;
  const baseFontSize = Number(values.fontSize ?? 72) * scaleFactor;

  const letters = Array.from(text);
  const n = letters.length;

  // Render letters with staggered progress mapping
  const renderLetters = () => {
    return letters.map((letter, idx) => {
      // Stagger start: each letter starts showing based on its index
      // Stagger covers progress 0.0 -> 0.6
      const letterStart = (idx / n) * 0.6;
      const letterEnd = letterStart + 0.15; // Animation duration per letter

      // Calculate localized progress for this letter
      let letterProgress = 0;
      if (progress > letterEnd) {
        letterProgress = 1;
      } else if (progress > letterStart) {
        letterProgress = (progress - letterStart) / (letterEnd - letterStart);
      }

      // Linear easing or simple curve
      const opacity = letterProgress;
      const y = (1 - letterProgress) * 30 * scaleFactor;

      return (
        <span
          key={idx}
          style={{
            display: "inline-block",
            opacity,
            transform: `translate3d(0, ${y}px, 0)`,
            transition: "none",
            whiteSpace: letter === " " ? "pre" : "normal",
          }}
        >
          {letter}
        </span>
      );
    });
  };

  // Underline animation: progress 0.6 -> 1.0
  let underlineWidth = 0;
  let underlineLeft = 50;
  if (progress > 0.6) {
    const underlineProgress = Math.min(1, (progress - 0.6) / 0.4);
    underlineWidth = underlineProgress * 100;
    underlineLeft = (1 - underlineProgress) * 50;
  }

  // Parse gradient classes/colors to an inline gradient styling
  // Simple map for standard tailwind gradients
  let bgStyle = "linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)";
  if (underlineGradient.includes("from-red-500")) {
    bgStyle = "linear-gradient(to right, #ef4444, #eab308, #22c55e)";
  } else if (underlineGradient.includes("from-blue-600")) {
    bgStyle = "linear-gradient(to right, #2563eb, #7c3aed)";
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative" }}>
        <h1
          style={{
            fontSize: `${baseFontSize}px`,
            fontWeight: 800,
            color: textColor,
            textAlign: "center",
            margin: 0,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {renderLetters()}
        </h1>

        {/* Dynamic Underline */}
        <div
          style={{
            position: "absolute",
            bottom: `-${underlineOffset}px`,
            height: `${underlineHeight}px`,
            width: `${underlineWidth}%`,
            left: `${underlineLeft}%`,
            background: bgStyle,
            borderRadius: `${underlineHeight / 2}px`,
            transition: "none",
          }}
        />
      </div>
    </div>
  );
}
