import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function GridOverviewTemplate({ progress, values, width, height }: HtmlTemplateProps) {
  const title = String(values.title ?? "8 META AD HACKS").toUpperCase();
  const accent = String(values.accent ?? "#e5484d");
  const bgOpacity = Number(values.bgOpacity ?? 0.95);

  const items = useMemo(() => [
    String(values.item1 ?? "Item one"),
    String(values.item2 ?? "Item two"),
    String(values.item3 ?? "Item three"),
    String(values.item4 ?? "Item four"),
    String(values.item5 ?? "Item five"),
    String(values.item6 ?? "Item six"),
    String(values.item7 ?? "Item seven"),
    String(values.item8 ?? "Item eight"),
  ], [values]);

  // Responsive sizing
  const titleSize = Math.round(Math.max(18, Math.min(48, width * 0.045)));
  const underlineWidth = Math.round(Math.max(120, Math.min(480, width * 0.3)));
  const cardTextSize = Math.round(Math.max(10, Math.min(16, width * 0.016)));
  const badgeSize = Math.round(Math.max(24, Math.min(48, width * 0.045)));
  const badgeTextSize = Math.round(Math.max(10, Math.min(22, width * 0.022)));

  const isEntering = progress < 0.2;
  const isExiting = progress > 0.85;

  const entryProgress = isEntering ? progress / 0.2 : 1;
  const exitProgress = isExiting ? (1 - progress) / 0.15 : 1;
  const generalProgress = Math.min(entryProgress, exitProgress);

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  // Staggered card entrance calculation (between 0.05 and 0.5 timeline progress)
  const getCardAnimation = (index: number) => {
    if (isExiting) return { opacity: generalProgress, translateY: (1 - generalProgress) * 30 };

    const start = 0.05 + index * 0.05;
    const end = start + 0.15;
    if (progress < start) return { opacity: 0, translateY: 30 };
    if (progress > end) return { opacity: 1, translateY: 0 };
    
    const cardProgress = (progress - start) / 0.15;
    const cardEased = easeOut(cardProgress);
    return {
      opacity: cardEased,
      translateY: (1 - cardEased) * 30,
    };
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: `${height * 0.08}px`,
        paddingBottom: `${height * 0.08}px`,
        fontFamily: "Inter, sans-serif",
        userSelect: "none",
        backgroundColor: `rgba(8, 8, 8, ${bgOpacity * generalProgress})`,
        overflow: "hidden",
      }}
    >
      {/* Header Title */}
      <h2
        style={{
          fontSize: `${titleSize}px`,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "0.08em",
          lineHeight: 1,
          margin: 0,
          opacity: generalProgress,
          transform: `translateY(${(1 - generalProgress) * -20}px)`,
          textAlign: "center",
        }}
      >
        {title}
      </h2>

      {/* Decorative Gradient Underline */}
      <div
        style={{
          width: `${underlineWidth}px`,
          height: "6px",
          background: `linear-gradient(90deg, ${accent} 0%, #ffaa00 100%)`,
          borderRadius: "3px",
          marginTop: `${height * 0.02}px`,
          marginBottom: `${height * 0.06}px`,
          opacity: generalProgress,
          transform: `scaleX(${generalProgress})`,
          transformOrigin: "center",
        }}
      />

      {/* Aspect-responsive grid: portrait (9:16) → 2 cols, square → 3, landscape → 4.
          Gated on aspect, not absolute px, so a 1080-wide vertical frame doesn't cram 4 columns. */}
      <div
        style={{
          width: "90%",
          maxWidth: "1400px",
          display: "grid",
          gridTemplateColumns: `repeat(${
            width <= height ? 2 : width < height * 1.2 ? 3 : 4
          }, 1fr)`,
          gap: `${Math.round(Math.max(10, width * 0.018))}px`,
          padding: "0 10px",
          opacity: generalProgress,
        }}
      >
        {items.map((item, index) => {
          const cardAnim = getCardAnimation(index);
          return (
            <div
              key={index}
              style={{
                position: "relative",
                aspectRatio: "16/10",
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                borderRadius: `${Math.round(Math.max(8, width * 0.015))}px`,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10%",
                opacity: cardAnim.opacity,
                transform: `translateY(${cardAnim.translateY}px)`,
                transition: "border-color 150ms",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {/* Card Number Badge */}
              <div
                style={{
                  position: "absolute",
                  left: `-${badgeSize * 0.25}px`,
                  top: `-${badgeSize * 0.25}px`,
                  width: `${badgeSize}px`,
                  height: `${badgeSize}px`,
                  borderRadius: "50%",
                  backgroundColor: accent,
                  border: `${Math.round(badgeSize * 0.06)}px solid #ffffff`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                }}
              >
                <span
                  style={{
                    fontSize: `${badgeTextSize}px`,
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1,
                  }}
                >
                  {index + 1}
                </span>
              </div>

              {/* Card Text Content */}
              <p
                style={{
                  fontSize: `${cardTextSize}px`,
                  fontWeight: 700,
                  color: "#0a0a0a",
                  textAlign: "center",
                  lineHeight: 1.35,
                  margin: 0,
                }}
              >
                {item}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
