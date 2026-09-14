import { useEffect, useRef, useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function SparklesTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const density = Number(values.density ?? 150); // Scale down count for editor performance
  const color = String(values.color ?? "#ffffff");
  const size = Number(values.size ?? 2.5);
  const minSize = Number(values.minSize ?? 0.8);
  const speed = Number(values.speed ?? 1.5);
  const minSpeed = Number(values.minSpeed ?? 0.3);
  const opacity = Number(values.opacity ?? 1);
  const opacitySpeed = Number(values.opacitySpeed ?? 3);
  const minOpacity = Number(values.minOpacity ?? 0.1);
  const direction = String(values.direction ?? "none");

  // Generate deterministic particles based on a seeded random number generator
  const particles = useMemo(() => {
    const list = [];
    let seed = 12345;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 300; i++) {
      list.push({
        xPct: random(),
        yPct: random(),
        sizeVal: minSize + (size - minSize) * random(),
        speedVal: minSpeed + (speed - minSpeed) * random(),
        opacityPhase: random() * Math.PI * 2,
        angle: random() * Math.PI * 2,
      });
    }
    return list;
  }, [size, minSize, speed, minSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = color;
    const count = Math.min(density, particles.length);

    for (let i = 0; i < count; i++) {
      const p = particles[i];

      // Calculate translation based on direction and time
      let dx = 0;
      let dy = 0;

      if (direction === "top" || direction === "up") {
        dy = -p.speedVal * time * 50;
      } else if (direction === "bottom" || direction === "down") {
        dy = p.speedVal * time * 50;
      } else if (direction === "left") {
        dx = -p.speedVal * time * 50;
      } else if (direction === "right") {
        dx = p.speedVal * time * 50;
      } else if (direction === "none") {
        // Slow float around original spot
        dx = Math.cos(time * 0.5 + p.opacityPhase) * 15;
        dy = Math.sin(time * 0.5 + p.opacityPhase) * 15;
      } else {
        // Default slow drift
        dx = Math.cos(p.angle) * p.speedVal * time * 20;
        dy = Math.sin(p.angle) * p.speedVal * time * 20;
      }

      // Keep coordinates wrapped within canvas boundaries
      let x = (p.xPct * width + dx) % width;
      let y = (p.yPct * height + dy) % height;
      if (x < 0) x += width;
      if (y < 0) y += height;

      // Opacity oscillation
      const op = minOpacity + (opacity - minOpacity) * (0.5 + 0.5 * Math.sin(time * opacitySpeed + p.opacityPhase));

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, op));
      ctx.beginPath();
      ctx.arc(x, y, p.sizeVal, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [particles, time, width, height, density, color, direction, opacity, opacitySpeed, minOpacity]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
