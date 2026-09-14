import type { HtmlTemplateProps } from "../types";

export function InfiniteTextMarqueeTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "Let's Get Started");
  const speed = Number(values.speed ?? 40.0);
  const fontSize = Number(values.fontSize ?? 120);
  const textColor = String(values.textColor ?? "#38bdf8");
  const showTooltip = Boolean(values.showTooltip ?? true);
  const tooltipText = String(values.tooltipText ?? "Time to Flex💪");
  const tooltipBg = String(values.tooltipBg ?? "#3b82f6");
  const tooltipColor = String(values.tooltipColor ?? "#ffffff");

  const scale = Math.min(width, height) / 1080;
  const scaledFontSize = fontSize * scale;

  // Seamless horizontal translation loop
  const cyclePercent = ((time * speed * 0.2) % 50); // repeats at 50%
  const xTranslation = -cyclePercent;

  // Floating tooltip path simulation
  const tooltipX = width / 2 + Math.sin(time * 2.5) * (width * 0.25);
  const tooltipY = height / 2 + Math.cos(time * 1.8) * (height * 0.18);
  const tooltipRotation = Math.sin(time * 3.0) * 6;

  const repeatedText = Array(4).fill(text).join("  -  ") + "  -  ";

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
        fontFamily: "Inter, sans-serif",
      }}
    >
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            zIndex: 99,
            backgroundColor: tooltipBg,
            color: tooltipColor,
            fontWeight: "bold",
            padding: `${16 * scale}px ${32 * scale}px`,
            borderRadius: `${24 * scale}px`,
            whiteSpace: "nowrap",
            fontSize: `${18 * scale}px`,
            boxShadow: `0 ${10 * scale}px ${20 * scale}px rgba(0, 0, 0, 0.4)`,
            top: 0,
            left: 0,
            transform: `translate(${tooltipX}px, ${tooltipY}px) rotateZ(${tooltipRotation}deg) translate(-50%, -140%)`,
            pointerEvents: "none",
          }}
        >
          {tooltipText}
        </div>
      )}

      <div
        style={{
          width: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "200%",
            transform: `translateX(${xTranslation}%)`,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ width: "50%", display: "flex", justifyContent: "space-around" }}>
            <span
              style={{
                fontSize: `${scaledFontSize}px`,
                fontWeight: "bold",
                color: textColor,
                letterSpacing: "-0.02em",
              }}
            >
              {repeatedText}
            </span>
          </div>
          <div style={{ width: "50%", display: "flex", justifyContent: "space-around" }}>
            <span
              style={{
                fontSize: `${scaledFontSize}px`,
                fontWeight: "bold",
                color: textColor,
                letterSpacing: "-0.02em",
              }}
            >
              {repeatedText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
