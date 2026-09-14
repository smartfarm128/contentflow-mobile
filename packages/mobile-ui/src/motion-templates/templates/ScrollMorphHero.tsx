import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

const TOTAL_IMAGES = 20;

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export function ScrollMorphHeroTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const introText = String(values.introText ?? "The future is built on AI.");
  const subText = String(values.subText ?? "SCROLL TO EXPLORE");
  const activeTitle = String(values.activeTitle ?? "Explore Our Vision");
  const activeDescription = String(values.activeDescription ?? "Discover a world where technology meets creativity. Scroll through our curated collection of innovations designed to shape the future.");
  const backgroundColor = String(values.backgroundColor ?? "#FAFAFA");

  const IMAGES = useMemo(() => [
    String(values.image1 ?? "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80"),
    String(values.image2 ?? "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=300&q=80"),
    String(values.image3 ?? "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=80"),
    String(values.image4 ?? "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80"),
    String(values.image5 ?? "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&q=80"),
    String(values.image6 ?? "https://images.unsplash.com/photo-1506765515384-028b60a970df?w=300&q=80"),
    String(values.image7 ?? "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&q=80"),
    String(values.image8 ?? "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300&q=80"),
    String(values.image9 ?? "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=300&q=80"),
    String(values.image10 ?? "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80"),
    String(values.image11 ?? "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80"),
    String(values.image12 ?? "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=300&q=80"),
    String(values.image13 ?? "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&q=80"),
    String(values.image14 ?? "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=300&q=80"),
    String(values.image15 ?? "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=300&q=80"),
    String(values.image16 ?? "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=300&q=80"),
    String(values.image17 ?? "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=300&q=80"),
    String(values.image18 ?? "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=300&q=80"),
    String(values.image19 ?? "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=300&q=80"),
    String(values.image20 ?? "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=300&q=80"),
  ], [values]);

  // 2. Sizing Constants & Scale Factor
  const scaleFactor = Math.min(width, height) / 1080;
  const cardW = 60 * scaleFactor * 2.0; // Scaled up slightly for 1080p canvas presentation
  const cardH = 85 * scaleFactor * 2.0;

  // 3. Set up deterministic scatter positions so they are identical across frames
  const scatterPositions = useMemo(() => {
    // Standard pseudo-random array seeded by index
    return IMAGES.map((_, i) => {
      const xSeed = Math.sin(i * 9876.54) * 400 * scaleFactor;
      const ySeed = Math.cos(i * 1234.56) * 300 * scaleFactor;
      const rotSeed = Math.sin(i * 4321.09) * 90;
      return {
        x: xSeed,
        y: ySeed,
        rotation: rotSeed,
        scale: 0.6,
        opacity: 0,
      };
    });
  }, [scaleFactor]);

  // 4. Derive Phase Variables based on Playhead Progress
  // - Phase 1: progress 0.0 -> 0.10: Scatter -> Line
  // - Phase 2: progress 0.10 -> 0.25: Line -> Circle
  // - Phase 3: progress 0.25 -> 0.65: Circle -> Bottom Arc (Morph)
  // - Phase 4: progress 0.65 -> 1.00: Bottom Arc Rotation / Scroll
  
  // Progress sub-intervals
  const scatterToLineProgress = clamp(progress / 0.10, 0, 1);
  const lineToCircleProgress = clamp((progress - 0.10) / 0.15, 0, 1);
  const morphProgress = clamp((progress - 0.25) / 0.40, 0, 1);
  const scrollProgress = clamp((progress - 0.65) / 0.35, 0, 1);

  // Content Visibility
  const introOpacity = clamp(1 - morphProgress * 2.5, 0, 1); // fades out early in morph
  const introBlur = (1 - introOpacity) * 12;
  
  const contentOpacity = clamp((morphProgress - 0.7) / 0.3, 0, 1); // fades in late in morph
  const contentY = (1 - contentOpacity) * 20 * scaleFactor;

  // Dynamic calculations for positions
  const cardCoordinates = useMemo(() => {
    return IMAGES.slice(0, TOTAL_IMAGES).map((_, i) => {
      // Line Position
      const lineSpacing = 70 * scaleFactor * 1.5;
      const lineTotalWidth = TOTAL_IMAGES * lineSpacing;
      const lineX = i * lineSpacing - lineTotalWidth / 2 + (lineSpacing / 2);
      const linePos = { x: lineX, y: 0, rotation: 0, scale: 1.0, opacity: 1 };

      // Circle Position
      const circleRadius = Math.min(width, height) * 0.32;
      const circleAngle = (i / TOTAL_IMAGES) * 360;
      const circleRad = (circleAngle * Math.PI) / 180;
      const circlePos = {
        x: Math.cos(circleRad) * circleRadius,
        y: Math.sin(circleRad) * circleRadius,
        rotation: circleAngle + 90,
        scale: 1.0,
        opacity: 1,
      };

      // Bottom Arc Position
      const baseRadius = Math.min(width, height * 1.3);
      const arcRadius = baseRadius * 1.1;
      const arcApexY = height * 0.32;
      const arcCenterY = arcApexY + arcRadius;

      const spreadAngle = 130;
      const startAngle = -90 - (spreadAngle / 2);
      const step = spreadAngle / (TOTAL_IMAGES - 1);

      // Bounded rotation over scrollProgress
      const maxRotation = spreadAngle * 0.8;
      const boundedRotation = -scrollProgress * maxRotation;

      const currentArcAngle = startAngle + (i * step) + boundedRotation;
      const arcRad = (currentArcAngle * Math.PI) / 180;

      const arcPos = {
        x: Math.cos(arcRad) * arcRadius,
        y: Math.sin(arcRad) * arcRadius + arcCenterY,
        rotation: currentArcAngle + 90,
        scale: 1.6,
        opacity: 1,
      };

      // Interpolation sequence
      // 1. Scatter to Line
      let targetX = lerp(scatterPositions[i].x, linePos.x, scatterToLineProgress);
      let targetY = lerp(scatterPositions[i].y, linePos.y, scatterToLineProgress);
      let targetRot = lerp(scatterPositions[i].rotation, linePos.rotation, scatterToLineProgress);
      let targetScale = lerp(scatterPositions[i].scale, linePos.scale, scatterToLineProgress);
      let targetOpacity = lerp(scatterPositions[i].opacity, linePos.opacity, scatterToLineProgress);

      // 2. Line to Circle
      if (progress > 0.10) {
        targetX = lerp(linePos.x, circlePos.x, lineToCircleProgress);
        targetY = lerp(linePos.y, circlePos.y, lineToCircleProgress);
        targetRot = lerp(linePos.rotation, circlePos.rotation, lineToCircleProgress);
        targetScale = lerp(linePos.scale, circlePos.scale, lineToCircleProgress);
        targetOpacity = lerp(linePos.opacity, circlePos.opacity, lineToCircleProgress);
      }

      // 3. Circle to Arc
      if (progress > 0.25) {
        targetX = lerp(circlePos.x, arcPos.x, morphProgress);
        targetY = lerp(circlePos.y, arcPos.y, morphProgress);
        targetRot = lerp(circlePos.rotation, arcPos.rotation, morphProgress);
        targetScale = lerp(circlePos.scale, arcPos.scale, morphProgress);
        targetOpacity = lerp(circlePos.opacity, arcPos.opacity, morphProgress);
      }

      return {
        x: targetX,
        y: targetY,
        rotation: targetRot,
        scale: targetScale,
        opacity: targetOpacity,
      };
    });
  }, [progress, scatterPositions, scatterToLineProgress, lineToCircleProgress, morphProgress, scrollProgress, width, height, scaleFactor]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: backgroundColor,
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Perspective Wrapper */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          perspective: "1000px",
        }}
      >
        {/* Background Grid Pattern (wow factor layout) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundSize: `${80 * scaleFactor}px ${80 * scaleFactor}px`,
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
            `,
            maskImage: "radial-gradient(circle at center, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 80%)",
            opacity: 0.8,
            pointerEvents: "none",
          }}
        />

        {/* Intro Text Overlay (fades out) */}
        {introOpacity > 0 && (
          <div
            style={{
              position: "absolute",
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              pointerEvents: "none",
              opacity: introOpacity,
              filter: `blur(${introBlur}px)`,
            }}
          >
            <h1
              style={{
                fontSize: `${40 * scaleFactor}px`,
                fontWeight: 600,
                color: "#1f2937",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {introText}
            </h1>
            <p
              style={{
                marginTop: `${16 * scaleFactor}px`,
                fontSize: `${12 * scaleFactor}px`,
                fontWeight: 700,
                color: "#9ca3af",
                letterSpacing: "0.2em",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              {subText}
            </p>
          </div>
        )}

        {/* Active Content Overlay (fades in) */}
        {contentOpacity > 0 && (
          <div
            style={{
              position: "absolute",
              top: `${140 * scaleFactor}px`,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              pointerEvents: "none",
              opacity: contentOpacity,
              transform: `translate3d(0, ${contentY}px, 0)`,
              maxWidth: `${720 * scaleFactor}px`,
              padding: `0 ${32 * scaleFactor}px`,
            }}
          >
            <h2
              style={{
                fontSize: `${54 * scaleFactor}px`,
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.03em",
                marginBottom: `${16 * scaleFactor}px`,
                margin: 0,
              }}
            >
              {activeTitle}
            </h2>
            <p
              style={{
                fontSize: `${18 * scaleFactor}px`,
                color: "#4b5563",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {activeDescription}
            </p>
          </div>
        )}

        {/* Cards container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transformStyle: "preserve-3d",
          }}
        >
          {IMAGES.slice(0, TOTAL_IMAGES).map((src, i) => {
            const coord = cardCoordinates[i];
            if (!coord || coord.opacity <= 0.01) return null;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: `${cardW}px`,
                  height: `${cardH}px`,
                  transform: `translate3d(${coord.x}px, ${coord.y}px, 0) rotateZ(${coord.rotation}deg) scale(${coord.scale})`,
                  opacity: coord.opacity,
                  transformStyle: "preserve-3d",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
                  borderRadius: `${12 * scaleFactor}px`,
                  overflow: "hidden",
                  backgroundColor: "#e5e7eb",
                  border: "1px solid rgba(255,255,255,0.2)",
                  pointerEvents: "none",
                }}
              >
                <img
                  src={src}
                  alt={`card-${i}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.06)",
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
