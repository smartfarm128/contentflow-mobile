import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function RetroTestimonialTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const name1 = String(values.name1 ?? "Sarah Chen");
  const designation1 = String(values.designation1 ?? "Senior Frontend Developer");
  const description1 = String(values.description1 ?? "The component library has revolutionized our development workflow. The pre-built components are beautiful and saved us countless hours.");
  const image1 = String(values.image1 ?? placeholderImage("ropw200q80"));

  const name2 = String(values.name2 ?? "Michael Rodriguez");
  const designation2 = String(values.designation2 ?? "Founder, TechStart");
  const description2 = String(values.description2 ?? "As a startup founder, I needed a quick way to build a professional-looking product. This was exactly what I needed. Production-ready code.");
  const image2 = String(values.image2 ?? placeholderImage("ropw200q80"));

  const name3 = String(values.name3 ?? "David Kim");
  const designation3 = String(values.designation3 ?? "UI/UX Lead");
  const description3 = String(values.description3 ?? "The attention to detail in these components is impressive. From accessibility features to responsive design, everything is well thought out.");
  const image3 = String(values.image3 ?? placeholderImage("ropw200q80"));

  const bgOpacity = Number(values.bgOpacity ?? 0.85);

  const items = useMemo(() => [
    { name: name1, designation: designation1, description: description1, image: image1 },
    { name: name2, designation: designation2, description: description2, image: image2 },
    { name: name3, designation: designation3, description: description3, image: image3 },
  ], [name1, designation1, description1, image1, name2, designation2, description2, image2, name3, designation3, description3, image3]);

  // Design scale factor relative to 1080p
  const scale = Math.min(width, height) / 1080;
  const padding = Math.max(16, Math.round(50 * scale));
  const cardWidth = Math.max(280, Math.round(560 * scale));
  const cardHeight = Math.max(300, Math.round(580 * scale));
  const avatarSize = Math.max(40, Math.round(110 * scale));
  const titleSize = Math.max(14, Math.round(28 * scale));
  const descSize = Math.max(12, Math.round(23 * scale));
  const tagSize = Math.max(10, Math.round(18 * scale));
  const quoteSize = Math.max(16, Math.round(40 * scale));
  const gap = Math.max(8, Math.round(20 * scale));

  // Determine positions for cards based on progress
  // Card 1: active 0.0 -> 0.33, slides left 0.30 -> 0.36
  // Card 2: active 0.33 -> 0.66, slides left 0.63 -> 0.69
  // Card 3: active 0.66 -> 1.0

  const cardStates = useMemo(() => {
    return items.map((item, idx) => {
      let opacity = 1;
      let translateX = 0;
      let rotate = 0;
      let zIndex = 10;
      let currentScale = 1;

      if (idx === 0) {
        if (progress < 0.30) {
          rotate = 2;
          zIndex = 30;
        } else if (progress < 0.36) {
          const t = (progress - 0.30) / 0.06;
          const ease = t * t * (3 - 2 * t); // easeInOut
          translateX = -ease * cardWidth * 1.3;
          rotate = 2 - ease * 12;
          zIndex = 30;
          opacity = 1 - ease;
        } else {
          opacity = 0;
          zIndex = 0;
        }
      } else if (idx === 1) {
        if (progress < 0.30) {
          currentScale = 0.92;
          rotate = -3;
          zIndex = 20;
        } else if (progress < 0.36) {
          const t = (progress - 0.30) / 0.06;
          const ease = t * t * (3 - 2 * t);
          currentScale = 0.92 + 0.08 * ease;
          rotate = -3 + 6 * ease;
          zIndex = 20;
        } else if (progress < 0.63) {
          rotate = 3;
          zIndex = 30;
        } else if (progress < 0.69) {
          const t = (progress - 0.63) / 0.06;
          const ease = t * t * (3 - 2 * t);
          translateX = -ease * cardWidth * 1.3;
          rotate = 3 - ease * 12;
          zIndex = 30;
          opacity = 1 - ease;
        } else {
          opacity = 0;
          zIndex = 0;
        }
      } else if (idx === 2) {
        if (progress < 0.63) {
          currentScale = 0.84;
          rotate = -6;
          zIndex = 10;
        } else if (progress < 0.69) {
          const t = (progress - 0.63) / 0.06;
          const ease = t * t * (3 - 2 * t);
          currentScale = 0.84 + 0.16 * ease;
          rotate = -6 + 7 * ease;
          zIndex = 20;
        } else {
          rotate = 1;
          zIndex = 30;
        }
      }

      return {
        ...item,
        opacity,
        translateX,
        rotate,
        zIndex,
        scale: currentScale,
      };
    });
  }, [items, progress, cardWidth]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: `rgba(26, 23, 20, ${bgOpacity})`, // warm retro dark theme
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Georgia, serif", // serif retro typography
        padding: `${padding}px`,
      }}
    >
      {/* Background paper grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          backgroundImage: "radial-gradient(#ffffff 1.5px, transparent 1.5px)",
          backgroundSize: `${Math.round(24 * scale)}px ${Math.round(24 * scale)}px`,
          pointerEvents: "none",
        }}
      />

      {/* Cards stack container */}
      <div
        style={{
          position: "relative",
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
        }}
      >
        {cardStates.map((card, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#f4f1ea", // warm retro cream
              borderRadius: `${Math.round(24 * scale)}px`,
              border: `${Math.round(4 * scale)}px solid #3b3026`, // thick retro border
              padding: `${Math.round(36 * scale)}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: `${gap}px`,
              zIndex: card.zIndex,
              opacity: card.opacity,
              transform: `translateX(${card.translateX}px) rotate(${card.rotate}deg) scale(${card.scale})`,
              transformOrigin: "center bottom",
              boxShadow: `${Math.round(6 * scale)}px ${Math.round(6 * scale)}px 0px #3b3026`, // retro flat shadow
              transition: "none",
            }}
          >
            {/* Vintage Quote Mark */}
            <span
              style={{
                fontSize: `${quoteSize * 2}px`,
                fontWeight: "bold",
                color: "#c2b4a5",
                lineHeight: 0.5,
                alignSelf: "flex-start",
                fontFamily: "Georgia, serif",
              }}
            >
              “
            </span>

            {/* Testimonial Description */}
            <p
              style={{
                fontSize: `${descSize}px`,
                color: "#3b3026",
                textAlign: "center",
                lineHeight: 1.5,
                margin: 0,
                fontWeight: 400,
                fontStyle: "italic",
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              {card.description}
            </p>

            {/* Profile Block */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: `${Math.round(8 * scale)}px`,
                marginTop: "auto",
              }}
            >
              {/* Profile Image (saturate 0.2 / sepia vintage filters) */}
              <div
                style={{
                  width: `${avatarSize}px`,
                  height: `${avatarSize}px`,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `${Math.round(3 * scale)}px solid #3b3026`,
                  filter: "grayscale(0.6) sepia(0.3) contrast(1.1)",
                }}
              >
                <img
                  src={card.image}
                  alt={card.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Author Info */}
              <div style={{ textAlign: "center" }}>
                <h3
                  style={{
                    fontSize: `${titleSize}px`,
                    fontWeight: 700,
                    color: "#3b3026",
                    margin: 0,
                  }}
                >
                  {card.name}
                </h3>
                <span
                  style={{
                    fontSize: `${tagSize}px`,
                    color: "#7c6a59",
                    fontWeight: 500,
                    textTransform: "lowercase",
                  }}
                >
                  {card.designation}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
