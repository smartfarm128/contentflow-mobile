import { useEffect, useRef, useState, useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

// Helper for deterministic pseudo-random values
function seedRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

type ParticleData = {
  x: number;
  y: number;
  originalAlpha: number;
  r: number;
  g: number;
  b: number;
  angle: number;
  speed: number;
  shouldFadeQuickly: boolean;
};

export function VapourTextEffectTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Parse editable properties
  const texts = useMemo(() => {
    const raw = String(values.texts ?? "21st.dev, Is, Cool");
    return raw.split(",").map(t => t.trim()).filter(Boolean);
  }, [values.texts]);

  const fontFamily = String(values.fontFamily ?? "Inter, sans-serif");
  const fontSizeRaw = String(values.fontSize ?? "70px");
  const fontWeight = Number(values.fontWeight ?? 600);
  const colorHex = String(values.color ?? "#ffffff");
  const spread = Number(values.spread ?? 5);
  const density = Number(values.density ?? 5);
  const vaporizeDuration = Number(values.vaporizeDuration ?? 2);
  const fadeInDuration = Number(values.fadeInDuration ?? 1);
  const waitDuration = Number(values.waitDuration ?? 0.5);
  const direction = String(values.direction ?? "left-to-right");
  const alignment = String(values.alignment ?? "center") as "left" | "center" | "right";

  // Cycle states mapping
  const T_cycle = vaporizeDuration + fadeInDuration + waitDuration;
  const cycleTime = time % T_cycle;
  
  // Determine text indices
  const currentTextIndex = Math.floor(time / T_cycle) % texts.length;
  const currentText = texts[currentTextIndex] || "";
  const nextTextIndex = (currentTextIndex + 1) % texts.length;
  const nextText = texts[nextTextIndex] || "";

  // Parse color
  const rgb = useMemo(() => {
    // Parse hex color
    const hex = colorHex.replace("#", "");
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    }
    return { r: 255, g: 255, b: 255 };
  }, [colorHex]);

  // Compute font size based on width/height scale
  const resolvedFontSize = useMemo(() => {
    const sizeNum = parseInt(fontSizeRaw.replace("px", "")) || 70;
    return Math.round(Math.max(20, Math.min(sizeNum, width * 0.08)));
  }, [fontSizeRaw, width]);

  // Font string
  const fontStr = `${fontWeight} ${resolvedFontSize}px ${fontFamily}`;

  // Cache key for text sampling
  const [particlesCache, setParticlesCache] = useState<Record<string, { particles: ParticleData[]; boundaries: { left: number; right: number; width: number } }>>({});

  // Sample particles on canvas resize or value updates
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const newCache: typeof particlesCache = {};

    texts.forEach(text => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      ctx.font = fontStr;
      ctx.textAlign = alignment;
      ctx.textBaseline = "middle";

      let textX = width / 2;
      if (alignment === "left") textX = width * 0.1;
      if (alignment === "right") textX = width * 0.9;
      const textY = height / 2;

      // Measure text
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      let textLeft = textX - textWidth / 2;
      if (alignment === "left") textLeft = textX;
      if (alignment === "right") textLeft = textX - textWidth;

      const boundaries = {
        left: textLeft,
        right: textLeft + textWidth,
        width: textWidth,
      };

      ctx.fillText(text, textX, textY);

      // Sample pixels
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const particles: ParticleData[] = [];
      const sampleRate = Math.max(2, Math.round(resolvedFontSize / 20));

      const transformedDensity = 0.3 + (density / 10) * 0.7; // transform value density [0, 10] to [0.3, 1]

      let idx = 0;
      for (let y = 0; y < height; y += sampleRate) {
        for (let x = 0; x < width; x += sampleRate) {
          const pixelIndex = (y * width + x) * 4;
          const alpha = data[pixelIndex + 3];
          if (alpha > 0) {
            const originalAlpha = alpha / 255;
            
            // Deterministic particle variables
            const angle = seedRandom(idx * 12.34) * Math.PI * 2;
            
            // Font size vaporize spread factor interpolation
            let spreadFactor = 0.5;
            if (resolvedFontSize <= 20) spreadFactor = 0.2;
            else if (resolvedFontSize >= 100) spreadFactor = 1.5;
            else {
              spreadFactor = 0.2 + ((resolvedFontSize - 20) / 80) * 1.3;
            }
            const speed = (0.5 + seedRandom(idx * 56.78) * 1.0) * (spreadFactor * spread);
            const shouldFadeQuickly = seedRandom(idx * 90.12) > transformedDensity;

            particles.push({
              x,
              y,
              originalAlpha,
              r: data[pixelIndex],
              g: data[pixelIndex + 1],
              b: data[pixelIndex + 2],
              angle,
              speed,
              shouldFadeQuickly
            });
            idx++;
          }
        }
      }

      newCache[text] = { particles, boundaries };
    });

    setParticlesCache(newCache);
  }, [texts, fontStr, alignment, width, height, rgb, density, spread, resolvedFontSize]);

  // Render text particles to the screen based on progress
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (cycleTime < vaporizeDuration) {
      // 1. Vaporizing Phase: render current text vaporizing
      const textData = particlesCache[currentText];
      if (!textData) return;

      const p = cycleTime / vaporizeDuration;
      const waveX = direction === "left-to-right"
        ? textData.boundaries.left + textData.boundaries.width * p
        : textData.boundaries.right - textData.boundaries.width * p;

      textData.particles.forEach((part, i) => {
        const isVaporized = direction === "left-to-right"
          ? part.x <= waveX
          : part.x >= waveX;

        if (!isVaporized) {
          // Render original static particle
          ctx.fillStyle = `rgba(${part.r}, ${part.g}, ${part.b}, ${part.originalAlpha})`;
          ctx.fillRect(part.x, part.y, 1.5, 1.5);
        } else {
          // Simulate deterministic active time
          const startRatio = direction === "left-to-right"
            ? (part.x - textData.boundaries.left) / textData.boundaries.width
            : (textData.boundaries.right - part.x) / textData.boundaries.width;

          const tStart = startRatio * vaporizeDuration;
          const tActive = Math.max(0, cycleTime - tStart);

          // Standard physics integration over steps to keep it deterministic
          let px = part.x;
          let py = part.y;
          let vx = Math.cos(part.angle) * part.speed;
          let vy = Math.sin(part.angle) * part.speed;
          let opacity = part.originalAlpha;

          // Scaling spread and fade rates
          let spreadFactor = 0.5;
          if (resolvedFontSize <= 20) spreadFactor = 0.2;
          else if (resolvedFontSize >= 100) spreadFactor = 1.5;
          else {
            spreadFactor = 0.2 + ((resolvedFontSize - 20) / 80) * 1.3;
          }
          const multipliedSpread = spreadFactor * spread;
          const fadeRate = part.shouldFadeQuickly ? 1.0 : (0.25 * (2 / vaporizeDuration));

          const dt = 0.05;
          const steps = Math.min(40, Math.floor(tActive / dt));

          for (let step = 0; step < steps; step++) {
            const dx = part.x - px;
            const dy = part.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const damping = Math.max(0.95, 1 - dist / (100 * multipliedSpread));
            
            // Deterministic random jitter per step
            const randVal = seedRandom(i * 10 + step);
            const jitterX = (randVal - 0.5) * multipliedSpread * 3;
            const jitterY = (seedRandom(i * 20 + step) - 0.5) * multipliedSpread * 3;

            vx = (vx + jitterX + dx * 0.002) * damping;
            vy = (vy + jitterY + dy * 0.002) * damping;

            const maxV = multipliedSpread * 2;
            const currV = Math.sqrt(vx * vx + vy * vy);
            if (currV > maxV) {
              vx *= maxV / currV;
              vy *= maxV / currV;
            }

            px += vx * dt * 20;
            py += vy * dt * 10;
            opacity = Math.max(0, opacity - dt * fadeRate);
          }

          if (opacity > 0.01) {
            ctx.fillStyle = `rgba(${part.r}, ${part.g}, ${part.b}, ${opacity})`;
            ctx.fillRect(px, py, 1.5, 1.5);
          }
        }
      });
    } else if (cycleTime < vaporizeDuration + fadeInDuration) {
      // 2. Fading In Phase: render next text fading in
      const textData = particlesCache[nextText];
      if (!textData) return;

      const pFade = (cycleTime - vaporizeDuration) / fadeInDuration;
      textData.particles.forEach((part) => {
        ctx.fillStyle = `rgba(${part.r}, ${part.g}, ${part.b}, ${part.originalAlpha * pFade})`;
        ctx.fillRect(part.x, part.y, 1.5, 1.5);
      });
    } else {
      // 3. Waiting Phase: render next text static at 100%
      const textData = particlesCache[nextText];
      if (!textData) return;

      textData.particles.forEach((part) => {
        ctx.fillStyle = `rgba(${part.r}, ${part.g}, ${part.b}, ${part.originalAlpha})`;
        ctx.fillRect(part.x, part.y, 1.5, 1.5);
      });
    }
  }, [
    particlesCache, 
    cycleTime, 
    currentText, 
    nextText, 
    vaporizeDuration, 
    fadeInDuration, 
    direction, 
    width, 
    height, 
    resolvedFontSize, 
    spread
  ]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "none"
        }}
      />
    </div>
  );
}
