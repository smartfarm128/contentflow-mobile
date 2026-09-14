import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function FeatureHighlightCardTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const imageSrc = String(values.imageSrc ?? placeholderImage("600fitcrop"));
  const title = String(values.title ?? "Perfect Your Timing");
  const description = String(values.description ?? "Utilize advanced technical indicators to pinpoint ideal entry and exit points. Clearly identify overbought and oversold conditions in real-time.");
  const buttonText = String(values.buttonText ?? "Try Now for Free");
  const cycleDuration = Number(values.cycleDuration ?? 6.0);
  const backgroundColor = String(values.backgroundColor ?? "#09090b");
  const cardBg = String(values.cardBg ?? "#18181b");
  const textColor = String(values.textColor ?? "#ffffff");

  const t = time % cycleDuration;
  const activeDuration = cycleDuration - 1.0; // 1s reset/fadeout

  // Global card entry scale & opacity
  let cardOpacity = 1.0;
  if (t > activeDuration) {
    cardOpacity = Math.max(0, 1 - (t - activeDuration) / 0.8);
  }

  // Helper function to calculate stagger progress (0 to 1) for children
  const getProgress = (delay: number, duration: number) => {
    if (t < delay) return 0;
    return Math.min(1, (t - delay) / duration);
  };

  const imgP = getProgress(0.2, 0.8);
  const titleP = getProgress(0.5, 0.6);
  const descP = getProgress(0.7, 0.6);
  const btnP = getProgress(0.9, 0.6);

  const scaleFactor = Math.min(width, height) / 550;
  const cardW = 340 * scaleFactor;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          width: "250px",
          height: "250px",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          backgroundColor: "rgba(99, 102, 241, 0.15)",
          filter: "blur(60px)",
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          width: `${cardW}px`,
          backgroundColor: cardBg,
          color: textColor,
          borderRadius: `${16 * scaleFactor}px`,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: `${28 * scaleFactor}px`,
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          opacity: cardOpacity,
          transform: `scale(${0.95 + 0.05 * imgP})`,
          transition: "transform 0.1s ease-out"
        }}
      >
        {/* Image Container */}
        <div
          style={{
            marginBottom: `${20 * scaleFactor}px`,
            display: "flex",
            justifyContent: "center",
            opacity: imgP,
            transform: `scale(${0.9 + 0.1 * imgP})`,
            transition: "all 0.1s ease-out"
          }}
        >
          <img
            src={imageSrc}
            alt="Feature graphic"
            style={{
              width: "80%",
              height: "auto",
              objectFit: "contain",
              borderRadius: `${8 * scaleFactor}px`
            }}
          />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: `${28 * scaleFactor}px`,
            fontWeight: "bold",
            margin: 0,
            letterSpacing: "-0.02em",
            opacity: titleP,
            transform: `translateY(${(1 - titleP) * 15}px)`,
            transition: "all 0.1s ease-out"
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: `${13 * scaleFactor}px`,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.5,
            marginTop: `${12 * scaleFactor}px`,
            marginBottom: 0,
            opacity: descP,
            transform: `translateY(${(1 - descP) * 15}px)`,
            transition: "all 0.1s ease-out"
          }}
        >
          {description}
        </p>

        {/* Button */}
        <div
          style={{
            marginTop: `${24 * scaleFactor}px`,
            opacity: btnP,
            transform: `translateY(${(1 - btnP) * 15}px)`,
            transition: "all 0.1s ease-out"
          }}
        >
          <button
            style={{
              width: "100%",
              padding: `${12 * scaleFactor}px`,
              borderRadius: `${8 * scaleFactor}px`,
              backgroundColor: "#ffffff",
              color: "#000000",
              fontWeight: 600,
              fontSize: `${13 * scaleFactor}px`,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(255,255,255,0.15)"
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
