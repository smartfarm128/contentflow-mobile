import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function GooeyTextTemplate({ time, width, values }: HtmlTemplateProps) {
  const rawTexts = String(values.texts ?? "Design, Engineering, Is, Awesome");
  const texts = useMemo(() => {
    return rawTexts.split(",").map((t) => t.trim()).filter(Boolean);
  }, [rawTexts]);

  const morphTime = Number(values.morphTime ?? 1);
  const cooldownTime = Number(values.cooldownTime ?? 0.25);
  const textColor = String(values.textColor ?? "#ffffff");

  const scale = width / 1920;
  const fontSize = Math.max(16, 72 * scale);

  const n = texts.length || 1;
  const cycleDuration = morphTime + cooldownTime;
  
  // Calculate active index and next index based on absolute playhead time
  const cycleIndex = Math.floor(time / cycleDuration) % n;
  const nextCycleIndex = (cycleIndex + 1) % n;
  const localTime = time % cycleDuration;

  let f = 0;
  if (localTime >= cooldownTime) {
    f = (localTime - cooldownTime) / morphTime;
  }
  const fraction = Math.max(0, Math.min(1, f));

  // Compute text properties based on morph fraction
  const opacity1 = Math.pow(1 - fraction, 0.4);
  const blur1 = 1 - fraction === 0 ? 100 : 8 / (1 - fraction) - 8;

  const opacity2 = Math.pow(fraction, 0.4);
  const blur2 = fraction === 0 ? 100 : 8 / fraction - 8;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      {/* Unique Threshold SVG filter */}
      <svg
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter id="threshold-gooey-template">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      {/* Morphing Stage */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: "url(#threshold-gooey-template)",
          width: "100%",
          height: "100%",
        }}
      >
        <span
          style={{
            position: "absolute",
            display: "inline-block",
            userSelect: "none",
            textAlign: "center",
            fontSize: `${fontSize}px`,
            fontWeight: "bold",
            color: textColor,
            opacity: opacity1,
            filter: `blur(${Math.min(100, blur1)}px)`,
          }}
        >
          {texts[cycleIndex] || ""}
        </span>
        <span
          style={{
            position: "absolute",
            display: "inline-block",
            userSelect: "none",
            textAlign: "center",
            fontSize: `${fontSize}px`,
            fontWeight: "bold",
            color: textColor,
            opacity: opacity2,
            filter: `blur(${Math.min(100, blur2)}px)`,
          }}
        >
          {texts[nextCycleIndex] || ""}
        </span>
      </div>
    </div>
  );
}
