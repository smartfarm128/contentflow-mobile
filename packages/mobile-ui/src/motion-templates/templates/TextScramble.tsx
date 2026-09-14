import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";

function seededChar(seed: number): string {
  let x = seed;
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  return CHARS[Math.abs(x) % CHARS.length];
}

export function TextScrambleTemplate({ progress, values, width }: HtmlTemplateProps) {
  const text = String(values.text ?? "VIEW WORK").toUpperCase();
  const accent = String(values.accent ?? "#f5a623");
  const fontFamily = String(values.font ?? "Inter, sans-serif");

  // Font size: 8% of canvas width, clamped 20–90px
  const fontSize = Math.round(Math.max(20, Math.min(90, width * 0.08)));
  const sublabelSize = Math.round(Math.max(10, Math.min(16, width * 0.012)));

  const revealedLength = Math.floor(progress * text.length);
  const scrambling = progress < 0.95 && progress > 0;
  const frame = Math.floor(progress * text.length * 3);

  const chars = useMemo(() => {
    return text.split("").map((char, i) => {
      if (char === " ") return { char: " ", revealed: true, isSpace: true };
      if (i < revealedLength) return { char, revealed: true, isSpace: false };
      if (!scrambling) return { char, revealed: false, isSpace: false };
      return { char: seededChar(frame * 97 + i * 31 + i), revealed: false, isSpace: false };
    });
  }, [text, revealedLength, scrambling, frame]);

  const underlineScale = Math.min(1, Math.max(0, (progress - 0.9) / 0.1));
  const glowOpacity = progress > 0.85 ? (progress - 0.85) / 0.15 : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        userSelect: "none",
        background: "transparent",
      }}
    >
      <div style={{ position: "relative", display: "inline-flex", flexDirection: "column" }}>
        {/* Glow */}
        <span
          style={{
            position: "absolute",
            inset: "-16px",
            borderRadius: "8px",
            background: `${accent}0d`,
            opacity: glowOpacity,
            pointerEvents: "none",
          }}
        />

        {/* Characters */}
        <span
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            display: "inline-flex",
            flexDirection: "row",
            lineHeight: 1,
          }}
        >
          {chars.map(({ char, revealed, isSpace }, i) =>
            isSpace ? (
              // Explicit space — inline-block with fixed width so it doesn't collapse
              <span key={i} style={{ display: "inline-block", width: "0.4em" }} />
            ) : (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  color: revealed ? "#ffffff" : accent,
                  transform: !revealed && scrambling ? "scale(1.1)" : "scale(1)",
                  transition: "transform 150ms, color 150ms",
                  transitionDelay: `${i * 10}ms`,
                }}
              >
                {char}
              </span>
            )
          )}
        </span>

        {/* Underline */}
        <span
          style={{
            position: "relative",
            display: "block",
            height: "1px",
            marginTop: `${Math.round(fontSize * 0.15)}px`,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              background: "#ffffff",
              transform: `scaleX(${underlineScale})`,
              transformOrigin: "left",
              transition: "transform 80ms linear",
            }}
          />
          <span style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.15)" }} />
        </span>
      </div>

      {/* Sub-label */}
      {values.sublabel && (
        <p
          style={{
            marginTop: `${Math.round(fontSize * 0.3)}px`,
            fontSize: `${sublabelSize}px`,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            fontFamily,
            opacity: progress > 0.5 ? 1 : 0,
            transition: "opacity 300ms",
          }}
        >
          {String(values.sublabel)}
        </p>
      )}
    </div>
  );
}
