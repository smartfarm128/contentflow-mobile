import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function TypewriterTextTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read inputs from values
  const textRaw = String(values.text ?? "ContentFlow: Professional video editing powered by real-time playhead-deterministic templates.");
  const speed = Number(values.speed ?? 25); // characters per second
  const textColor = String(values.textColor ?? "#f8fafc");
  const cursorColor = String(values.cursorColor ?? "#6366f1");
  const cursorChar = String(values.cursorChar ?? "|");
  const textAlign = String(values.textAlign ?? "center");

  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Split text by lines or parse single text
  const cleanText = textRaw.replace(/\\n/g, "\n");

  // Determine typed substring length based on timeline time
  const charsCount = Math.floor(time * speed);
  const displayText = useMemo(() => {
    return cleanText.slice(0, Math.min(cleanText.length, charsCount));
  }, [cleanText, charsCount]);

  // Cursor blink logic (blinks every 500ms)
  const isCursorVisible = Math.floor(time * 2) % 2 === 0 || charsCount < cleanText.length;

  // Scaled dimensions
  const fontSize = Math.max(20, 36 * scaleFactor);
  const paddingX = 64 * scaleFactor;
  const maxContentWidth = 960 * scaleFactor;

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
        fontFamily: "Courier New, Courier, monospace", // classic typewriter font
        paddingLeft: `${paddingX}px`,
        paddingRight: `${paddingX}px`,
      }}
    >
      {/* Decorative scanline or glow background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, rgba(99, 102, 241, 0.05) 0%, transparent 80%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: `${maxContentWidth}px`,
          textAlign: textAlign as any,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          fontSize: `${fontSize}px`,
          fontWeight: 600,
          color: textColor,
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        <span>{displayText}</span>
        <span
          style={{
            color: cursorColor,
            opacity: isCursorVisible ? 1 : 0,
            fontWeight: 800,
            marginLeft: "2px",
          }}
        >
          {cursorChar}
        </span>
      </div>
    </div>
  );
}
