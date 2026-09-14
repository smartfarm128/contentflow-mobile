import { Star, Quote } from "lucide-react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function TestimonialSliderTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const slideDuration = Number(values.slideDuration ?? 4.0);
  const accentColor = String(values.accentColor ?? "#fbbf24");
  const transitionTime = 0.8;

  const testimonials = [
    {
      quote: String(values.quote1 ?? "This is a game-changer. The design is intuitive, and the performance is unparalleled. It has streamlined our workflow significantly."),
      name: String(values.name1 ?? "Emily Thomas"),
      role: String(values.role1 ?? "Product Designer"),
      image: String(values.image1 ?? placeholderImage("matfitcrop")),
      rating: Number(values.rating1 ?? 5),
    },
    {
      quote: String(values.quote2 ?? "An incredible experience from start to finish. The team was responsive, and the final product exceeded all our expectations. Highly recommended!"),
      name: String(values.name2 ?? "Michael Chen"),
      role: String(values.role2 ?? "Lead Developer"),
      image: String(values.image2 ?? placeholderImage("matfitcrop")),
      rating: Number(values.rating2 ?? 5),
    },
    {
      quote: String(values.quote3 ?? "The attention to detail is what sets this apart. Every feature feels thoughtfully designed and implemented. It's a pleasure to use every day."),
      name: String(values.name3 ?? "Sophia Rodriguez"),
      role: String(values.role3 ?? "UX Researcher"),
      image: String(values.image3 ?? placeholderImage("matfitcrop")),
      rating: Number(values.rating3 ?? 4),
    },
  ];

  const n = testimonials.length;
  const activeIndex = Math.floor(time / slideDuration) % n;
  const nextIndex = (activeIndex + 1) % n;
  const slideProgress = (time % slideDuration) / slideDuration;

  const transitionPct = transitionTime / slideDuration;

  let currentOpacity = 1;
  let currentX = 0;
  let nextOpacity = 0;
  let nextX = width;
  let isTransitioning = false;
  let activeDotIndex = activeIndex;

  if (slideProgress > (1 - transitionPct)) {
    isTransitioning = true;
    const t = (slideProgress - (1 - transitionPct)) / transitionPct;
    // Cubic Ease-In-Out
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    currentOpacity = 1 - easedT;
    currentX = -width * 0.4 * easedT;
    nextOpacity = easedT;
    nextX = width * 0.4 * (1 - easedT);
    activeDotIndex = activeIndex + easedT;
  }

  const scale = Math.min(width, height) / 1080;
  const cardWidth = 720 * scale;

  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div style={{ display: "flex", gap: `${4 * scale}px` }}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            style={{
              width: `${16 * scale}px`,
              height: `${16 * scale}px`,
              color: i < rating ? accentColor : "#27272a",
              fill: i < rating ? accentColor : "none",
            }}
          />
        ))}
      </div>
    );
  };

  const renderSlide = (idx: number, opacity: number, translateX: number) => {
    const t = testimonials[idx];
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: opacity,
          transform: `translateX(${translateX}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `${20 * scale}px`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: cardWidth,
            position: "relative",
          }}
        >
          {/* Avatar Image Block */}
          <div
            style={{
              position: "relative",
              width: `${240 * scale}px`,
              height: `${240 * scale}px`,
              borderRadius: `${24 * scale}px`,
              overflow: "hidden",
              border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
              boxShadow: `0 ${10 * scale}px ${30 * scale}px rgba(0, 0, 0, 0.5)`,
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            <img
              src={t.image}
              alt={t.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Text Card Block (offset overlapping) */}
          <div
            style={{
              position: "relative",
              marginLeft: `-${64 * scale}px`,
              flexGrow: 1,
              backgroundColor: "rgba(9, 9, 11, 0.95)",
              border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
              borderRadius: `${24 * scale}px`,
              padding: `${32 * scale}px ${32 * scale}px ${32 * scale}px ${80 * scale}px`,
              boxShadow: `0 ${20 * scale}px ${50 * scale}px rgba(0, 0, 0, 0.4)`,
              display: "flex",
              flexDirection: "column",
              gap: `${16 * scale}px`,
            }}
          >
            {/* Quote Icon */}
            <Quote
              style={{
                position: "absolute",
                top: `${16 * scale}px`,
                left: `${32 * scale}px`,
                width: `${32 * scale}px`,
                height: `${32 * scale}px`,
                color: "rgba(255, 255, 255, 0.05)",
              }}
            />

            <blockquote
              style={{
                fontSize: `${16 * scale}px`,
                color: "#e4e4e7",
                lineHeight: 1.6,
                margin: 0,
                fontStyle: "italic",
              }}
            >
              "{t.quote}"
            </blockquote>

            <StarRating rating={t.rating} />

            <div>
              <p
                style={{
                  fontSize: `${18 * scale}px`,
                  fontWeight: 700,
                  color: "#ffffff",
                  margin: 0,
                }}
              >
                {t.name}
              </p>
              <p
                style={{
                  fontSize: `${14 * scale}px`,
                  color: "#71717a",
                  margin: `${4 * scale}px 0 0 0`,
                }}
              >
                {t.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b",
        backgroundImage: "radial-gradient(circle at center, #18181b 0%, #09090b 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Visual Slides Area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: `${400 * scale}px`,
          overflow: "hidden",
        }}
      >
        {renderSlide(activeIndex, currentOpacity, currentX)}
        {isTransitioning && renderSlide(nextIndex, nextOpacity, nextX)}
      </div>

      {/* Pagination Dots Indicators */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: `${8 * scale}px`,
          marginTop: `${16 * scale}px`,
        }}
      >
        {testimonials.map((_, i) => {
          const distance = Math.abs(i - activeDotIndex);
          const dotWidth = distance < 1 ? (16 + (1 - distance) * 16) * scale : 16 * scale;
          const bgOpacity = distance < 1 ? 0.3 + (1 - distance) * 0.7 : 0.3;

          return (
            <div
              key={i}
              style={{
                height: `${8 * scale}px`,
                width: `${dotWidth}px`,
                borderRadius: `${4 * scale}px`,
                backgroundColor: "#ffffff",
                opacity: bgOpacity,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
