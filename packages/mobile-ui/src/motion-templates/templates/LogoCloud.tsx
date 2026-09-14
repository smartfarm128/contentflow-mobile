import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function LogoCloudTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Read controls
  const title = String(values.title ?? "Already used by Best in the Game");
  const scrollSpeed = Number(values.scrollSpeed ?? 60); // speed multiplier
  const logoHeight = Number(values.logoHeight ?? 24); // base height in px
  const gap = Number(values.gap ?? 48); // gap between logos in px
  const bgColor = String(values.bgColor ?? "#09090b");
  const accentColor = String(values.accentColor ?? "#94a3b8");

  // Read logo images
  const logo1 = String(values.logo1 ?? "https://svgl.app/library/nvidia-wordmark-light.svg");
  const logo2 = String(values.logo2 ?? "https://svgl.app/library/supabase_wordmark_light.svg");
  const logo3 = String(values.logo3 ?? "https://svgl.app/library/openai_wordmark_light.svg");
  const logo4 = String(values.logo4 ?? "https://svgl.app/library/turso-wordmark-light.svg");
  const logo5 = String(values.logo5 ?? "https://svgl.app/library/vercel_wordmark.svg");
  const logo6 = String(values.logo6 ?? "https://svgl.app/library/github_wordmark_light.svg");
  const logo7 = String(values.logo7 ?? "https://svgl.app/library/claude-ai-wordmark-icon_light.svg");
  const logo8 = String(values.logo8 ?? "https://svgl.app/library/clerk-wordmark-light.svg");

  const logos = useMemo(() => {
    return [logo1, logo2, logo3, logo4, logo5, logo6, logo7, logo8].filter(Boolean);
  }, [logo1, logo2, logo3, logo4, logo5, logo6, logo7, logo8]);

  // 2. Scale factor based on canvas
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  const resolvedLogoHeight = Math.max(12, logoHeight * scaleFactor * 2.2);
  const resolvedGap = Math.max(16, gap * scaleFactor * 2.2);

  // 3. Playhead-deterministic marquee translate scroll offset
  // Translating a repeated list wrapper by exactly 50% creates a seamless loop
  const speedFactor = scrollSpeed * 0.08;
  const translateX = (time * speedFactor) % 50;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: bgColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          transform: `scale(${scaleFactor * 1.5})`,
          transformOrigin: "center center",
          width: "100%",
          maxWidth: "850px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        {/* Section Heading */}
        {title && (
          <h2
            style={{
              textAlign: "center",
              marginBottom: "32px",
              color: accentColor,
              fontWeight: 700,
              fontSize: `${Math.max(14, 20 * scaleFactor * 1.8)}px`,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h2>
        )}

        {/* Marquee viewport */}
        <div
          style={{
            position: "relative",
            width: "100%",
            overflow: "hidden",
            padding: "24px 0",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Progressive blur edge covers */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "160px",
              background: `linear-gradient(to right, ${bgColor} 0%, transparent 100%)`,
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: "160px",
              background: `linear-gradient(to left, ${bgColor} 0%, transparent 100%)`,
              pointerEvents: "none",
              zIndex: 10,
            }}
          />

          {/* Scrolling Flex Track */}
          <div
            style={{
              display: "flex",
              width: "200%",
              transform: `translate3d(-${translateX}%, 0, 0)`,
              gap: `${resolvedGap}px`,
            }}
          >
            {/* Repeated List 1 */}
            <div
              style={{
                display: "flex",
                flex: "1 0 0%",
                justifyContent: "space-around",
                alignItems: "center",
                gap: `${resolvedGap}px`,
              }}
            >
              {logos.map((src, idx) => (
                <img
                  key={`l1-${idx}`}
                  src={src}
                  alt={`Logo ${idx}`}
                  style={{
                    height: `${resolvedLogoHeight}px`,
                    width: "auto",
                    objectFit: "contain",
                    opacity: 0.7,
                    filter: "brightness(0) invert(1)", // enforces dark-mode white logos
                    pointerEvents: "none",
                  }}
                />
              ))}
            </div>

            {/* Repeated List 2 (Duplicate for seamless loop) */}
            <div
              style={{
                display: "flex",
                flex: "1 0 0%",
                justifyContent: "space-around",
                alignItems: "center",
                gap: `${resolvedGap}px`,
              }}
            >
              {logos.map((src, idx) => (
                <img
                  key={`l2-${idx}`}
                  src={src}
                  alt={`Logo Duplicate ${idx}`}
                  style={{
                    height: `${resolvedLogoHeight}px`,
                    width: "auto",
                    objectFit: "contain",
                    opacity: 0.7,
                    filter: "brightness(0) invert(1)",
                    pointerEvents: "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
