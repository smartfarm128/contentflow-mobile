import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function TextRevealTemplate({ progress, width, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "Magic UI will change the way you design.");
  const textColor = String(values.textColor ?? "#ffffff");
  const inactiveColor = String(values.inactiveColor ?? "rgba(255, 255, 255, 0.2)");

  const words = useMemo(() => {
    return text.split(" ").map((w) => w.trim()).filter(Boolean);
  }, [text]);

  const scale = width / 1920;
  const fontSize = Math.max(16, 64 * scale);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        backgroundImage: "radial-gradient(circle at center, #09090b 0%, #020202 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "40px",
      }}
    >
      <p
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "85%",
          lineHeight: 1.3,
          fontSize: `${fontSize}px`,
          fontWeight: "bold",
          margin: 0,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {words.map((word, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;

          let wordOpacity = 0;
          if (progress >= end) {
            wordOpacity = 1;
          } else if (progress <= start) {
            wordOpacity = 0;
          } else {
            wordOpacity = (progress - start) / (end - start);
          }

          return (
            <span
              key={i}
              style={{
                position: "relative",
                marginRight: `${fontSize * 0.35}px`,
                marginBottom: `${fontSize * 0.2}px`,
                display: "inline-block",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  color: inactiveColor,
                  userSelect: "none",
                }}
              >
                {word}
              </span>
              <span
                style={{
                  color: textColor,
                  opacity: wordOpacity,
                }}
              >
                {word}
              </span>
            </span>
          );
        })}
      </p>
    </div>
  );
}
