import type { HtmlTemplateProps } from "../types";
import { placeholderAvatar } from "../local-placeholder";

export function TestimonialCardTemplate({
  progress,
  width,
  height,
  values,
}: HtmlTemplateProps) {
  const scaleFactor = Math.min(width, height) / 1080;
  const cardWidth = 400 * scaleFactor;
  const cardHeight = 300 * scaleFactor;

  const titleText = String(values.title ?? "Customer Stories");
  const accentColor = String(values.accentColor ?? "#3b82f6");

  const testimonials = [
    {
      id: 1,
      name: String(values.name1 ?? "Sarah Chen"),
      role: String(values.role1 ?? "Lead Designer at Figma"),
      avatar: String(
        values.avatar1 ?? placeholderAvatar("ropw200q80")
      ),
      description: String(
        values.description1 ??
          "The component library has revolutionized our development workflow. The pre-built components are beautiful and saved us countless hours."
      ),
    },
    {
      id: 2,
      name: String(values.name2 ?? "Michael Rodriguez"),
      role: String(values.role2 ?? "Founder, TechStart"),
      avatar: String(
        values.avatar2 ?? placeholderAvatar("ropw200q80")
      ),
      description: String(
        values.description2 ??
          "As a startup founder, I needed a quick way to build a professional-looking product. This was exactly what I needed. Production-ready code."
      ),
    },
    {
      id: 3,
      name: String(values.name3 ?? "David Kim"),
      role: String(values.role3 ?? "UI/UX Lead"),
      avatar: String(
        values.avatar3 ?? placeholderAvatar("ropw200q80")
      ),
      description: String(
        values.description3 ??
          "The attention to detail in these components is impressive. From accessibility features to responsive design, everything is well thought out."
      ),
    },
  ];

  const n = testimonials.length;
  // Determine current active slide
  const segment = 1 / n;
  const activeIndex = Math.min(n - 1, Math.floor(progress / segment));

  // Calculate slide progress fraction
  const slideProgress = (progress % segment) / segment;

  // We transition during the last 20% of the slide
  const TRANSITION_FRACTION = 0.2;
  const isTransitioning = slideProgress > 1 - TRANSITION_FRACTION;
  const f = isTransitioning
    ? (slideProgress - (1 - TRANSITION_FRACTION)) / TRANSITION_FRACTION
    : 0;

  // Return style objects for cards
  const renderCards = () => {
    return testimonials.map((t, idx) => {
      // Relative index to the current active card
      let relIdx = idx - activeIndex;
      if (relIdx < 0) {
        // Already swiped out
        relIdx = -1;
      }

      let cardOpacity = 0;
      let cardX = 0;
      let cardY = 0;
      let cardScale = 1;
      let cardRotate = 0;
      let zIndex = 0;

      if (relIdx === -1) {
        // Exited card
        cardOpacity = 0;
        cardX = 400 * scaleFactor;
        cardRotate = 20;
        zIndex = 0;
      } else if (relIdx === 0) {
        // Current card (slides out as f goes 0 -> 1)
        cardOpacity = 1 - f;
        cardX = f * 400 * scaleFactor;
        cardY = 0;
        cardScale = 1 - f * 0.05;
        cardRotate = f * 15;
        zIndex = 10;
      } else if (relIdx === 1) {
        // Next card (moves to current position)
        cardOpacity = 0.7 + f * 0.3;
        cardX = 0;
        cardY = (1 - f) * 12 * scaleFactor;
        cardScale = 0.95 + f * 0.05;
        cardRotate = -2 + f * 2;
        zIndex = 9;
      } else if (relIdx === 2) {
        // Second next card (moves to next position)
        cardOpacity = 0.4 + f * 0.3;
        cardX = 0;
        cardY = (2 - f) * 12 * scaleFactor;
        cardScale = 0.9 + f * 0.05;
        cardRotate = -4 + f * 2;
        zIndex = 8;
      } else {
        // Far back card
        cardOpacity = 0.2;
        cardX = 0;
        cardY = 24 * scaleFactor;
        cardScale = 0.85;
        cardRotate = -6;
        zIndex = 1;
      }

      if (idx < activeIndex) return null;

      return (
        <div
          key={t.id}
          style={{
            position: "absolute",
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            borderRadius: `${16 * scaleFactor}px`,
            background: "rgba(23, 23, 23, 0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: `${24 * scaleFactor}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            opacity: cardOpacity,
            zIndex,
            transform: `translate3d(${cardX}px, ${cardY}px, 0) scale(${cardScale}) rotate(${cardRotate}deg)`,
            transformOrigin: "bottom center",
            transition: "none",
          }}
        >
          {/* Quote text */}
          <p
            style={{
              fontSize: `${16 * scaleFactor}px`,
              color: "#e2e8f0",
              lineHeight: 1.6,
              fontWeight: 400,
              fontStyle: "italic",
            }}
          >
            "{t.description}"
          </p>

          {/* User profile section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: `${12 * scaleFactor}px`,
            }}
          >
            <img
              src={t.avatar}
              alt={t.name}
              style={{
                width: `${48 * scaleFactor}px`,
                height: `${48 * scaleFactor}px`,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${accentColor}`,
              }}
            />
            <div>
              <h4
                style={{
                  fontSize: `${16 * scaleFactor}px`,
                  color: "#ffffff",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {t.name}
              </h4>
              <p
                style={{
                  fontSize: `${12 * scaleFactor}px`,
                  color: "rgba(255, 255, 255, 0.5)",
                  margin: 0,
                }}
              >
                {t.role}
              </p>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0d0d0d",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontSize: `${28 * scaleFactor}px`,
          fontWeight: 700,
          color: "#ffffff",
          marginBottom: `${40 * scaleFactor}px`,
          letterSpacing: "-0.02em",
          background: `linear-gradient(to right, #ffffff, ${accentColor})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {titleText}
      </h2>

      {/* Cards stack container */}
      <div
        style={{
          position: "relative",
          width: `${cardWidth}px`,
          height: `${cardHeight + 24 * scaleFactor}px`,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {renderCards()}
      </div>

      {/* Dots Indicator */}
      <div
        style={{
          display: "flex",
          gap: `${8 * scaleFactor}px`,
          marginTop: `${24 * scaleFactor}px`,
        }}
      >
        {testimonials.map((_, i) => (
          <div
            key={i}
            style={{
              width: `${8 * scaleFactor}px`,
              height: `${8 * scaleFactor}px`,
              borderRadius: "50%",
              backgroundColor: i === activeIndex ? accentColor : "rgba(255,255,255,0.2)",
              transition: "background-color 0.2s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
