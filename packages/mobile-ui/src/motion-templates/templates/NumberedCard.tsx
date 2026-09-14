import type { HtmlTemplateProps } from "../types";

export function NumberedCardTemplate({ progress, values, width, height }: HtmlTemplateProps) {
  const title = String(values.title ?? "HACK NO. 1").toUpperCase();
  const cardText = String(values.cardText ?? "Your tip goes here");
  const number = String(values.number ?? "1");
  const accent = String(values.accent ?? "#e5484d");
  const bgOpacity = Number(values.bgOpacity ?? 0.95);

  // Responsive sizing based on container width
  const titleSize = Math.round(Math.max(24, Math.min(64, width * 0.06)));
  const cardTextSize = Math.round(Math.max(14, Math.min(30, width * 0.03)));
  const badgeSize = Math.round(Math.max(45, Math.min(90, width * 0.09)));
  const badgeTextSize = Math.round(Math.max(20, Math.min(40, width * 0.04)));
  const cardWidth = Math.round(Math.max(300, Math.min(760, width * 0.75)));
  const cardHeight = Math.round(Math.max(120, Math.min(280, height * 0.4)));

  // Progress-based animations (0.0 -> 1.0 duration)
  // 1. Entrance phase (0.0 -> 0.15)
  // 2. Steady state (0.15 -> 0.85)
  // 3. Exit phase (0.85 -> 1.0)
  const isEntering = progress < 0.15;
  const isExiting = progress > 0.85;

  const entryProgress = isEntering ? progress / 0.15 : 1;
  const exitProgress = isExiting ? (1 - progress) / 0.15 : 1;
  const animationProgress = Math.min(entryProgress, exitProgress);

  // Easing function (cubic-out)
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const easedVal = easeOut(animationProgress);

  // Layout transform values
  const titleTranslateY = (1 - easedVal) * -60;
  const cardTranslateY = (1 - easedVal) * 80;
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
        fontFamily: "Inter, sans-serif",
        userSelect: "none",
        backgroundColor: `rgba(8, 8, 8, ${bgOpacity * opacity})`,
        transition: "background-color 150ms linear",
        overflow: "hidden",
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontSize: `${titleSize}px`,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "0.08em",
          lineHeight: 1,
          transform: `translateY(${titleTranslateY}px)`,
          opacity: opacity,
          marginBottom: `${height * 0.05}px`,
          textAlign: "center",
        }}
      >
        {title}
      </h2>

      {/* Main Tip Card Container */}
      <div
        style={{
          position: "relative",
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderRadius: `${badgeSize * 0.3}px`,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${cardWidth * 0.1}px`,
          transform: `translateY(${cardTranslateY}px)`,
          opacity: opacity,
        }}
      >
        {/* Card Text */}
        <p
          style={{
            fontSize: `${cardTextSize}px`,
            fontWeight: 700,
            color: "#0a0a0a",
            textAlign: "center",
            lineHeight: 1.45,
            margin: 0,
          }}
        >
          {cardText}
        </p>

        {/* Badge (Circular number on top-left of the card) */}
        <div
          style={{
            position: "absolute",
            left: `-${badgeSize * 0.35}px`,
            top: `-${badgeSize * 0.35}px`,
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            borderRadius: "50%",
            backgroundColor: accent,
            border: `${Math.round(badgeSize * 0.05)}px solid #ffffff`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            animation: progress > 0 && progress < 0.95 ? "cfPulse 2s infinite" : "none",
            transform: `scale(${isEntering ? 0.5 + easedVal * 0.5 : 1})`,
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
            {number}
          </span>
        </div>

        {/* CSS Keyframes for pulse animation if missing */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes cfPulse {
            0% { transform: scale(1); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
            50% { transform: scale(1.05); box-shadow: 0 12px 30px rgba(0,0,0,0.25); }
            100% { transform: scale(1); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
          }
        `}} />
      </div>

      {/* Dashed Connector Line */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `calc(50% + ${cardWidth / 2}px)`,
          width: "25%",
          height: "2px",
          borderTop: `2px dashed rgba(255, 255, 255, ${0.6 * opacity})`,
          transform: "translateY(55px)",
          opacity: opacity,
        }}
      />
    </div>
  );
}
