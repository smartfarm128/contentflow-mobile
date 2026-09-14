import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function ImageRevealTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const imageSrc = String(values.imageSrc ?? "https://images.unsplash.com/photo-1638551145269-f7925c37e672?q=80&w=1200&auto=format&fit=crop");
  const maxRadius = Number(values.maxRadius ?? 120);
  const speed = Number(values.speed ?? 1.0);
  const orbitRadius = Number(values.orbitRadius ?? 220);
  const mode = String(values.mode ?? "orbit"); // orbit, sweep-x, sweep-y, pulse
  const textTitle = String(values.title ?? "REVEAL MASK");

  const scaleFactor = Math.min(width, height) / 1080;
  const scaledMaxRadius = maxRadius * scaleFactor;
  const scaledOrbit = orbitRadius * scaleFactor;

  // Compute layout dimensions
  const containerWidth = width * 0.8;
  const containerHeight = containerWidth * 9 / 16;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  // Determine playhead-deterministic focal coordinates
  const { focalX, focalY, currentRadius } = useMemo(() => {
    let fx = centerX;
    let fy = centerY;
    let rad = scaledMaxRadius;

    if (mode === "orbit") {
      const angle = time * speed * 2;
      fx = centerX + scaledOrbit * Math.cos(angle);
      fy = centerY + scaledOrbit * Math.sin(angle);
    } else if (mode === "sweep-x") {
      const progress = (Math.sin(time * speed) + 1) / 2; // oscillates 0 to 1
      fx = containerWidth * 0.15 + (containerWidth * 0.7) * progress;
    } else if (mode === "sweep-y") {
      const progress = (Math.cos(time * speed) + 1) / 2;
      fy = containerHeight * 0.15 + (containerHeight * 0.7) * progress;
    } else if (mode === "pulse") {
      const pulse = 0.5 + 0.5 * Math.sin(time * speed * 4);
      rad = scaledMaxRadius * (0.3 + 0.7 * pulse);
    }

    return { focalX: fx, focalY: fy, currentRadius: rad };
  }, [time, speed, mode, scaledMaxRadius, scaledOrbit, containerWidth, containerHeight, centerX, centerY]);

  // Construct radial mask gradients matching CSS format
  const softEdge = 40 * scaleFactor;
  const maskStyle = {
    WebkitMaskImage: `radial-gradient(circle ${currentRadius}px at ${focalX}px ${focalY}px, transparent 0%, rgba(0,0,0,0.1) ${currentRadius - softEdge}px, rgba(0,0,0,0.8) ${currentRadius}px, black 100%)`,
    maskImage: `radial-gradient(circle ${currentRadius}px at ${focalX}px ${focalY}px, transparent 0%, rgba(0,0,0,0.1) ${currentRadius - softEdge}px, rgba(0,0,0,0.8) ${currentRadius}px, black 100%)`,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#050505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Aspect ratio bounding container */}
      <div
        style={{
          position: "relative",
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          borderRadius: `${16 * scaleFactor}px`,
          border: "0.5px solid rgba(255,255,255,0.15)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <img
          src={imageSrc}
          alt="Base reveal texture"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Mask overlay containing blurred dark background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            ...maskStyle,
          }}
        />

        {/* Ambient lighting ring overlay around focal point */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle ${currentRadius + 30 * scaleFactor}px at ${focalX}px ${focalY}px, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 60%, transparent 100%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>

      {textTitle && (
        <div
          style={{
            marginTop: `${40 * scaleFactor}px`,
            textAlign: "center",
            opacity: 0.8,
          }}
        >
          <span
            style={{
              fontSize: `${Math.max(16, 28 * scaleFactor)}px`,
              fontWeight: 700,
              color: "#a3a3a3",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            {textTitle}
          </span>
        </div>
      )}
    </div>
  );
}
