import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function LinkPreviewTemplate({ progress, time, width, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "Visit Aceternity UI for amazing Tailwind and Framer Motion components.");
  const highlightWord = String(values.highlightWord ?? "Aceternity UI");
  const imageSrc = String(values.imageSrc ?? placeholderImage("matfitcrop"));
  const accentColor = String(values.accentColor ?? "#a855f7");

  const scale = width / 1920;
  const fontSize = Math.max(16, 36 * scale);
  const cardWidth = 240 * scale;
  const cardHeight = 150 * scale;

  // Split text around the highlight word to style it separately
  const textParts = useMemo(() => {
    const idx = text.indexOf(highlightWord);
    if (idx === -1) {
      return { before: text, highlight: "", after: "" };
    }
    return {
      before: text.substring(0, idx),
      highlight: highlightWord,
      after: text.substring(idx + highlightWord.length),
    };
  }, [text, highlightWord]);

  // Determine card animation properties based on progress
  let cardOpacity = 0;
  let cardScale = 0.6;
  let cardY = 20;

  if (progress >= 0.15 && progress < 0.35) {
    const t = (progress - 0.15) / 0.2; // 0 to 1
    cardOpacity = t;
    cardScale = 0.6 + 0.4 * t;
    cardY = 20 - 20 * t;
  } else if (progress >= 0.35 && progress <= 0.8) {
    cardOpacity = 1;
    cardScale = 1;
    cardY = 0;
  } else if (progress > 0.8 && progress <= 0.95) {
    const t = (progress - 0.8) / 0.15; // 0 to 1
    cardOpacity = 1 - t;
    cardScale = 1 - 0.4 * t;
    cardY = 20 * t;
  }

  // Add subtle horizontal drift based on time for organic motion
  const driftX = Math.sin(time * 2.5) * 8 * scale;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${48 * scale}px`,
        fontFamily: "Space Grotesk, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "1000px",
          textAlign: "center",
          lineHeight: 1.5,
          fontSize: `${fontSize}px`,
          color: "#9ca3af",
        }}
      >
        <span>{textParts.before}</span>
        
        {/* Hover Anchor Area */}
        <span
          style={{
            position: "relative",
            display: "inline-block",
            fontWeight: "bold",
            color: accentColor,
            cursor: "pointer",
            borderBottom: `2px solid ${accentColor}`,
          }}
        >
          {textParts.highlight}

          {/* Hover Card Container */}
          {cardOpacity > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: "130%",
                left: "50%",
                transform: `translateX(-50%) translateY(${cardY}px) scale(${cardScale})`,
                opacity: cardOpacity,
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: `${16 * scale}px`,
                padding: `${6 * scale}px`,
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.5)",
                pointerEvents: "none",
                transformOrigin: "bottom center",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: `${10 * scale}px`,
                  overflow: "hidden",
                  position: "relative",
                  transform: `translateX(${driftX}px)`,
                  transition: "transform 0.15s ease-out",
                }}
              >
                <img
                  src={imageSrc}
                  alt="link preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          )}
        </span>

        <span>{textParts.after}</span>
      </div>
    </div>
  );
}
