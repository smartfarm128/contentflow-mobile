import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function FeatureCarouselTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const rawTitle = String(values.title ?? "Edit Your Photos on the Go");
  const subtitle = String(values.subtitle ?? "Use all our AI-powered photo editing tools on your phone, available for all iOS and Android.");
  
  const images = useMemo(() => [
    {
      src: String(values.image1 ?? placeholderImage("fitcropq60")),
      alt: "Photo 1",
    },
    {
      src: String(values.image2 ?? placeholderImage("fitcropq60")),
      alt: "Photo 2",
    },
    {
      src: String(values.image3 ?? placeholderImage("fitcropq60")),
      alt: "Photo 3",
    },
    {
      src: String(values.image4 ?? placeholderImage("fitcropq60")),
      alt: "Photo 4",
    },
    {
      src: String(values.image5 ?? placeholderImage("fitcropq60")),
      alt: "Photo 5",
    },
  ], [values]);

  // 2. Scale factor calculation (relative to 1080p composition height)
  const scaleFactor = Math.min(width, height) / 1080;
  
  // 3. Mathematical carousel frame position interpolation
  // Map playhead progress smoothly from first to last image
  const total = images.length;
  const activeIndexFloat = progress * (total - 1);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0d0e12",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        padding: `${24 * scaleFactor}px`,
        boxSizing: "border-box",
      }}
    >
      {/* Background gradients */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.15, pointerEvents: "none" }}>
        <div style={{ position: "absolute", bottom: 0, left: "-10%", width: `${600 * scaleFactor}px`, height: `${600 * scaleFactor}px`, borderRadius: "50%", background: "radial-gradient(circle, rgba(128,90,213,0.4) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: 0, right: "-10%", width: `${600 * scaleFactor}px`, height: `${600 * scaleFactor}px`, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,123,255,0.4) 0%, transparent 70%)" }} />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: `${48 * scaleFactor}px`,
        }}
      >
        {/* Header Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: `${16 * scaleFactor}px` }}>
          <h1
            style={{
              fontSize: `${54 * scaleFactor}px`,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              maxWidth: `${900 * scaleFactor}px`,
              lineHeight: 1.1,
            }}
          >
            {rawTitle}
          </h1>
          <p
            style={{
              fontSize: `${20 * scaleFactor}px`,
              color: "rgba(156, 163, 175, 0.9)",
              maxWidth: `${600 * scaleFactor}px`,
              margin: "0 auto",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Carousel Showcase Area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: `${500 * scaleFactor}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            perspective: "1000px",
          }}
        >
          {images.map((image, index) => {
            // Linear offset from the floating active index
            const offset = index - activeIndexFloat;
            const dist = Math.abs(offset);

            // Interpolate position styles algebraically
            let opacity = 0;
            let scale = 0.7;
            let blur = 4;
            let rotateY = offset * -15;
            let visibility: "visible" | "hidden" = "hidden";

            if (dist <= 1.0) {
              visibility = "visible";
              opacity = 1.0 - dist * 0.6; // 1.0 down to 0.4
              scale = 1.0 - dist * 0.15;  // 1.0 down to 0.85
              blur = dist * 4;            // 0px up to 4px
            } else if (dist <= 1.6) {
              visibility = "visible";
              const t = (dist - 1.0) / 0.6;
              opacity = (1.0 - t) * 0.4;
              scale = 0.85 - t * 0.15;
              blur = 4;
            }

            const translateX = offset * 280 * scaleFactor;

            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  width: `${260 * scaleFactor}px`,
                  height: `${420 * scaleFactor}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
                  zIndex: dist <= 0.5 ? 10 : (dist <= 1.5 ? 5 : 1),
                  opacity: opacity,
                  filter: blur > 0 ? `blur(${blur}px)` : "none",
                  visibility: visibility,
                  transition: "transform 0.05s linear, opacity 0.05s linear",
                }}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                    borderRadius: `${24 * scaleFactor}px`,
                    border: "2px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = placeholderImage("ImageError");
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
