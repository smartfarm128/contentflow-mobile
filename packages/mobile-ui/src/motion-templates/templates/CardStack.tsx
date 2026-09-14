import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

function continuousOffset(i: number, virtualActive: number, len: number, loop: boolean) {
  let off = i - virtualActive;
  if (loop && len > 1) {
    const half = len / 2;
    while (off > half) off -= len;
    while (off < -half) off += len;
  }
  return off;
}

export function CardStackTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const card1_title = String(values.card1_title ?? "Luxury Performance");
  const card1_desc = String(values.card1_desc ?? "Experience the thrill of precision engineering");
  const card1_image = String(values.card1_image ?? "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=600");

  const card2_title = String(values.card2_title ?? "Elegant Design");
  const card2_desc = String(values.card2_desc ?? "Where beauty meets functionality");
  const card2_image = String(values.card2_image ?? "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600");

  const card3_title = String(values.card3_title ?? "Power & Speed");
  const card3_desc = String(values.card3_desc ?? "Unleash the true potential of the road");
  const card3_image = String(values.card3_image ?? "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600");

  const card4_title = String(values.card4_title ?? "Timeless Craftsmanship");
  const card4_desc = String(values.card4_desc ?? "Built with passion, driven by excellence");
  const card4_image = String(values.card4_image ?? "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=600");

  const card5_title = String(values.card5_title ?? "Future of Mobility");
  const card5_desc = String(values.card5_desc ?? "Innovation that moves you forward");
  const card5_image = String(values.card5_image ?? "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600");

  const items = useMemo(() => [
    { title: card1_title, desc: card1_desc, image: card1_image },
    { title: card2_title, desc: card2_desc, image: card2_image },
    { title: card3_title, desc: card3_desc, image: card3_image },
    { title: card4_title, desc: card4_desc, image: card4_image },
    { title: card5_title, desc: card5_desc, image: card5_image },
  ], [
    card1_title, card1_desc, card1_image,
    card2_title, card2_desc, card2_image,
    card3_title, card3_desc, card3_image,
    card4_title, card4_desc, card4_image,
    card5_title, card5_desc, card5_image,
  ]);

  const len = items.length;
  const loop = true;
  const maxVisible = 5;
  const maxOffset = Math.floor(maxVisible / 2);

  // Design scale factor relative to 1080p
  const scale = Math.min(width, height) / 1080;
  const cardWidth = Math.max(160, Math.round(520 * scale));
  const cardHeight = Math.max(100, Math.round(320 * scale));
  const overlap = 0.48;
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const spreadDeg = 48;
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;
  const depthPx = 140 * scale;
  const tiltXDeg = 12;
  const activeLiftPx = 22 * scale;
  const activeScale = 1.03;
  const inactiveScale = 0.94;

  // Derive continuous virtual active index from progress
  const virtualActive = progress * (len - 1);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0d0d11",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Background spotlights */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70%",
          height: "30%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Cards container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: `${cardHeight + 100}px`,
          display: "flex",
          alignItems: "end",
          justifyContent: "center",
          perspective: `${1100 * scale}px`,
        }}
      >
        {items.map((item, i) => {
          const off = continuousOffset(i, virtualActive, len, loop);
          const abs = Math.abs(off);
          
          // Only show cards within visible bounds
          if (abs > maxOffset + 0.8) return null;

          // Fan geometry
          const rotateZ = off * stepDeg;
          const x = off * cardSpacing;
          const y = abs * 10 * scale; // subtle arc-down
          const z = -abs * depthPx;

          // Interpolate active-state metrics (scale, lift, rotateX) based on absolute offset
          const tActive = Math.max(0, 1 - abs); // 1 = fully active, 0 = completely inactive
          const currentScale = inactiveScale + (activeScale - inactiveScale) * tActive;
          const lift = -activeLiftPx * tActive;
          const rotateX = tiltXDeg * (1 - tActive);

          // Calculate opacity to fade out outer cards smoothly
          const opacity = Math.min(1, Math.max(0, 1 - (abs - maxOffset) / 0.8));

          // Draw active card on top
          const zIndex = Math.round(100 - abs * 10);

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                bottom: 0,
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                zIndex,
                transform: `translateX(${x}px) translateY(${y + lift}px) rotateZ(${rotateZ}deg) rotateX(${rotateX}deg) scale(${currentScale})`,
                transformStyle: "preserve-3d",
                opacity,
                borderRadius: `${Math.round(16 * scale)}px`,
                border: `${Math.round(4 * scale)}px solid rgba(255, 255, 255, 0.1)`,
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                backgroundColor: "#1e1e24",
              }}
            >
              {/* Inner depth layer */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  transform: `translateZ(${z}px)`,
                  transformStyle: "preserve-3d",
                  position: "relative",
                }}
              >
                {/* Image */}
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#1e1e24",
                      color: "#6b7280",
                      fontSize: `${Math.max(10, Math.round(14 * scale))}px`,
                    }}
                  >
                    No Image
                  </div>
                )}

                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
                  }}
                />

                {/* Content */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: `${Math.round(20 * scale)}px`,
                    color: "white",
                  }}
                >
                  <div
                    style={{
                      fontSize: `${Math.max(12, Math.round(20 * scale))}px`,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      marginTop: `${Math.round(4 * scale)}px`,
                      fontSize: `${Math.max(10, Math.round(13 * scale))}px`,
                      color: "rgba(255,255,255,0.7)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination indicators */}
      <div
        style={{
          marginTop: `${Math.round(40 * scale)}px`,
          display: "flex",
          gap: `${Math.round(8 * scale)}px`,
          zIndex: 40,
        }}
      >
        {items.map((_, idx) => {
          const isActive = Math.abs(idx - virtualActive) < 0.5;
          return (
            <div
              key={idx}
              style={{
                width: `${Math.round(isActive ? 24 : 8) * scale}px`,
                height: `${Math.round(8) * scale}px`,
                borderRadius: `${Math.round(4) * scale}px`,
                backgroundColor: isActive ? "#6366f1" : "rgba(255,255,255,0.2)",
                transition: "width 0.2s ease, backgroundColor 0.2s ease",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
export default CardStackTemplate;
