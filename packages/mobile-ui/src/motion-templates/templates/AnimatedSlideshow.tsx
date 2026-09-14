import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

// Helper to ease values
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function SplitText({
  text,
  isActive,
  isPrevious,
  relativeTime,
}: {
  text: string;
  isActive: boolean;
  isPrevious: boolean;
  relativeTime: number;
  scaleFactor: number;
}) {
  const characters = useMemo(() => {
    const words = text.split(" ").map((word) => word + " ");
    return words.map((word) => word.split("")).flat(1);
  }, [text]);

  const charDuration = 0.35;
  const staggerDelay = 0.025;

  return (
    <span className="inline-block relative overflow-hidden leading-none select-none">
      {characters.map((char, index) => {
        const delay = index * staggerDelay;
        let progress = 0;

        if (isActive) {
          progress = Math.min(1, Math.max(0, (relativeTime - delay) / charDuration));
        } else if (isPrevious) {
          // Slide is transitioning OUT
          progress = 1 - Math.min(1, Math.max(0, (relativeTime - delay) / charDuration));
        } else {
          progress = 0;
        }

        const eased = easeOutCubic(progress);
        const topY = eased * -110;
        const bottomY = (1 - eased) * 110;

        return (
          <span
            key={index}
            className="relative inline-block overflow-hidden"
            style={{
              height: "1.2em",
              verticalAlign: "bottom",
            }}
          >
            {/* Top Span (faded, slides out/in) */}
            <span
              className="inline-block"
              style={{
                opacity: 0.2 + eased * 0.8,
                transform: `translate3d(0, ${topY}%, 0)`,
                willChange: "transform, opacity",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>

            {/* Bottom Span (bright, slides in/out) */}
            <span
              className="absolute left-0 top-0 inline-block text-white"
              style={{
                opacity: eased,
                transform: `translate3d(0, ${bottomY}%, 0)`,
                willChange: "transform, opacity",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function AnimatedSlideshowTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read Controls
  const label = String(values.label ?? "/ our services");
  const slideDuration = Math.max(0.5, Number(values.slideDuration ?? 3.5));

  const title1 = String(values.title1 ?? "frontend dev");
  const image1 = String(values.image1 ?? placeholderImage("matfitcrop"));

  const title2 = String(values.title2 ?? "backend dev");
  const image2 = String(values.image2 ?? placeholderImage("matfitcrop"));

  const title3 = String(values.title3 ?? "UI UX design");
  const image3 = String(values.image3 ?? placeholderImage("matfitcrop"));

  const title4 = String(values.title4 ?? "video editing");
  const image4 = String(values.image4 ?? placeholderImage("matfitcrop"));

  const title5 = String(values.title5 ?? "SEO optimization");
  const image5 = String(values.image5 ?? placeholderImage("matfitcrop"));

  const slides = useMemo(() => {
    return [
      { id: 1, title: title1, imageUrl: image1 },
      { id: 2, title: title2, imageUrl: image2 },
      { id: 3, title: title3, imageUrl: image3 },
      { id: 4, title: title4, imageUrl: image4 },
      { id: 5, title: title5, imageUrl: image5 },
    ].filter(s => s.title && s.imageUrl);
  }, [title1, image1, title2, image2, title3, image3, title4, image4, title5, image5]);

  const count = slides.length;
  if (count === 0) return null;

  // Active slide calculations
  const totalCycle = count * slideDuration;
  const activeTime = time % totalCycle;
  const activeSlideIndex = Math.floor(activeTime / slideDuration);
  const relativeTime = activeTime % slideDuration;

  const previousSlideIndex = (activeSlideIndex - 1 + count) % count;

  // Clip path transition for images
  const transitionDuration = 0.8;
  const isTransitioning = relativeTime < transitionDuration;
  const transitionProgress = isTransitioning ? relativeTime / transitionDuration : 1.0;
  const easedTransition = easeOutCubic(transitionProgress);

  // Scaling Factor
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0d0c08",
        color: "#cbbda8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      <div
        style={{
          transform: `scale(${scaleFactor * 1.5})`,
          transformOrigin: "center center",
          width: "100%",
          maxWidth: "1000px",
          display: "flex",
          flexDirection: "column",
          padding: "48px",
          boxSizing: "border-box",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "#c96442",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: "32px",
          }}
        >
          {label}
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "64px",
            width: "100%",
          }}
        >
          {/* List of text titles */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              flex: 1,
            }}
          >
            {slides.map((slide, index) => {
              const isActive = activeSlideIndex === index;
              const isPrevious = previousSlideIndex === index && isTransitioning;

              return (
                <div
                  key={slide.id}
                  style={{
                    fontSize: "44px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                  }}
                >
                  <SplitText
                    text={slide.title}
                    isActive={isActive}
                    isPrevious={isPrevious}
                    relativeTime={relativeTime}
                    scaleFactor={scaleFactor}
                  />
                </div>
              );
            })}
          </div>

          {/* Picture Stack / Masking container */}
          <div
            style={{
              position: "relative",
              width: "360px",
              height: "440px",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              backgroundColor: "#161512",
            }}
          >
            {slides.map((slide, index) => {
              const isActive = activeSlideIndex === index;
              const isPrevious = previousSlideIndex === index;

              // Clip path variables
              let clipPath = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)"; // Hidden by default
              let zIndex = 1;

              if (isActive) {
                zIndex = 10;
                clipPath = `polygon(0% 0%, 100% 0%, 100% ${easedTransition * 100}%, 0% ${easedTransition * 100}%)`;
              } else if (isPrevious) {
                zIndex = 5;
                clipPath = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"; // Fully visible underneath
              }

              return (
                <div
                  key={slide.id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex,
                    clipPath,
                    WebkitClipPath: clipPath,
                    transition: isTransitioning ? "none" : "clip-path 0.3s ease",
                  }}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: `scale(${isActive ? 1.05 - (1.05 - 1) * easedTransition : 1})`,
                    }}
                  />
                  {/* Subtle vignette/shading overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)",
                      mixBlendMode: "multiply",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimatedSlideshowTemplate;
