import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import type { HtmlTemplateProps } from "../types";

export function DisplayCardsTemplate({ progress, time, width, values }: HtmlTemplateProps) {
  // Read customizable values
  const accentColor = String(values.accentColor ?? "#3b82f6");
  
  const cardsData = useMemo(() => [
    {
      title: String(values.title1 ?? "Featured"),
      description: String(values.desc1 ?? "Discover amazing content"),
      date: String(values.date1 ?? "Just now"),
    },
    {
      title: String(values.title2 ?? "Popular"),
      description: String(values.desc2 ?? "Trending this week"),
      date: String(values.date2 ?? "2 days ago"),
    },
    {
      title: String(values.title3 ?? "New"),
      description: String(values.desc3 ?? "Latest updates and features"),
      date: String(values.date3 ?? "Today"),
    },
  ], [values]);

  // Responsive scaling
  const scaleFactor = width / 1920;
  const cardW = Math.round(Math.max(180, 352 * Math.max(0.3, scaleFactor)));
  const cardH = Math.round(Math.max(80, 144 * Math.max(0.3, scaleFactor)));

  // Dynamic layout offsets based on card size
  const offsetXMultiplier = cardW * 0.18;
  const offsetYMultiplier = cardH * 0.28;

  // Staggered entrance helper (0 -> 1)
  const getCardTransform = (index: number) => {
    // Phase 1: Staggered Fade-in & Position Entrance (progress 0.0 -> 0.5)
    const entranceStart = index * 0.1;
    const entranceEnd = entranceStart + 0.25;
    const entranceProgress = Math.max(0, Math.min(1, (progress - entranceStart) / (entranceEnd - entranceStart)));
    
    // Ease-out cubic for entrance
    const easeEntrance = 1 - Math.pow(1 - entranceProgress, 3);
    
    // Base target positions (relative stack layout)
    const targetX = index * offsetXMultiplier;
    const targetY = index * offsetYMultiplier;

    // Slide up from +150px
    const initialYOffset = 150 * (1 - easeEntrance);
    const opacity = easeEntrance;

    // Phase 2: Staggered "Hover" reveals (progress 0.5 -> 0.95)
    let hoverYOffset = 0;
    let hoverScale = 1;
    let grayscale = 100; // grayscale by default

    // Determine hover state based on progress ranges
    if (progress >= 0.5) {
      if (index === 0) {
        // Card 1 hover: progress 0.5 -> 0.65
        const p = Math.max(0, Math.min(1, (progress - 0.5) / 0.15));
        const hoverT = Math.sin(p * Math.PI); // goes 0 -> 1 -> 0
        hoverYOffset = -40 * hoverT;
        hoverScale = 1 + 0.04 * hoverT;
        grayscale = Math.round(100 * (1 - hoverT));
      } else if (index === 1) {
        // Card 2 hover: progress 0.65 -> 0.8
        const p = Math.max(0, Math.min(1, (progress - 0.65) / 0.15));
        const hoverT = Math.sin(p * Math.PI);
        hoverYOffset = -30 * hoverT;
        hoverScale = 1 + 0.04 * hoverT;
        grayscale = Math.round(100 * (1 - hoverT));
      } else if (index === 2) {
        // Card 3 hover: progress 0.8 -> 0.95
        const p = Math.max(0, Math.min(1, (progress - 0.8) / 0.15));
        const hoverT = Math.sin(p * Math.PI);
        hoverYOffset = -20 * hoverT;
        hoverScale = 1 + 0.04 * hoverT;
        grayscale = Math.round(100 * (1 - hoverT));
      }
    }

    // Phase 3: Ambient floating motion (adds lifelike sway over timeline time)
    const floatAmplitude = 4 * Math.max(0.3, scaleFactor);
    const floatFrequency = 1.8;
    const floatOffset = Math.sin(time * floatFrequency + index * 1.5) * floatAmplitude;

    return {
      x: targetX,
      y: targetY + initialYOffset + hoverYOffset + floatOffset,
      scale: hoverScale,
      opacity,
      grayscale,
      zIndex: 10 + index + (hoverScale > 1 ? 5 : 0),
    };
  };

  // Font responsiveness
  const titleFontSize = Math.max(11, Math.round(18 * Math.max(0.4, scaleFactor)));
  const descFontSize = Math.max(11, Math.round(18 * Math.max(0.4, scaleFactor)));
  const dateFontSize = Math.max(9, Math.round(14 * Math.max(0.4, scaleFactor)));
  const iconPadding = Math.max(2, Math.round(4 * Math.max(0.4, scaleFactor)));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          position: "relative",
          width: `${cardW + 2.5 * offsetXMultiplier}px`,
          height: `${cardH + 2.5 * offsetYMultiplier}px`,
          perspective: "1000px",
        }}
      >
        {cardsData.map((card, idx) => {
          const styleState = getCardTransform(idx);
          if (styleState.opacity <= 0.01) return null;

          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: `${cardW}px`,
                height: `${cardH}px`,
                transform: `translate3d(${styleState.x}px, ${styleState.y}px, 0) scale(${styleState.scale}) skewY(-8deg)`,
                opacity: styleState.opacity,
                filter: `grayscale(${styleState.grayscale}%)`,
                zIndex: styleState.zIndex,
                transition: "filter 0.3s ease",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Card Container */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: "100%",
                  height: "100%",
                  borderRadius: "12px",
                  border: "2px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "rgba(30, 30, 30, 0.75)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  padding: `${Math.round(12 * Math.max(0.5, scaleFactor))}px ${Math.round(16 * Math.max(0.5, scaleFactor))}px`,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
                  overflow: "hidden",
                }}
              >
                {/* Subtle right-to-left ambient background overlay gradient */}
                <div
                  style={{
                    position: "absolute",
                    right: "-4px",
                    top: "-5%",
                    height: "110%",
                    width: "80%",
                    background: "linear-gradient(to left, rgba(0,0,0,0.15), transparent)",
                    pointerEvents: "none",
                  }}
                />

                {/* Top row: Icon + Title */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: `${Math.round(8 * Math.max(0.5, scaleFactor))}px`,
                  }}
                >
                  <span
                    style={{
                      position: "relative",
                      display: "inline-flex",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(30, 58, 138, 0.9)", // bg-blue-900
                      padding: `${iconPadding}px`,
                    }}
                  >
                    <Sparkles
                      style={{
                        width: `${Math.max(10, Math.round(16 * Math.max(0.4, scaleFactor)))}px`,
                        height: `${Math.max(10, Math.round(16 * Math.max(0.4, scaleFactor)))}px`,
                        color: accentColor,
                      }}
                    />
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: `${titleFontSize}px`,
                      fontWeight: 500,
                      color: accentColor,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {card.title}
                  </p>
                </div>

                {/* Middle row: Description */}
                <p
                  style={{
                    margin: 0,
                    fontSize: `${descFontSize}px`,
                    color: "#ffffff",
                    fontFamily: "Inter, sans-serif",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {card.description}
                </p>

                {/* Bottom row: Date */}
                <p
                  style={{
                    margin: 0,
                    fontSize: `${dateFontSize}px`,
                    color: "rgba(255, 255, 255, 0.4)", // text-muted-foreground
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {card.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
