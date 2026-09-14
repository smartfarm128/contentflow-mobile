import type { HtmlTemplateProps } from "../types";

export function LampTemplate({ progress, width, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Build lamps\nthe right way");
  const accentColor = String(values.accentColor ?? "#06b6d4"); // Cyan

  const scale = width / 1920;
  const fontSize = Math.max(16, 72 * scale);
  const lampWidthBase = 480 * scale;

  // Drive widths and opacities dynamically based on progress (0 to 1)
  const animProgress = Math.max(0, Math.min(1, progress));
  const beamWidth = `${lampWidthBase * (0.3 + 0.7 * animProgress)}px`;
  const beamOpacity = 0.2 + 0.8 * animProgress;
  const glowSize = `${250 * scale * (0.4 + 0.6 * animProgress)}px`;
  const textY = 100 * scale * (1 - animProgress);
  const textOpacity = 0.4 + 0.6 * animProgress;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030712", // slate-950
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      {/* Visual stage scaling wrapper */}
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 0,
        }}
      >
        {/* Left Conic Beam */}
        <div
          style={{
            position: "absolute",
            inset: "auto right-50%",
            height: `${224 * scale}px`,
            width: beamWidth,
            opacity: beamOpacity,
            backgroundImage: `conic-gradient(from 70deg at center top, ${accentColor}, transparent, transparent)`,
            transform: "translateY(5%)",
            transition: "width 0.15s ease-out, opacity 0.15s ease-out",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "100%",
              left: 0,
              backgroundColor: "#030712",
              height: `${160 * scale}px`,
              bottom: 0,
              maskImage: "linear-gradient(to top, white, transparent)",
              WebkitMaskImage: "linear-gradient(to top, white, transparent)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: `${160 * scale}px`,
              height: "100%",
              left: 0,
              backgroundColor: "#030712",
              bottom: 0,
              maskImage: "linear-gradient(to right, white, transparent)",
              WebkitMaskImage: "linear-gradient(to right, white, transparent)",
            }}
          />
        </div>

        {/* Right Conic Beam */}
        <div
          style={{
            position: "absolute",
            inset: "auto left-50%",
            height: `${224 * scale}px`,
            width: beamWidth,
            opacity: beamOpacity,
            backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, ${accentColor})`,
            transform: "translateY(5%)",
            transition: "width 0.15s ease-out, opacity 0.15s ease-out",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: `${160 * scale}px`,
              height: "100%",
              right: 0,
              backgroundColor: "#030712",
              bottom: 0,
              maskImage: "linear-gradient(to left, white, transparent)",
              WebkitMaskImage: "linear-gradient(to left, white, transparent)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "100%",
              right: 0,
              backgroundColor: "#030712",
              height: `${160 * scale}px`,
              bottom: 0,
              maskImage: "linear-gradient(to top, white, transparent)",
              WebkitMaskImage: "linear-gradient(to top, white, transparent)",
            }}
          />
        </div>

        {/* Ambient Overlays */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            height: `${192 * scale}px`,
            width: "100%",
            transform: "translateY(48px) scaleX(1.5)",
            backgroundColor: "#030712",
            filter: "blur(32px)",
          }}
        />
        
        {/* Glow core */}
        <div
          style={{
            position: "absolute",
            inset: "auto",
            zIndex: 10,
            height: `${144 * scale}px`,
            width: glowSize,
            transform: "translateY(-50%)",
            borderRadius: "50%",
            backgroundColor: accentColor,
            opacity: 0.3 * beamOpacity,
            filter: "blur(96px)",
            transition: "width 0.15s ease-out",
          }}
        />

        {/* Small intense light core */}
        <div
          style={{
            position: "absolute",
            inset: "auto",
            zIndex: 15,
            height: `${144 * scale}px`,
            width: `${256 * scale * (0.5 + 0.5 * animProgress)}px`,
            transform: `translateY(-${96 * scale}px)`,
            borderRadius: "50%",
            backgroundColor: accentColor,
            filter: "blur(32px)",
            opacity: 0.4,
          }}
        />

        {/* Center glowing boundary line */}
        <div
          style={{
            position: "absolute",
            inset: "auto",
            zIndex: 20,
            height: `${2 * scale}px`,
            width: beamWidth,
            transform: `translateY(-${112 * scale}px)`,
            backgroundColor: accentColor,
            boxShadow: `0 0 8px ${accentColor}`,
            transition: "width 0.15s ease-out",
          }}
        />

        {/* Dark spacer card */}
        <div
          style={{
            position: "absolute",
            inset: "auto",
            zIndex: 25,
            height: `${176 * scale}px`,
            width: "100%",
            transform: `translateY(-${200 * scale}px)`,
            backgroundColor: "#030712",
          }}
        />
      </div>

      {/* Copy Section */}
      <div
        style={{
          position: "relative",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(-${180 * scale}px)`,
        }}
      >
        <h1
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 500,
            textAlign: "center",
            letterSpacing: "-0.02em",
            backgroundImage: "linear-gradient(to bottom right, #cbd5e1, #64748b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.2,
            margin: 0,
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </h1>
      </div>
    </div>
  );
}
