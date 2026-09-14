import type { HtmlTemplateProps } from "../types";
import { placeholderLogo } from "../local-placeholder";

// Linear interpolation helper
function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

export function SectionWithMockupTemplate({ progress, time, width, values }: HtmlTemplateProps) {
  // Read customized template values with fallbacks matching the demo mockup data
  const title = values.title !== undefined 
    ? String(values.title) 
    : "Intelligence,\ndelivered to you.";

  const description = values.description !== undefined 
    ? String(values.description) 
    : "Get a tailored Monday morning brief directly in\nyour inbox, crafted by your virtual personal\nanalyst, spotlighting essential watchlist stories\nand earnings for the week ahead.";
  
  const primaryImageSrc = String(values.primaryImageSrc ?? placeholderLogo("594b737png"));
  const secondaryImageSrc = String(values.secondaryImageSrc ?? placeholderLogo("cc114e6png"));
  const reverseLayout = !!(values.reverseLayout ?? false);

  // Responsive scaling factor relative to 1920px wide viewport
  const scale = width / 1920;
  
  // 1. Text entrance: slides up and fades in from progress 0.0 to 0.4
  const textProgress = Math.max(0, Math.min(1, progress / 0.4));
  const textEase = 1 - Math.pow(1 - textProgress, 3); // cubic ease-out
  const textYOffset = (1 - textEase) * 50 * scale;
  const textOpacity = textProgress;

  // 2. Secondary background image entrance: slides up and fades in from progress 0.1 to 0.5
  const secondaryProgress = Math.max(0, Math.min(1, (progress - 0.1) / 0.4));
  const secondaryEase = 1 - Math.pow(1 - secondaryProgress, 3);
  const secondaryOpacity = secondaryProgress;
  const secondaryYEntrance = (1 - secondaryEase) * 60 * scale;

  // 3. Primary main mockup image entrance: slides up and fades in from progress 0.2 to 0.6
  const primaryProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.4));
  const primaryEase = 1 - Math.pow(1 - primaryProgress, 3);
  const primaryOpacity = primaryProgress;
  const primaryYEntrance = (1 - primaryEase) * 60 * scale;

  // 4. Parallax shift effect simulating the scroll-reveals (progress 0.0 to 1.0)
  // Background/Secondary element shifts: y: reverseLayout ? -20 : -30 (pixels scaled)
  // Main/Primary element shifts: y: reverseLayout ? 20 : 30 (pixels scaled)
  const secondaryParallaxY = lerp(0, reverseLayout ? -20 : -30, progress) * scale;
  const primaryParallaxY = lerp(0, reverseLayout ? 20 : 30, progress) * scale;

  // Ambient floating animation using timeline time to make mockup cards feel dynamic/premium
  const floatY = Math.sin(time * 1.5) * 6 * scale;

  // Container dimensions matching desktop 1220px layout
  const containerMaxWidth = 1220 * scale;
  const containerPadding = 40 * scale;

  // Mockup elements sizing (mockup card width is 471px wide at 1920 width)
  const mockupWidth = Math.max(150, 471 * scale);
  const mockupHeight = mockupWidth * (637 / 471); // ratio 1.352

  const secondaryWidth = Math.max(150, 472 * scale);
  const secondaryHeight = secondaryWidth * (500 / 472); // ratio 1.059

  // Column layouts
  const gap = 64 * scale;
  const textWidth = Math.max(200, 546 * scale);

  // Fonts
  const titleFontSize = Math.max(14, 40 * scale);
  const descFontSize = Math.max(11, 15 * scale);
  const titleLineHeight = `${titleFontSize * 1.325}px`;
  const descLineHeight = `${descFontSize * 1.6}px`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        color: "#ffffff",
        userSelect: "none",
      }}
    >
      {/* Bottom radial border gradient overlay */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "1px",
          background: "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: `${containerMaxWidth}px`,
          padding: `0 ${containerPadding}px`,
          display: "flex",
          flexDirection: reverseLayout ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: `${gap}px`,
        }}
      >
        {/* Text column */}
        <div
          style={{
            width: `${textWidth}px`,
            opacity: textOpacity,
            transform: `translateY(${textYOffset}px)`,
            display: "flex",
            flexDirection: "column",
            gap: `${16 * scale}px`,
            zIndex: 10,
          }}
        >
          <h2
            style={{
              fontSize: `${titleFontSize}px`,
              fontWeight: 600,
              lineHeight: titleLineHeight,
              color: "#ffffff",
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: `${descFontSize}px`,
              lineHeight: descLineHeight,
              color: "#868f97",
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {description}
          </p>
        </div>

        {/* Mockups / Images column */}
        <div
          style={{
            position: "relative",
            width: `${mockupWidth}px`,
            height: `${mockupHeight}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Decorative background element */}
          <div
            style={{
              position: "absolute",
              width: `${secondaryWidth}px`,
              height: `${secondaryHeight}px`,
              backgroundColor: "#090909",
              borderRadius: `${32 * scale}px`,
              zIndex: 0,
              top: reverseLayout ? "auto" : "10%",
              bottom: reverseLayout ? "10%" : "auto",
              left: reverseLayout ? "auto" : "-20%",
              right: reverseLayout ? "-20%" : "auto",
              opacity: secondaryOpacity,
              transform: `translateY(${secondaryParallaxY + secondaryYEntrance + floatY * 0.5}px)`,
              filter: "blur(2px)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url(${secondaryImageSrc})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>

          {/* Main Mockup Card */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderRadius: `${32 * scale}px`,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(15px)",
              WebkitBackdropFilter: "blur(15px)",
              zIndex: 10,
              opacity: primaryOpacity,
              transform: `translateY(${primaryParallaxY + primaryYEntrance + floatY}px)`,
              overflow: "hidden",
              boxShadow: "0 30px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url(${primaryImageSrc})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
