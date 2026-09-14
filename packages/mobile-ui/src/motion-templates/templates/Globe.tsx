import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function GlobeTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read control values
  const globeImage = String(values.globeImage ?? "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/globe.jpeg");
  const rotationSpeed = Number(values.rotationSpeed ?? 30);
  const shadowColor = String(values.shadowColor ?? "#c3f4ff");
  const glowColor = String(values.glowColor ?? "rgba(255, 255, 255, 0.2)");
  const starColor = String(values.starColor ?? "#ffffff");
  const baseGlobeSize = Number(values.globeSize ?? 250);
  const showStars = values.showStars !== false;

  const titleText = String(values.title ?? "");
  const subtitleText = String(values.subtitle ?? "");
  const textColor = String(values.textColor ?? "#ffffff");

  // Determine scaling factor relative to 1080p composition height
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  
  // Calculate scaled sizes
  const resolvedGlobeSize = baseGlobeSize * scaleFactor * 2.2; // Adjusted size factor to look balanced
  const scale = resolvedGlobeSize / 250;

  // Background position shift
  // Moving X coordinate from 0 to 1.6 * resolvedGlobeSize over rotationSpeed seconds
  const rotationPeriod = Math.max(1, rotationSpeed);
  const progressInLoop = (time / rotationPeriod) % 1.0;
  const backgroundPositionX = progressInLoop * (1.6 * resolvedGlobeSize);

  // Twinkling opacities using cosine waves to map to a 0.1 to 1.0 range
  const getStarOpacity = (period: number) => {
    return 0.55 - 0.45 * Math.cos((2 * Math.PI * time) / period);
  };

  const stars = [
    { left: -20, top: 0, period: 3 },
    { left: -40, top: 30, period: 2 },
    { left: 350, top: 90, period: 4 },
    { left: 200, top: 290, period: 3 },
    { left: 50, top: 270, period: 1.5 },
    { left: 250, top: -50, period: 4 },
    { left: 290, top: 60, period: 2 },
  ];

  // Dynamic box-shadow construction
  const boxShadow = useMemo(() => {
    const cleanShadowColor = shadowColor.startsWith("#") ? shadowColor : "#c3f4ff";
    return [
      `0px 0px ${20 * scale}px ${glowColor}`,
      `inset ${-5 * scale}px 0px ${8 * scale}px ${cleanShadowColor}`,
      `inset ${15 * scale}px ${2 * scale}px ${25 * scale}px #000000`,
      `inset ${-24 * scale}px ${-2 * scale}px ${34 * scale}px ${cleanShadowColor}99`,
      `inset ${resolvedGlobeSize}px 0px ${44 * scale}px rgba(0,0,0,0.4)`,
      `inset ${150 * scale}px 0px ${38 * scale}px rgba(0,0,0,0.67)`
    ].join(", ");
  }, [scale, glowColor, shadowColor, resolvedGlobeSize]);

  // Font sizes
  const titleFontSize = Math.max(16, 48 * scaleFactor * 2.2);
  const subtitleFontSize = Math.max(12, 24 * scaleFactor * 2.2);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        backgroundImage: "radial-gradient(circle at center, #0c1428 0%, #02040a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Globe Container */}
      <div
        style={{
          position: "relative",
          width: `${resolvedGlobeSize}px`,
          height: `${resolvedGlobeSize}px`,
        }}
      >
        {/* Twinkling Stars */}
        {showStars &&
          stars.map((star, idx) => {
            const opacity = getStarOpacity(star.period);
            return (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  left: `${star.left * scale}px`,
                  top: `${star.top * scale}px`,
                  width: `${Math.max(2, 4 * scale)}px`,
                  height: `${Math.max(2, 4 * scale)}px`,
                  backgroundColor: starColor,
                  borderRadius: "50%",
                  opacity: opacity,
                  pointerEvents: "none",
                  boxShadow: `0 0 ${4 * scale}px ${starColor}`,
                }}
              />
            );
          })}

        {/* The rotating Earth sphere */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
            backgroundImage: `url('${globeImage}')`,
            backgroundSize: "cover",
            backgroundPosition: `${backgroundPositionX}px 0px`,
            backgroundRepeat: "repeat-x",
            boxShadow: boxShadow,
          }}
        />
      </div>

      {/* Optional Title & Subtitle overlay */}
      {(titleText || subtitleText) && (
        <div
          style={{
            marginTop: `${40 * scaleFactor * 2.2}px`,
            textAlign: "center",
            maxWidth: "80%",
            zIndex: 10,
          }}
        >
          {titleText && (
            <h2
              style={{
                fontSize: `${titleFontSize}px`,
                fontWeight: "bold",
                color: textColor,
                margin: 0,
                lineHeight: 1.2,
                textShadow: "0 4px 12px rgba(0,0,0,0.6)",
              }}
            >
              {titleText}
            </h2>
          )}
          {subtitleText && (
            <p
              style={{
                fontSize: `${subtitleFontSize}px`,
                color: `${textColor}cc`,
                marginTop: `${12 * scaleFactor * 2.2}px`,
                marginBottom: 0,
                lineHeight: 1.4,
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              }}
            >
              {subtitleText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
