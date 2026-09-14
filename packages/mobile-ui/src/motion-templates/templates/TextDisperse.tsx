import { useMemo } from "react";
import { motion } from "framer-motion";
import type { HtmlTemplateProps } from "../types";

interface Transform {
  x: number;
  y: number;
  rotationZ: number;
}

const transforms: Transform[] = [
  { x: -0.8, y: -0.6, rotationZ: -29 },
  { x: -0.2, y: -0.4, rotationZ: -6 },
  { x: -0.05, y: 0.1, rotationZ: 12 },
  { x: -0.05, y: -0.1, rotationZ: -9 },
  { x: -0.1, y: 0.55, rotationZ: 3 },
  { x: 0, y: -0.1, rotationZ: 9 },
  { x: 0, y: 0.15, rotationZ: -12 },
  { x: 0, y: 0.15, rotationZ: -17 },
  { x: 0, y: -0.65, rotationZ: 9 },
  { x: 0.1, y: 0.4, rotationZ: 12 },
  { x: 0, y: -0.15, rotationZ: -9 },
  { x: 0.2, y: 0.15, rotationZ: 12 },
  { x: 0.8, y: 0.6, rotationZ: 20 },
];

export function TextDisperseTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Read controls
  const text = String(values.text ?? "+923123456789");
  const fontColor = String(values.fontColor ?? "#ffffff");
  const baseSize = Number(values.fontSize ?? 72);
  const cycleDuration = Number(values.cycleDuration ?? 4);
  const disperseDuration = Number(values.disperseDuration ?? 2);
  const animationState = String(values.animationState ?? "auto-cycle");

  // 2. Scale factor based on canvas
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  const fontSizePx = Math.max(16, baseSize * scaleFactor * 2);

  // 3. Determine animated state
  const isAnimated = useMemo(() => {
    if (animationState === "always-dispersed") return true;
    if (animationState === "always-grouped") return false;
    // auto-cycle
    const activeTime = time % Math.max(0.5, cycleDuration);
    return activeTime < disperseDuration;
  }, [animationState, time, cycleDuration, disperseDuration]);

  // Split and render character blocks
  const characters = useMemo(() => {
    return text.split("").map((char, i) => {
      const transform = transforms[i % transforms.length];
      const spacing = char === " " ? "\u00A0" : char;
      return (
        <motion.span
          key={`${char}-${i}`}
          variants={{
            open: {
              x: `${transform.x}em`,
              y: `${transform.y}em`,
              rotateZ: transform.rotationZ,
              transition: { duration: 0.75, ease: [0.33, 1, 0.68, 1] },
              zIndex: 1,
            },
            closed: {
              x: 0,
              y: 0,
              rotateZ: 0,
              transition: { duration: 0.75, ease: [0.33, 1, 0.68, 1] },
              zIndex: 0,
            },
          }}
          animate={isAnimated ? "open" : "closed"}
          style={{ display: "inline-block" }}
        >
          {spacing}
        </motion.span>
      );
    });
  }, [text, isAnimated]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030303",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Decorative Radial Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      
      <div
        style={{
          fontSize: `${fontSizePx}px`,
          fontWeight: 700,
          color: fontColor,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.2em",
          userSelect: "none",
          textAlign: "center",
        }}
      >
        {characters}
      </div>
    </div>
  );
}
