import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function TestimonalSliderTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 4);
  const transitionDuration = Number(values.transitionDuration ?? 0.6);

  const scaleFactor = Math.min(width, height) / 1080;

  const defaultTestimonials = [
    {
      img: placeholderImage("ropw256q80"),
      quote: "ContentFlow components make building motion graphics effortless!",
      name: "Jessie J",
      role: "Acme LTD",
    },
    {
      img: placeholderImage("ropw256q80"),
      quote: "Simplifies complex designs with ready-to-use motion layouts.",
      name: "Nick V",
      role: "Malika Inc.",
    },
    {
      img: placeholderImage("ropw256q80"),
      quote: "With ContentFlow templates, creating responsive text and video overlays is a breeze.",
      name: "Amelia W",
      role: "Panda AI",
    },
  ];

  // Parse testimonials from values if customized
  const testimonials = defaultTestimonials; // In the template, we'll use these high-quality defaults.

  const activeIndex = Math.floor(time / cycleDuration) % testimonials.length;
  const timeInCycle = time % cycleDuration;
  const isTransitioning = timeInCycle < transitionDuration;
  const prevIndex = (activeIndex - 1 + testimonials.length) % testimonials.length;

  // Compute layout values algebraically
  let activeOpacity = 1;
  let activeRotate = 0;
  let activeTranslateX = 0;

  let prevOpacity = 0;
  let prevRotate = 0;
  let prevTranslateX = 0;

  if (isTransitioning) {
    const progress = timeInCycle / transitionDuration;

    // Active testimonial sliding in
    activeOpacity = progress;
    activeRotate = -60 * (1 - progress);
    activeTranslateX = -60 * scaleFactor * (1 - progress);

    // Prev testimonial sliding out
    prevOpacity = 1 - progress;
    prevRotate = 60 * progress;
    prevTranslateX = 60 * scaleFactor * progress;
  }

  const quoteFontSize = Math.max(16, 36 * scaleFactor);
  const nameFontSize = Math.max(12, 20 * scaleFactor);
  const avatarSize = Math.max(48, 120 * scaleFactor);

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
      {/* Background glow gradient */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: `${540 * scaleFactor}px`,
          height: `${540 * scaleFactor}px`,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(217, 70, 239, 0.15) 0%, rgba(217, 70, 239, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "90%",
          maxWidth: "800px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: `${32 * scaleFactor}px`,
        }}
      >
        {/* Avatar Display Frame */}
        <div
          style={{
            position: "relative",
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
          }}
        >
          {isTransitioning && (
            <img
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                border: `${3 * scaleFactor}px solid #d946ef`,
                opacity: prevOpacity,
                transform: `rotate(${prevRotate}deg) scale(${0.8 + 0.2 * prevOpacity})`,
              }}
              src={testimonials[prevIndex].img}
              alt={testimonials[prevIndex].name}
            />
          )}

          <img
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
              border: `${3 * scaleFactor}px solid #d946ef`,
              opacity: activeOpacity,
              transform: `rotate(${activeRotate}deg) scale(${0.8 + 0.2 * activeOpacity})`,
            }}
            src={testimonials[activeIndex].img}
            alt={testimonials[activeIndex].name}
          />
        </div>

        {/* Quotes Window */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: `${quoteFontSize * 3}px`,
          }}
        >
          {isTransitioning && (
            <div
              style={{
                position: "absolute",
                width: "100%",
                opacity: prevOpacity,
                transform: `translateX(${prevTranslateX}px)`,
                fontSize: `${quoteFontSize}px`,
                fontWeight: 700,
                color: "#f5d0fe",
              }}
            >
              &ldquo;{testimonials[prevIndex].quote}&rdquo;
            </div>
          )}

          <div
            style={{
              position: "absolute",
              width: "100%",
              opacity: activeOpacity,
              transform: `translateX(${activeTranslateX}px)`,
              fontSize: `${quoteFontSize}px`,
              fontWeight: 700,
              color: "#f5d0fe",
            }}
          >
            &ldquo;{testimonials[activeIndex].quote}&rdquo;
          </div>
        </div>

        {/* Author Details */}
        <div style={{ height: `${nameFontSize * 2}px`, position: "relative", width: "100%" }}>
          {isTransitioning && (
            <div
              style={{
                position: "absolute",
                width: "100%",
                opacity: prevOpacity,
                fontSize: `${nameFontSize}px`,
                color: "#a1a1aa",
              }}
            >
              <strong style={{ color: "#ffffff" }}>{testimonials[prevIndex].name}</strong> &mdash; {testimonials[prevIndex].role}
            </div>
          )}

          <div
            style={{
              position: "absolute",
              width: "100%",
              opacity: activeOpacity,
              fontSize: `${nameFontSize}px`,
              color: "#a1a1aa",
            }}
          >
            <strong style={{ color: "#ffffff" }}>{testimonials[activeIndex].name}</strong> &mdash; {testimonials[activeIndex].role}
          </div>
        </div>

        {/* Static dots to represent current active slide */}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          {testimonials.map((_, i) => (
            <div
              key={i}
              style={{
                width: `${8 * scaleFactor}px`,
                height: `${8 * scaleFactor}px`,
                borderRadius: "50%",
                backgroundColor: i === activeIndex ? "#d946ef" : "#3f3f46",
                transition: "background-color 0.3s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
