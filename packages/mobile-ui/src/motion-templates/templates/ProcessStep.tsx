import type { HtmlTemplateProps } from "../types";

export function ProcessStepTemplate({ progress, values, width }: HtmlTemplateProps) {
  const number = String(values.number ?? "1");
  const label = String(values.label ?? "Step one");
  const accent = String(values.accent ?? "#f5a623");
  const bgOpacity = Number(values.bgOpacity ?? 0.9);

  // Responsive sizes
  const badgeSize = Math.round(Math.max(60, Math.min(140, width * 0.12)));
  const numberSize = Math.round(Math.max(24, Math.min(56, width * 0.05)));
  const labelSize = Math.round(Math.max(16, Math.min(40, width * 0.038)));
  const lineWidth = Math.round(Math.max(50, Math.min(160, width * 0.15)));
  const layoutGap = Math.round(Math.max(10, Math.min(30, width * 0.025)));

  const isEntering = progress < 0.15;
  const isExiting = progress > 0.85;

  const entryProgress = isEntering ? progress / 0.15 : 1;
  const exitProgress = isExiting ? (1 - progress) / 0.15 : 1;
  const animationProgress = Math.min(entryProgress, exitProgress);

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const easedVal = easeOut(animationProgress);

  const slideX = (1 - easedVal) * -40;
  const opacity = easedVal;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        userSelect: "none",
        backgroundColor: `rgba(8, 8, 8, ${bgOpacity * opacity})`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${layoutGap}px`,
          transform: `translateX(${slideX}px)`,
          opacity: opacity,
        }}
      >
        {/* Step Circular Badge */}
        <div
          style={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            borderRadius: "50%",
            backgroundColor: "rgba(20, 20, 20, 0.95)",
            border: `${Math.round(badgeSize * 0.045)}px solid ${accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 10px 30px rgba(0,0,0,0.25), 0 0 15px ${accent}22`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: `${numberSize}px`,
              fontWeight: 900,
              color: accent,
              lineHeight: 1,
            }}
          >
            {number}
          </span>
        </div>

        {/* Horizontal Connector Line */}
        <div
          style={{
            width: `${lineWidth}px`,
            height: "4px",
            backgroundColor: `rgba(255, 255, 255, ${0.5 * opacity})`,
            borderRadius: "2px",
            flexShrink: 0,
            transform: `scaleX(${easedVal})`,
            transformOrigin: "left",
          }}
        />

        {/* Label Text */}
        <span
          style={{
            fontSize: `${labelSize}px`,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.1,
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
