import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function Logos3Template({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const heading = String(values.heading ?? "Trusted by these companies");
  const speed = Number(values.speed ?? 120); // pixels per second
  const spacing = Number(values.spacing ?? 80); // pixels
  const logoHeightInput = Number(values.logoHeight ?? 36); // pixels
  const bgOpacity = Number(values.bgOpacity ?? 0.85);

  const logos = useMemo(() => {
    const list = [
      { id: "logo-1", name: "Astro", url: String(values.logo1 ?? "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/astro-wordmark.svg") },
      { id: "logo-2", name: "Figma", url: String(values.logo2 ?? "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/figma-wordmark.svg") },
      { id: "logo-3", name: "NextJS", url: String(values.logo3 ?? "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/nextjs-wordmark.svg") },
      { id: "logo-4", name: "React", url: String(values.logo4 ?? "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/react-wordmark.svg") },
      { id: "logo-5", name: "Shadcn", url: String(values.logo5 ?? "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcn-ui-wordmark.svg") },
      { id: "logo-6", name: "Supabase", url: String(values.logo6 ?? "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/supabase-wordmark.svg") },
      { id: "logo-7", name: "Tailwind", url: String(values.logo7 ?? "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/tailwind-wordmark.svg") },
      { id: "logo-8", name: "Vercel", url: String(values.logo8 ?? "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/vercel-wordmark.svg") },
    ];
    return list.filter(item => item.url && item.url.trim() !== "");
  }, [
    values.logo1,
    values.logo2,
    values.logo3,
    values.logo4,
    values.logo5,
    values.logo6,
    values.logo7,
    values.logo8
  ]);

  // Design scale factor relative to 1080p height
  const scale = Math.min(width, height) / 1080;
  const logoHeight = Math.max(16, Math.round(logoHeightInput * scale * 1.5));
  const logoSpacing = Math.max(20, Math.round(spacing * scale * 1.5));
  const headingSize = Math.max(16, Math.round(42 * scale));
  const headingMargin = Math.max(10, Math.round(30 * scale));
  const innerSpacing = Math.max(20, Math.round(80 * scale));

  // Approx width per logo block: we assume a safe average logo width + spacing
  const approxItemWidth = Math.round(logoHeight * 3.5) + logoSpacing;
  const singleSetWidth = logos.length * approxItemWidth;

  // Algebraic translation driven by playhead time
  const scrollOffset = -(time * speed * scale * 1.2) % singleSetWidth;

  // Duplicate logos three times for seamless marquee scrolling
  const triplicatedLogos = useMemo(() => [
    ...logos,
    ...logos,
    ...logos,
  ], [logos]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: `rgba(10, 10, 10, ${bgOpacity})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Title */}
      {heading && (
        <h2
          style={{
            fontSize: `${headingSize}px`,
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: `${innerSpacing}px`,
            textAlign: "center",
            letterSpacing: "-0.03em",
            maxWidth: "80%",
            margin: `0 0 ${headingMargin}px 0`,
          }}
        >
          {heading}
        </h2>
      )}

      {/* Marquee Row Container */}
      <div
        style={{
          width: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          padding: `${Math.round(20 * scale)}px 0`,
        }}
      >
        {/* Sliding Flex Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: `${logoSpacing}px`,
            transform: `translateX(${scrollOffset}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {triplicatedLogos.map((logo, idx) => (
            <div
              key={`${logo.id}-${idx}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: `${Math.round(logoHeight * 3.5)}px`,
                flexShrink: 0,
                filter: "brightness(0.9) invert(1) opacity(0.85)", // Make logos pop on dark background
              }}
            >
              <img
                src={logo.url}
                alt={logo.name}
                style={{
                  height: `${logoHeight}px`,
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </div>
          ))}
        </div>

        {/* Shadow Overlay Left */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: `${Math.round(150 * scale)}px`,
            backgroundImage: "linear-gradient(to right, rgb(10, 10, 10), transparent)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* Shadow Overlay Right */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: `${Math.round(150 * scale)}px`,
            backgroundImage: "linear-gradient(to left, rgb(10, 10, 10), transparent)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
}
