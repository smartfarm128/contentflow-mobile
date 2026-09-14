import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function Card26Template({ time, width, height, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "LinkedIn");
  const description = String(values.description ?? "I am not posting that often on LinkedIn, but hey, let's connect.");
  const imageUrl = String(values.imageUrl ?? placeholderImage("300fitcrop"));
  
  const cycleDuration = Number(values.cycleDuration ?? 4.0);
  const backgroundColor = String(values.backgroundColor ?? "#09090b");
  const cardBg = String(values.cardBg ?? "#18181b");
  const textColor = String(values.textColor ?? "#f4f4f5");

  const t = time % cycleDuration;
  
  // Calculate smooth loop progress (0 -> 1 -> 0)
  const hoverProgress = 0.5 - 0.5 * Math.cos((t * Math.PI * 2) / cycleDuration);

  const cardScale = 1.0 + 0.03 * hoverProgress;
  const cardY = -5 * hoverProgress;
  const imageScale = 1.0 + 0.1 * hoverProgress;

  const scaleFactor = Math.min(width, height) / 450;
  const cardW = 320 * scaleFactor;
  const cardH = 320 * scaleFactor;

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
      <div
        style={{
          width: `${cardW}px`,
          height: `${cardH}px`,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: `${24 * scaleFactor}px`,
          backgroundColor: cardBg,
          color: textColor,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: `${16 * scaleFactor}px`,
          boxShadow: `0 20px 40px -10px rgba(0,0,0,0.5)`,
          transform: `translateY(${cardY}px) scale(${cardScale})`,
          overflow: "hidden"
        }}
      >
        {/* Text Area */}
        <div style={{ zIndex: 5 }}>
          <h3
            style={{
              fontSize: `${28 * scaleFactor}px`,
              fontWeight: 500,
              fontFamily: "Playfair Display, Georgia, serif",
              margin: 0,
              marginBottom: `${8 * scaleFactor}px`,
              letterSpacing: "-0.01em"
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: `${13 * scaleFactor}px`,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: "80%"
            }}
          >
            {description}
          </p>
        </div>

        {/* Floating/Scaling Graphic Image */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: `${192 * scaleFactor}px`,
            height: `${192 * scaleFactor}px`,
            transform: "translate(25%, 25%)",
            pointerEvents: "none"
          }}
        >
          <img
            src={imageUrl}
            alt={`${title} illustration`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: `scale(${imageScale})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
