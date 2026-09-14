import type { HtmlTemplateProps } from "../types";

export function MatrixTextTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "ContentFlow AI");
  const matrixColor = String(values.matrixColor ?? "#00ff00");
  const textColor = String(values.textColor ?? "#ffffff");
  const staggerDelay = Number(values.staggerDelay ?? 0.15);
  const decodeDuration = Number(values.decodeDuration ?? 0.5);
  const fontSize = Number(values.fontSize ?? 60);

  const scale = Math.min(width, height) / 1080;
  const scaledFontSize = fontSize * scale;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000000",
        fontFamily: "monospace",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          maxWidth: "90%",
          gap: `${4 * scale}px`,
        }}
      >
        {text.split("").map((char, i) => {
          const start_i = i * staggerDelay;
          const end_i = start_i + decodeDuration;

          let displayChar = "\u00A0";
          let isMatrix = false;

          if (char === " ") {
            displayChar = "\u00A0";
          } else if (time >= start_i && time < end_i) {
            isMatrix = true;
            displayChar = ((Math.floor(time * 15) + i) % 2 === 0) ? "1" : "0";
          } else if (time >= end_i) {
            displayChar = char;
          }

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                width: `${scaledFontSize * 0.65}px`,
                textAlign: "center",
                fontSize: `${scaledFontSize}px`,
                fontWeight: 700,
                color: isMatrix ? matrixColor : textColor,
                textShadow: isMatrix
                  ? `0 0 ${10 * scale}px ${matrixColor}, 0 0 ${20 * scale}px ${matrixColor}`
                  : "none",
                fontVariantNumeric: "tabular-nums",
                transition: "color 0.1s ease-out, text-shadow 0.1s ease-out",
              }}
            >
              {displayChar}
            </span>
          );
        })}
      </div>
    </div>
  );
}
