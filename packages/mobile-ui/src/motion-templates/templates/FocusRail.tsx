import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

// Linear interpolation helper
function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

// Cubic ease-in-out curve
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Snapping index calculation
function getSmoothActiveIndex(progress: number, total: number) {
  const rawVal = progress * total;
  const index = Math.floor(rawVal);
  const fract = rawVal - index;
  
  // Snap transition window (last 30% of each item's time partition)
  const transitionStart = 0.7;
  let smoothVal = index;
  if (fract > transitionStart) {
    const t = (fract - transitionStart) / (1 - transitionStart);
    const easedT = easeInOutCubic(t);
    smoothVal = index + easedT;
  }
  return smoothVal % total;
}

export function FocusRailTemplate({ progress, time: _time, width, height, values }: HtmlTemplateProps) {
  const accent = String(values.accent ?? "#34d399");

  const items = useMemo(() => [
    {
      id: 1,
      title: String(values.title1 ?? "Neon Tokyo"),
      description: String(values.desc1 ?? "Experience the vibrant nightlife and illuminated streets of Shinjuku."),
      meta: String(values.meta1 ?? "Urban • Travel"),
      imageSrc: String(values.image1 ?? "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop"),
      href: "#tokyo",
    },
    {
      id: 2,
      title: String(values.title2 ?? "Nordic Silence"),
      description: String(values.desc2 ?? "Minimalist architecture meeting the raw beauty of the Icelandic coast."),
      meta: String(values.meta2 ?? "Design • Nature"),
      imageSrc: String(values.image2 ?? "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1000&auto=format&fit=crop"),
      href: "#nordic",
    },
    {
      id: 3,
      title: String(values.title3 ?? "Sahara Echoes"),
      description: String(values.desc3 ?? "Wandering through the timeless dunes under an endless golden sun."),
      meta: String(values.meta3 ?? "Adventure • Heat"),
      imageSrc: String(values.image3 ?? "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000&auto=format&fit=crop"),
      href: "#sahara",
    },
    {
      id: 4,
      title: String(values.title4 ?? "Cyber Future"),
      description: String(values.desc4 ?? "A glimpse into a technological singularity where AI meets humanity."),
      meta: String(values.meta4 ?? "Tech • AI"),
      imageSrc: String(values.image4 ?? "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop"),
      href: "#cyber",
    },
    {
      id: 5,
      title: String(values.title5 ?? "Deep Ocean"),
      description: String(values.desc5 ?? "The crushing pressure and alien beauty of the Mariana Trench."),
      meta: String(values.meta5 ?? "Science • Deep"),
      imageSrc: String(values.image5 ?? "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=1000&auto=format&fit=crop"),
      href: "#ocean",
    },
  ], [values]);

  const total = items.length;
  const activeIndex = getSmoothActiveIndex(progress, total);
  
  // Integer indices for cross-fading text & background
  const currentIntIndex = Math.floor(progress * total) % total;
  const nextIntIndex = (currentIntIndex + 1) % total;
  const localProg = (progress * total) % 1;

  // Compute text crossfade opacity
  let textOpacity = 1;
  const crossFadeWindow = 0.3;
  if (localProg > (1 - crossFadeWindow)) {
    const t = (localProg - (1 - crossFadeWindow)) / crossFadeWindow;
    textOpacity = 1 - easeInOutCubic(t);
  } else if (localProg < crossFadeWindow && progress > 0) {
    const t = localProg / crossFadeWindow;
    textOpacity = easeInOutCubic(t);
  }

  // Active item info
  const activeItem = items[currentIntIndex];

  // Sizing factors
  const scale = width / 1920;
  const cardHeight = Math.max(160, Math.min(360, height * 0.55));
  const cardWidth = cardHeight * (300 / 400);

  // Dynamic values scaled
  const metaSize = Math.max(9, Math.min(13, 13 * scale));
  const titleSize = Math.max(16, Math.min(42, 42 * scale));
  const descSize = Math.max(11, Math.min(16, 16 * scale));
  const countSize = Math.max(10, Math.min(14, 14 * scale));
  const buttonPadding = `${Math.max(6, 12 * scale)}px ${Math.max(12, 24 * scale)}px`;
  const infoHeight = 120 * scale;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        userSelect: "none",
      }}
    >
      {/* Background Ambient Glow (Fading images based on active segment) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {items.map((item, idx) => {
          const isCurrent = idx === currentIntIndex;
          const isNext = idx === nextIntIndex;
          let opacity = 0;
          if (isCurrent) {
            opacity = localProg > (1 - crossFadeWindow) 
              ? lerp(0.4, 0, (localProg - (1 - crossFadeWindow)) / crossFadeWindow)
              : 0.4;
          } else if (isNext) {
            opacity = localProg > (1 - crossFadeWindow)
              ? lerp(0, 0.4, (localProg - (1 - crossFadeWindow)) / crossFadeWindow)
              : 0;
          }

          if (opacity === 0) return null;

          return (
            <div
              key={`bg-${item.id}`}
              style={{
                position: "absolute",
                inset: 0,
                opacity,
                transition: "none",
              }}
            >
              <img
                src={item.imageSrc}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "blur(64px) saturate(2)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, #0a0a0a, rgba(10,10,10,0.5) 50%, #0a0a0a)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Main 3D Stage */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: `0 ${32 * scale}px`,
        }}
      >
        {/* DRAGGABLE RAIL CONTAINER (simulated in template dynamically) */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: `${1152 * scale}px`,
            height: `${cardHeight * 1.1}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            perspective: "1200px",
          }}
        >
          {items.map((item, idx) => {
            let diff = idx - activeIndex;

            // Handle wrapping
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            const dist = Math.abs(diff);

            // Clip non-visible cards to save render complexity
            if (dist > 2.2) return null;

            // Calculate continuous transform offsets
            const xOffset = diff * 320 * scale;
            const zOffset = -dist * 180 * scale;
            const rotateY = diff * -20;
            const cardScale = lerp(0.85, 1.0, Math.max(0, 1 - dist));
            
            const opacity = lerp(0.1, 1.0, Math.max(0, 1 - dist * 0.5));
            const blur = dist * 6;
            const brightness = lerp(0.5, 1.0, Math.max(0, 1 - dist));

            return (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  opacity,
                  transform: `translate3d(${xOffset}px, 0px, ${zOffset}px) scale(${cardScale}) rotateY(${rotateY}deg)`,
                  transformStyle: "preserve-3d",
                  zIndex: idx === currentIntIndex ? 20 : 10,
                  transition: "none",
                  borderRadius: `${16 * scale}px`,
                  borderTop: `${1 * scale}px solid rgba(255,255,255,0.2)`,
                  backgroundColor: "#171717",
                  boxShadow: idx === currentIntIndex 
                    ? `0 ${25 * scale}px ${50 * scale}px ${-12 * scale}px rgba(255, 255, 255, 0.1)`
                    : `0 ${10 * scale}px ${30 * scale}px ${-10 * scale}px rgba(0, 0, 0, 0.5)`,
                  overflow: "hidden",
                }}
              >
                <img
                  src={item.imageSrc}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: `blur(${blur}px) brightness(${brightness})`,
                  }}
                  draggable={false}
                />
                
                {/* Lighting layers */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 100%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.1)",
                    pointerEvents: "none",
                    mixBlendMode: "multiply",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Info & Controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: `${896 * scale}px`,
            marginTop: `${48 * scale}px`,
            gap: `${24 * scale}px`,
          }}
        >
          {/* Details Column */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: `${infoHeight}px`,
              opacity: textOpacity,
              transition: "none",
            }}
          >
            {activeItem.meta && (
              <span
                style={{
                  fontSize: `${metaSize}px`,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: accent,
                  marginBottom: `${6 * scale}px`,
                }}
              >
                {activeItem.meta}
              </span>
            )}
            <h2
              style={{
                fontSize: `${titleSize}px`,
                fontWeight: "bold",
                letterSpacing: "-0.02em",
                color: "#ffffff",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {activeItem.title}
            </h2>
            {activeItem.description && (
              <p
                style={{
                  fontSize: `${descSize}px`,
                  color: "#a3a3a3",
                  margin: `${8 * scale}px 0 0 0`,
                  lineHeight: 1.4,
                  maxWidth: `${448 * scale}px`,
                }}
              >
                {activeItem.description}
              </p>
            )}
          </div>

          {/* Navigation Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: `${16 * scale}px`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: `${4 * scale}px`,
                backgroundColor: "rgba(23,23,23,0.8)",
                padding: `${4 * scale}px`,
                borderRadius: "999px",
                border: `${1 * scale}px solid rgba(255,255,255,0.1)`,
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Previous Button Graphic */}
              <div
                style={{
                  padding: `${12 * scale}px`,
                  color: "#737373",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width={20 * scale}
                  height={20 * scale}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </div>

              {/* Slide Counter */}
              <span
                style={{
                  minWidth: `${40 * scale}px`,
                  textAlign: "center",
                  fontSize: `${countSize}px`,
                  fontFamily: "monospace",
                  color: "#525252",
                }}
              >
                {currentIntIndex + 1} / {total}
              </span>

              {/* Next Button Graphic */}
              <div
                style={{
                  padding: `${12 * scale}px`,
                  color: "#737373",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width={20 * scale}
                  height={20 * scale}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </div>

            {/* Explore Button */}
            {activeItem.href && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${8 * scale}px`,
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  padding: buttonPadding,
                  borderRadius: "999px",
                  fontSize: `${metaSize}px`,
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                Explore
                <svg
                  width={14 * scale}
                  height={14 * scale}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 7h10v10" />
                  <path d="M7 17 17 7" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
