import type { HtmlTemplateProps } from "../types";

export function StatCalloutTemplate({ progress, values, width, height }: HtmlTemplateProps) {
  const number = String(values.number ?? "3.");
  const caption = String(values.caption ?? "why your voice sounds");
  const highlight = String(values.highlight ?? "shaky");
  const accent = String(values.accent ?? "#c0203a");
  const bgOpacity = Number(values.bgOpacity ?? 0.9);

  // Responsive sizing
  const numberSize = Math.round(Math.max(48, Math.min(130, width * 0.12)));
  const captionSize = Math.round(Math.max(14, Math.min(38, width * 0.035)));
  const arcSize = Math.round(Math.max(200, Math.min(800, width * 0.6)));

  const isEntering = progress < 0.15;
  const isExiting = progress > 0.85;

  const entryProgress = isEntering ? progress / 0.15 : 1;
  const exitProgress = isExiting ? (1 - progress) / 0.15 : 1;
  const animationProgress = Math.min(entryProgress, exitProgress);

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const easedVal = easeOut(animationProgress);

  // Scale and opacity
  const numberScale = isEntering ? 0.4 + easedVal * 0.6 : 1;
  const textTranslateY = (1 - easedVal) * 40;
  const opacity = easedVal;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Courier New', Courier, monospace",
        userSelect: "none",
        background: `radial-gradient(circle, rgba(255, 255, 255, ${bgOpacity * opacity}) 0%, rgba(213, 213, 213, ${bgOpacity * opacity}) 100%)`,
        overflow: "hidden",
      }}
    >
      {/* Decorative Left Arc Outline */}
      <div
        style={{
          position: "absolute",
          left: `-${arcSize * 0.4}px`,
          top: "50%",
          transform: "translateY(-50%)",
          width: `${arcSize}px`,
          height: `${arcSize}px`,
          borderRadius: "50%",
          border: `3px solid rgba(26, 26, 26, ${0.15 * opacity})`,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Node 1 */}
        <div
          style={{
            position: "absolute",
            right: `${arcSize * 0.08}px`,
            top: `${arcSize * 0.2}px`,
            width: `${Math.max(10, arcSize * 0.04)}px`,
            height: `${Math.max(10, arcSize * 0.04)}px`,
            borderRadius: "50%",
            backgroundColor: `rgba(26, 26, 26, ${0.8 * opacity})`,
          }}
        />
        {/* Node 2 */}
        <div
          style={{
            position: "absolute",
            right: `${arcSize * 0.15}px`,
            bottom: `${arcSize * 0.25}px`,
            width: `${Math.max(10, arcSize * 0.04)}px`,
            height: `${Math.max(10, arcSize * 0.04)}px`,
            borderRadius: "50%",
            backgroundColor: `rgba(26, 26, 26, ${0.8 * opacity})`,
          }}
        />
      </div>

      {/* Decorative Right Arc Outline */}
      <div
        style={{
          position: "absolute",
          right: `-${arcSize * 0.4}px`,
          top: "50%",
          transform: "translateY(-50%)",
          width: `${arcSize}px`,
          height: `${arcSize}px`,
          borderRadius: "50%",
          border: `3px solid rgba(26, 26, 26, ${0.15 * opacity})`,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Node 1 */}
        <div
          style={{
            position: "absolute",
            left: `${arcSize * 0.08}px`,
            top: `${arcSize * 0.25}px`,
            width: `${Math.max(10, arcSize * 0.04)}px`,
            height: `${Math.max(10, arcSize * 0.04)}px`,
            borderRadius: "50%",
            backgroundColor: `rgba(26, 26, 26, ${0.8 * opacity})`,
          }}
        />
        {/* Node 2 */}
        <div
          style={{
            position: "absolute",
            left: `${arcSize * 0.15}px`,
            bottom: `${arcSize * 0.3}px`,
            width: `${Math.max(10, arcSize * 0.04)}px`,
            height: `${Math.max(10, arcSize * 0.04)}px`,
            borderRadius: "50%",
            backgroundColor: `rgba(26, 26, 26, ${0.8 * opacity})`,
          }}
        />
      </div>

      {/* Central Content Column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
        {/* Stat Number */}
        <span
          style={{
            fontSize: `${numberSize}px`,
            fontWeight: 900,
            color: accent,
            lineHeight: 1,
            transform: `scale(${numberScale})`,
            opacity: opacity,
            transition: "transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            marginBottom: `${height * 0.04}px`,
          }}
        >
          {number}
        </span>

        {/* Caption & Highlight Container */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            columnGap: "0.25em",
            rowGap: "0.2em",
            fontSize: `${captionSize}px`,
            fontWeight: 700,
            color: "#1a1a1a",
            textAlign: "center",
            padding: "0 20px",
            transform: `translateY(${textTranslateY}px)`,
            opacity: opacity,
          }}
        >
          <span>{caption}</span>
          <span style={{ color: accent }}>{highlight}</span>
        </div>
      </div>
    </div>
  );
}
