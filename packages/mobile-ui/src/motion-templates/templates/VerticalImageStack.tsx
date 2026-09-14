import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

// Linear interpolation helper
function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

// Stepped-and-smooth index transition function
function getSmoothActiveIndex(progress: number, total: number) {
  const rawVal = progress * total; // 0 to total
  const index = Math.floor(rawVal);
  const fract = rawVal - index;
  
  // Snippy transition window (e.g., last 30% of each card's duration)
  const transitionStart = 0.7;
  let smoothVal = index;
  if (fract > transitionStart) {
    const t = (fract - transitionStart) / (1 - transitionStart);
    // Cubic ease-in-out curves
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    smoothVal = index + easedT;
  }
  return smoothVal % total;
}

export function VerticalImageStackTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // Parse editable values
  const accent = String(values.accent ?? "#ffffff");
  
  const images = useMemo(() => [
    {
      id: 1,
      src: String(values.image1 ?? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/luxury-black-sneaker-with-red-sole-on-grey-backgro-hj40sZT8MUUSeLz18VN7EjhcnV0kSD.jpg"),
      alt: String(values.caption1 ?? "Black sneaker with red sole"),
    },
    {
      id: 2,
      src: String(values.image2 ?? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/white-minimalist-sneaker-on-light-background-xQxkXgGrSrAe6pvLPNC6yrh20Atqoa.jpg"),
      alt: String(values.caption2 ?? "White minimalist sneaker"),
    },
    {
      id: 3,
      src: String(values.image3 ?? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/navy-blue-running-shoe-on-gradient-background-E1spqSK9gDvh3gTNwASkttEg76nZgm.jpg"),
      alt: String(values.caption3 ?? "Navy blue running shoe"),
    },
    {
      id: 4,
      src: String(values.image4 ?? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/red-athletic-sneaker-on-dark-background-skamDX1NbCRW4jvHxijkfmCnHGr6NJ.jpg"),
      alt: String(values.caption4 ?? "Red athletic sneaker"),
    },
    {
      id: 5,
      src: String(values.image5 ?? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/green-forest-hiking-boot-on-natural-background-T41PNLzI60G2u6rFIRxeCbKT6RWKOH.jpg"),
      alt: String(values.caption5 ?? "Green hiking boot"),
    },
  ], [values]);

  const total = images.length;
  const activeIndex = getSmoothActiveIndex(progress, total);
  const currentIntIndex = Math.floor(progress * total) % total;

  // Responsive card dimensions maintaining 2:3 aspect ratio
  const cardHeight = Math.round(Math.max(160, Math.min(420, height * 0.65)));
  const cardWidth = Math.round(cardHeight * (280 / 420));

  // Ambient variables
  const titleSize = Math.round(Math.max(10, Math.min(18, width * 0.018)));
  const countSize = Math.round(Math.max(18, Math.min(36, width * 0.035)));
  const indicatorGap = Math.round(Math.max(6, Math.min(12, height * 0.02)));

  const getCardStyle = (index: number) => {
    let diff = index - activeIndex;
    
    // Wrap around for looping stack
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    // Interpolation boundaries
    const d0 = Math.floor(diff);
    const d1 = Math.ceil(diff);
    const t = diff - d0;

    const getProperties = (d: number) => {
      // Return absolute coordinates at standard offsets
      if (d === 0) return { y: 0, scale: 1.0, opacity: 1.0, zIndex: 5, rotateX: 0 };
      if (d === -1) return { y: -cardHeight * 0.38, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: 8 };
      if (d === -2) return { y: -cardHeight * 0.66, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: 15 };
      if (d === 1) return { y: cardHeight * 0.38, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: -8 };
      if (d === 2) return { y: cardHeight * 0.66, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: -15 };
      if (d < -2) return { y: -cardHeight * 0.95, scale: 0.6, opacity: 0, zIndex: 0, rotateX: 20 };
      return { y: cardHeight * 0.95, scale: 0.6, opacity: 0, zIndex: 0, rotateX: -20 };
    };

    const p0 = getProperties(d0);
    const p1 = getProperties(d1);

    return {
      y: lerp(p0.y, p1.y, t),
      scale: lerp(p0.scale, p1.scale, t),
      opacity: lerp(p0.opacity, p1.opacity, t),
      rotateX: lerp(p0.rotateX, p1.rotateX, t),
      zIndex: t < 0.5 ? p0.zIndex : p1.zIndex,
    };
  };

  const isVisible = (index: number) => {
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return Math.abs(diff) <= 2.2;
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
        fontFamily: "Inter, sans-serif",
        userSelect: "none",
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "60%",
          height: "60%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 70%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />

      {/* 3D Stack container */}
      <div
        style={{
          position: "relative",
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: "1200px",
        }}
      >
        {images.map((image, index) => {
          if (!isVisible(index)) return null;
          const style = getCardStyle(index);

          return (
            <div
              key={image.id}
              style={{
                position: "absolute",
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                opacity: style.opacity,
                transform: `translateY(${style.y}px) scale(${style.scale}) rotateX(${style.rotateX}deg)`,
                transformStyle: "preserve-3d",
                zIndex: style.zIndex,
                transition: "none",
              }}
            >
              {/* Card Body */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  borderRadius: "24px",
                  overflow: "hidden",
                  backgroundColor: "#18181b",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  boxShadow: index === currentIntIndex
                    ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    : "0 10px 30px -10px rgba(0, 0, 0, 0.3)",
                }}
              >
                {/* Image element */}
                <img
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  draggable={false}
                />

                {/* Ambient Top Glow Overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: "0",
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(0, 0, 0, 0) 50%)",
                  }}
                />

                {/* Bottom Shadow Overlay */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: "0",
                    height: "40%",
                    background: "linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 100%)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Indicators */}
      <div
        style={{
          position: "absolute",
          right: `${width * 0.06}px`,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: `${indicatorGap}px`,
        }}
      >
        {images.map((_, index) => {
          const isActive = index === currentIntIndex;
          return (
            <div
              key={index}
              style={{
                width: "8px",
                height: isActive ? "24px" : "8px",
                borderRadius: "999px",
                backgroundColor: isActive ? accent : "rgba(255, 255, 255, 0.25)",
                transition: "height 300ms cubic-bezier(0.4, 0, 0.2, 1), background-color 300ms",
              }}
            />
          );
        })}
      </div>

      {/* Numeric Counter */}
      <div
        style={{
          position: "absolute",
          left: `${width * 0.06}px`,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: `${countSize}px`,
            fontWeight: 300,
            color: "#ffffff",
          }}
        >
          {String(currentIntIndex + 1).padStart(2, "0")}
        </span>
        <div
          style={{
            width: "32px",
            height: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            margin: "8px 0",
          }}
        />
        <span
          style={{
            fontSize: `${countSize * 0.4}px`,
            color: "rgba(255, 255, 255, 0.4)",
          }}
        >
          {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* Current Caption Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: `${titleSize}px`,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "#ffffff",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          {images[currentIntIndex]?.alt || ""}
        </span>
      </div>
    </div>
  );
}
