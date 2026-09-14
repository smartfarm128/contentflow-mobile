import type { HtmlTemplateProps } from "../types";

export function BlurredStaggerTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "ContentFlow Motion Graphics");
  const textColor = String(values.textColor ?? "#ffffff");
  const staggerDelay = Number(values.staggerDelay ?? 0.02);
  const transitionDuration = Number(values.transitionDuration ?? 0.35);
  const maxBlur = Number(values.maxBlur ?? 16);
  const fontSize = Number(values.fontSize ?? 48);

  const scale = Math.min(width, height) / 1080;
  const scaledFontSize = fontSize * scale;
  const scaledMaxBlur = maxBlur * scale;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#09090b",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      <h1
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          maxWidth: "85%",
          fontSize: `${scaledFontSize}px`,
          fontWeight: 600,
          color: textColor,
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        {text.split("").map((char, i) => {
          const start_i = i * staggerDelay;
          const end_i = start_i + transitionDuration;

          let progress = 0;
          if (time >= start_i) {
            if (time >= end_i) {
              progress = 1;
            } else {
              progress = (time - start_i) / transitionDuration;
            }
          }

          const easeOutProgress = 1 - Math.pow(1 - progress, 2);
          const opacity = easeOutProgress;
          const blur = (1 - easeOutProgress) * scaledMaxBlur;

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity,
                filter: `blur(${blur}px)`,
                transform: `scale(${0.9 + 0.1 * easeOutProgress})`,
                transition: "opacity 0.05s linear, filter 0.05s linear",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </h1>
    </div>
  );
}
