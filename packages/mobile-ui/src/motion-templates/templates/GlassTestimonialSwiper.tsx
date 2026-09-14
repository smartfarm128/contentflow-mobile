import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function GlassTestimonialSwiperTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const slideDuration = Number(values.slideDuration ?? 3.5);
  const transitionDuration = Number(values.transitionDuration ?? 0.8);
  const visibleBehind = Number(values.visibleBehind ?? 2);

  const scale = Math.min(width, height) / 1080;
  const cardWidth = 540 * scale;
  const cardHeight = 320 * scale;
  const swipeDistance = 600 * scale;

  const testimonials = [
    { id: 1, initials: 'SM', name: 'Sarah Mitchell', role: 'VP of Engineering at TechFlow', quote: "This platform has completely transformed how our team collaborates. The AI-powered analytics provide insights we never had before.", gradient: 'linear-gradient(135deg, #5e6ad2, #8b5cf6)' },
    { id: 2, initials: 'MC', name: 'Marcus Chen', role: 'Product Manager at DataSync', quote: "The real-time collaboration features are game-changing. Our remote team feels more connected than ever, and the platform's reliability is outstanding.", gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { id: 3, initials: 'AR', name: 'Alex Rodriguez', role: 'CTO at StartupFlow', quote: "Incredible performance boost and the mobile apps are flawless. Support team is responsive and the feature roadmap aligns perfectly.", gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { id: 4, initials: 'EJ', name: 'Emily Johnson', role: 'Founder of Innovate Inc.', quote: "As a new company, speed is everything. This tool allowed us to scale our operations twice as fast without doubling our headcount.", gradient: 'linear-gradient(135deg, #ec4899, #d946ef)' },
    { id: 5, initials: 'DW', name: 'David Wong', role: 'Lead Designer at Creative Co.', quote: "The user interface is not just beautiful, it's intuitive. Our design team was able to adopt it instantly, streamlining our entire workflow.", gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)' }
  ];

  const totalCards = testimonials.length;

  // Active index and interpolation logic
  const activeIndex = Math.floor(time / slideDuration) % totalCards;
  const tLocal = time % slideDuration;
  
  // Transition progress t goes 0 to 1 at the end of the slide
  const t = Math.max(0, Math.min(1, (tLocal - (slideDuration - transitionDuration)) / transitionDuration));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background vector glow */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: 'url(placeholderImage("dnfrakksvg"))',
          backgroundSize: "cover",
          backgroundPosition: "bottom",
          backgroundRepeat: "no-repeat",
          opacity: 0.25,
          transform: "scale(1.5)",
        }}
      />

      {/* Card stack container */}
      <div
        style={{
          position: "relative",
          width: cardWidth,
          height: cardHeight,
        }}
      >
        {testimonials.map((item, index) => {
          // Calculate stack display position relative to active card
          const displayOrder = (index - activeIndex + totalCards) % totalCards;

          let cardScale = 0;
          let translateY = 0;
          let translateX = 0;
          let opacity = 0;
          let zIndex = 0;

          if (displayOrder === 0) {
            // Outgoing card swiping left
            translateX = -t * swipeDistance;
            cardScale = 1.0;
            translateY = 0;
            opacity = 1 - t;
            zIndex = totalCards;
          } else if (displayOrder <= visibleBehind) {
            // Cards stacked behind moving forward
            const currentScale = 1 - 0.05 * displayOrder;
            const targetScale = 1 - 0.05 * (displayOrder - 1);
            cardScale = currentScale + (targetScale - currentScale) * t;

            const currentY = -24 * displayOrder * scale;
            const targetY = -24 * (displayOrder - 1) * scale;
            translateY = currentY + (targetY - currentY) * t;

            const currentOpacity = 1 - 0.25 * displayOrder;
            const targetOpacity = 1 - 0.25 * (displayOrder - 1);
            opacity = currentOpacity + (targetOpacity - currentOpacity) * t;

            zIndex = totalCards - displayOrder;
          } else if (displayOrder === totalCards - 1) {
            // Incoming card preparing at the back
            cardScale = (1 - 0.05 * visibleBehind) * t;
            translateY = -24 * visibleBehind * scale * t;
            opacity = (1 - 0.25 * visibleBehind) * t;
            zIndex = 1;
          } else {
            // Hidden cards
            cardScale = 0;
            translateY = 0;
            opacity = 0;
            zIndex = 0;
          }

          return (
            <div
              key={item.id}
              style={{
                position: "absolute",
                inset: 0,
                width: cardWidth,
                height: cardHeight,
                borderRadius: `${20 * scale}px`,
                border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
                background: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(16px)",
                boxShadow: `0 ${10 * scale}px ${30 * scale}px rgba(0, 0, 0, 0.45)`,
                boxSizing: "border-box",
                padding: `${32 * scale}px`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${cardScale})`,
                opacity: opacity,
                zIndex: zIndex,
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", gap: `${14 * scale}px` }}>
                <div
                  style={{
                    width: `${44 * scale}px`,
                    height: `${44 * scale}px`,
                    borderRadius: `${10 * scale}px`,
                    background: item.gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: `${16 * scale}px`,
                  }}
                >
                  {item.initials}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: `${16 * scale}px`, fontWeight: 600, color: "#ffffff" }}>{item.name}</span>
                  <span style={{ fontSize: `${12 * scale}px`, color: "#94a3b8", marginTop: `${2 * scale}px` }}>{item.role}</span>
                </div>
              </div>

              {/* Quote Block */}
              <blockquote
                style={{
                  fontSize: `${16 * scale}px`,
                  color: "rgba(255, 255, 255, 0.9)",
                  lineHeight: 1.5,
                  margin: `${12 * scale}px 0`,
                  fontStyle: "italic",
                }}
              >
                "{item.quote}"
              </blockquote>

              {/* Card Footer tags */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: `${1 * scale}px solid rgba(255, 255, 255, 0.08)`,
                  paddingTop: `${16 * scale}px`,
                }}
              >
                <div style={{ display: "flex", gap: `${6 * scale}px` }}>
                  <span
                    style={{
                      fontSize: `${10 * scale}px`,
                      fontWeight: 600,
                      color: "#60a5fa",
                      backgroundColor: "rgba(37, 99, 235, 0.15)",
                      border: `${1 * scale}px solid rgba(37, 99, 235, 0.3)`,
                      padding: `${4 * scale}px ${8 * scale}px`,
                      borderRadius: `${4 * scale}px`,
                    }}
                  >
                    FEATURED
                  </span>
                  <span
                    style={{
                      fontSize: `${10 * scale}px`,
                      fontWeight: 600,
                      color: "#94a3b8",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      padding: `${4 * scale}px ${8 * scale}px`,
                      borderRadius: `${4 * scale}px`,
                    }}
                  >
                    Enterprise
                  </span>
                </div>

                <span style={{ fontSize: `${12 * scale}px`, color: "#94a3b8" }}>Verified</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination indicators */}
      <div
        style={{
          position: "absolute",
          bottom: `${40 * scale}px`,
          display: "flex",
          gap: `${8 * scale}px`,
        }}
      >
        {testimonials.map((_, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={idx}
              style={{
                width: `${8 * scale}px`,
                height: `${8 * scale}px`,
                borderRadius: "50%",
                backgroundColor: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.25)",
                transition: "background-color 0.3s",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
