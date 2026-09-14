import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function InteractiveImageAccordionTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const titleText = String(values.title ?? "Accelerate Gen-AI Tasks on Any Device");
  const subtitleText = String(values.subtitle ?? "Build high-performance AI apps on-device without the hassle of model compression or edge deployment.");
  const accentColor = String(values.accentColor ?? "#111827");
  const textColor = String(values.textColor ?? "#111827");

  const items = useMemo(() => [
    {
      id: 1,
      title: String(values.title1 ?? "Voice Assistant"),
      imageUrl: String(values.image1 ?? "https://images.unsplash.com/photo-1628258334105-2a0b3d6efee1?q=80&w=600&auto=format&fit=crop"),
    },
    {
      id: 2,
      title: String(values.title2 ?? "AI Image Generation"),
      imageUrl: String(values.image2 ?? "https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=600&auto=format&fit=crop"),
    },
    {
      id: 3,
      title: String(values.title3 ?? "AI Chatbot + Local RAG"),
      imageUrl: String(values.image3 ?? "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600&auto=format&fit=crop"),
    },
    {
      id: 4,
      title: String(values.title4 ?? "AI Agent"),
      imageUrl: String(values.image4 ?? "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=600&auto=format&fit=crop"),
    },
    {
      id: 5,
      title: String(values.title5 ?? "Visual Understanding"),
      imageUrl: String(values.image5 ?? "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop"),
    },
  ], [values]);

  // 2. Scale factor calculation (relative to 1080p composition height)
  const scaleFactor = Math.min(width, height) / 1080;

  // 3. Staggered fade/scale entry of the layout
  const introProgress = Math.min(1, progress / 0.15); // completes in first 15%
  const containerOpacity = introProgress;
  const containerScale = 0.95 + introProgress * 0.05;

  // 4. Determine width interpolation for the active index over the remaining progress (15% to 85%)
  const cycleProgress = Math.max(0, Math.min(1, (progress - 0.15) / 0.7)); // mapped 0 to 1
  const activeFloatIndex = cycleProgress * (items.length - 1); // maps to 0..4

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background glass theme pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundSize: `${60 * scaleFactor}px ${60 * scaleFactor}px`,
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 80%)",
          opacity: 0.6,
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: `${1200 * scaleFactor}px`,
          padding: `${24 * scaleFactor}px`,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: `${48 * scaleFactor}px`,
          opacity: containerOpacity,
          transform: `scale(${containerScale})`,
          zIndex: 10,
        }}
      >
        {/* Left Text Content */}
        <div style={{ flex: 1, textAlign: "left" }}>
          <h1
            style={{
              fontSize: `${52 * scaleFactor}px`,
              fontWeight: 800,
              color: textColor,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            {titleText}
          </h1>
          <p
            style={{
              marginTop: `${24 * scaleFactor}px`,
              fontSize: `${20 * scaleFactor}px`,
              color: "rgba(75, 85, 99, 0.9)",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: `${480 * scaleFactor}px`,
            }}
          >
            {subtitleText}
          </p>
          <div style={{ marginTop: `${36 * scaleFactor}px` }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: accentColor,
                color: "#ffffff",
                fontWeight: 600,
                fontSize: `${16 * scaleFactor}px`,
                padding: `${12 * scaleFactor}px ${28 * scaleFactor}px`,
                borderRadius: `${8 * scaleFactor}px`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              Contact Us
            </span>
          </div>
        </div>

        {/* Right Accordion Grid */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: `${16 * scaleFactor}px`,
          }}
        >
          {items.map((item, index) => {
            // Compute hover/active state weight purely from progress
            // Weight is 1 when activeFloatIndex is exactly index, and decays to 0
            const itemWeight = Math.max(0, 1 - Math.abs(activeFloatIndex - index));
            
            // Interpolate width from 60px to 400px (scaled)
            const minW = 60 * scaleFactor;
            const maxW = 380 * scaleFactor;
            const itemWidth = minW + itemWeight * (maxW - minW);

            // Interpolate text rotation and position
            // Active: rotated 0, centered bottom
            // Inactive: rotated 90deg, bottom-24
            const textRotate = (1 - itemWeight) * 90;
            const textBottom = 24 * scaleFactor + itemWeight * (12 * scaleFactor);

            return (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  width: `${itemWidth}px`,
                  height: `${450 * scaleFactor}px`,
                  borderRadius: `${16 * scaleFactor}px`,
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                }}
              >
                {/* Background Image */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://placehold.co/400x450/2d3748/ffffff?text=Image+Error';
                  }}
                />
                
                {/* Dark overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.45)",
                  }}
                />

                {/* Title overlay */}
                <span
                  style={{
                    position: "absolute",
                    bottom: `${textBottom}px`,
                    left: "50%",
                    transform: `translateX(-50%) rotate(${textRotate}deg)`,
                    transformOrigin: "center",
                    color: "#ffffff",
                    fontSize: `${16 * scaleFactor}px`,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    opacity: 0.8 + itemWeight * 0.2,
                  }}
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
