import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function StackedCardsInteractionTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const spreadDistance = Number(values.spreadDistance ?? 40);
  const rotationAngle = Number(values.rotationAngle ?? 5);

  const card1 = {
    image: String(values.image1 ?? placeholderImage("matfitcrop")),
    title: String(values.title1 ?? "Card 1"),
    description: String(values.description1 ?? "This is the first card"),
  };

  const card2 = {
    image: String(values.image2 ?? placeholderImage("matfitcrop")),
    title: String(values.title2 ?? "Card 2"),
    description: String(values.description2 ?? "This is the second card"),
  };

  const card3 = {
    image: String(values.image3 ?? placeholderImage("matfitcrop")),
    title: String(values.title3 ?? "Card 3"),
    description: String(values.description3 ?? "This is the third card"),
  };

  const bgGradientStart = String(values.bgGradientStart ?? "#374151");
  const bgGradientEnd = String(values.bgGradientEnd ?? "#1f2937");

  // 2. Sizing Constants & Scale Factor
  const scaleFactor = Math.min(width, height) / 1080;
  const resolvedW = 350 * scaleFactor * 1.5; // Scaled up for 1080p presentation
  const resolvedH = 400 * scaleFactor * 1.5;

  const cards = useMemo(() => [card1, card2, card3], [card1, card2, card3]);

  // 3. Cyclic Sine Wave playhead multiplier
  // Ranges smoothly 0 -> 1 -> 0 as progress goes 0 -> 1
  const cycleVal = Math.sin(progress * Math.PI);

  const resolvedSpread = spreadDistance * scaleFactor * 2.0 * cycleVal;
  const resolvedRot = rotationAngle * cycleVal;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(to bottom right, ${bgGradientStart}, ${bgGradientEnd})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: "absolute",
          width: `${600 * scaleFactor}px`,
          height: `${600 * scaleFactor}px`,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
          pointerEvents: "none",
          transform: "translate3d(0, 0, 0)",
        }}
      />

      {/* Main Deck Container */}
      <div
        style={{
          position: "relative",
          width: `${resolvedW}px`,
          height: `${resolvedH}px`,
          perspective: "1000px",
        }}
      >
        {cards.map((card, index) => {
          const isFirst = index === 0;

          // Compute offsets
          let xOffset = 0;
          let rot = 0;
          let scaleVal = 1.0;
          let yOffset = 0;

          if (index === 1) {
            // Left Card
            xOffset = -resolvedSpread;
            rot = -resolvedRot;
            scaleVal = 0.98 + (1 - cycleVal) * 0.01;
            yOffset = index * 4 * scaleFactor * (1 - cycleVal);
          } else if (index === 2) {
            // Right Card
            xOffset = resolvedSpread;
            rot = resolvedRot;
            scaleVal = 0.96 + (1 - cycleVal) * 0.02;
            yOffset = index * 8 * scaleFactor * (1 - cycleVal);
          }

          const cardZIndex = isFirst ? 10 : 5 - index;

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: cardZIndex,
                transform: `translate3d(${xOffset}px, ${yOffset}px, 0) rotateZ(${rot}deg) scale(${scaleVal})`,
                transition: "transform 0.05s linear",
                backgroundColor: "#ffffff",
                borderRadius: `${20 * scaleFactor}px`,
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: isFirst 
                  ? "0 20px 40px rgba(0,0,0,0.22)" 
                  : "0 10px 25px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                padding: `${12 * scaleFactor}px`,
              }}
            >
              {/* Card Image */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "70%",
                  borderRadius: `${14 * scaleFactor}px`,
                  overflow: "hidden",
                  backgroundColor: "#e5e7eb",
                }}
              >
                <img
                  src={card.image}
                  alt={card.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Card Metadata */}
              <div
                style={{
                  padding: `${14 * scaleFactor}px ${6 * scaleFactor}px`,
                  display: "flex",
                  flexDirection: "column",
                  gap: `${6 * scaleFactor}px`,
                }}
              >
                <h3
                  style={{
                    fontSize: `${22 * scaleFactor}px`,
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: `${14 * scaleFactor}px`,
                    color: "#6b7280",
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
