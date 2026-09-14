import { useEffect, useRef, useState } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function PixelArtImageTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const src = String(values.src ?? placeholderImage("matfitcrop"));
  const cellSize = Number(values.cellSize ?? 4);
  const dotScale = Number(values.dotScale ?? 0.9);
  const shape = String(values.shape ?? "square") as "circle" | "square";
  const backgroundColor = String(values.backgroundColor ?? "#000000");
  const grayscale = values.grayscale === true;
  const dropoutStrength = Number(values.dropoutStrength ?? 0.4);
  const distortionStrength = Number(values.distortionStrength ?? 5.0);
  const distortionRadius = Number(values.distortionRadius ?? 120);
  const distortionMode = String(values.distortionMode ?? "swirl") as "repel" | "attract" | "swirl";
  const tintColor = String(values.tintColor ?? "#FFFFFF");
  const tintStrength = Number(values.tintStrength ?? 0.2);
  const jitterStrength = Number(values.jitterStrength ?? 4);
  const jitterSpeed = Number(values.jitterSpeed ?? 4);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Cached samples structure
  const samplesRef = useRef<
    Array<{
      x: number;
      y: number;
      r: number;
      g: number;
      b: number;
      a: number;
      drop: boolean;
      seed: number;
    }>
  >([]);

  // 1. Process image on load/change
  useEffect(() => {
    setImageLoaded(false);
    samplesRef.current = [];

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const displayWidth = width;
      const displayHeight = height;

      // Create an offscreen canvas to sample pixel colors
      const offscreen = document.createElement("canvas");
      offscreen.width = Math.max(1, displayWidth);
      offscreen.height = Math.max(1, displayHeight);
      const off = offscreen.getContext("2d");
      if (!off) return;

      // Draw image to fill offscreen
      const iw = img.naturalWidth || displayWidth;
      const ih = img.naturalHeight || displayHeight;
      const scaleFactor = Math.max(displayWidth / iw, displayHeight / ih);
      const dw = Math.ceil(iw * scaleFactor);
      const dh = Math.ceil(ih * scaleFactor);
      const dx = Math.floor((displayWidth - dw) / 2);
      const dy = Math.floor((displayHeight - dh) / 2);
      off.drawImage(img, dx, dy, dw, dh);

      let imageData: ImageData;
      try {
        imageData = off.getImageData(0, 0, offscreen.width, offscreen.height);
      } catch (err) {
        console.error("Canvas security error sampling pixel art:", err);
        return;
      }

      const data = imageData.data;
      const stride = offscreen.width * 4;

      const luminanceAt = (px: number, py: number) => {
        const ix = Math.max(0, Math.min(offscreen.width - 1, px));
        const iy = Math.max(0, Math.min(offscreen.height - 1, py));
        const idx = iy * stride + ix * 4;
        return 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
      };

      const hash2D = (ix: number, iy: number) => {
        const s = Math.sin(ix * 12.9898 + iy * 78.233) * 43758.5453123;
        return s - Math.floor(s);
      };

      // Parse tint color
      let tintRGB: [number, number, number] | null = null;
      if (tintColor && tintStrength > 0) {
        const parse = (c: string): [number, number, number] | null => {
          if (c.startsWith("#")) {
            const hex = c.slice(1);
            if (hex.length === 3) {
              return [
                parseInt(hex[0] + hex[0], 16),
                parseInt(hex[1] + hex[1], 16),
                parseInt(hex[2] + hex[2], 16),
              ];
            }
            return [
              parseInt(hex.slice(0, 2), 16),
              parseInt(hex.slice(2, 4), 16),
              parseInt(hex.slice(4, 6), 16),
            ];
          }
          return null;
        };
        tintRGB = parse(tintColor);
      }

      const samples = [];
      for (let y = 0; y < offscreen.height; y += cellSize) {
        const cy = Math.min(offscreen.height - 1, y + Math.floor(cellSize / 2));
        for (let x = 0; x < offscreen.width; x += cellSize) {
          const cx = Math.min(offscreen.width - 1, x + Math.floor(cellSize / 2));

          // Sample average center pixel neighborhood
          let r = 0, g = 0, b = 0, a = 0, count = 0;
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              const sx = Math.max(0, Math.min(offscreen.width - 1, cx + ox));
              const sy = Math.max(0, Math.min(offscreen.height - 1, cy + oy));
              const idx = sy * stride + sx * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              a += data[idx + 3] / 255;
              count++;
            }
          }
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          a = a / count;

          if (grayscale) {
            const L = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
            r = L; g = L; b = L;
          } else if (tintRGB && tintStrength > 0) {
            const k = Math.max(0, Math.min(1, tintStrength));
            r = Math.round(r * (1 - k) + tintRGB[0] * k);
            g = Math.round(g * (1 - k) + tintRGB[1] * k);
            b = Math.round(b * (1 - k) + tintRGB[2] * k);
          }

          const Lc = luminanceAt(cx, cy);
          const Lx1 = luminanceAt(cx - 1, cy);
          const Lx2 = luminanceAt(cx + 1, cy);
          const Ly1 = luminanceAt(cx, cy - 1);
          const Ly2 = luminanceAt(cx, cy + 1);
          const grad = Math.abs(Lx2 - Lx1) + Math.abs(Ly2 - Ly1) + Math.abs(Lc - (Lx1 + Lx2 + Ly1 + Ly2) / 4);
          const gradientNorm = Math.max(0, Math.min(1, grad / 255));
          const dropoutProb = Math.max(0, Math.min(1, (1 - gradientNorm) * dropoutStrength));
          const drop = hash2D(cx, cy) < dropoutProb;
          const seed = hash2D(cx, cy);

          samples.push({ x, y, r, g, b, a, drop, seed });
        }
      }

      samplesRef.current = samples;
      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error("Failed to load image for PixelArtImageTemplate:", src);
    };
  }, [src, width, height, cellSize, grayscale, tintColor, tintStrength, dropoutStrength]);

  // 2. Playhead redraw triggered when time, dimension, or samples load changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Clear background
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    const samples = samplesRef.current;
    const dotSize = Math.max(1, Math.floor(cellSize * dotScale));

    // Simulated orbit path of vector pointer based on time
    const mx = width / 2 + Math.cos(time * 1.5) * (width / 3.5);
    const my = height / 2 + Math.sin(time * 2.2) * (height / 4.5);
    const sigma = Math.max(1, distortionRadius * 0.5);
    const tVal = time * jitterSpeed;

    for (const s of samples) {
      if (s.drop || s.a <= 0) continue;

      let drawX = s.x + cellSize / 2;
      let drawY = s.y + cellSize / 2;

      const dx = drawX - mx;
      const dy = drawY - my;
      const dist2 = dx * dx + dy * dy;
      const falloff = Math.exp(-dist2 / (2 * sigma * sigma));

      if (falloff > 0.0005) {
        if (distortionMode === "repel") {
          const dist = Math.sqrt(dist2) + 0.0001;
          drawX += (dx / dist) * distortionStrength * falloff;
          drawY += (dy / dist) * distortionStrength * falloff;
        } else if (distortionMode === "attract") {
          const dist = Math.sqrt(dist2) + 0.0001;
          drawX -= (dx / dist) * distortionStrength * falloff;
          drawY -= (dy / dist) * distortionStrength * falloff;
        } else if (distortionMode === "swirl") {
          const angle = distortionStrength * 0.05 * falloff;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          const rx = cosA * dx - sinA * dy;
          const ry = sinA * dx + cosA * dy;
          drawX = mx + rx;
          drawY = my + ry;
        }

        if (jitterStrength > 0) {
          const k = s.seed * 43758.5453;
          const jx = Math.sin(tVal + k) * jitterStrength * falloff;
          const jy = Math.cos(tVal + k * 1.13) * jitterStrength * falloff;
          drawX += jx;
          drawY += jy;
        }
      }

      ctx.globalAlpha = s.a;
      ctx.fillStyle = `rgb(${s.r}, ${s.g}, ${s.b})`;

      if (shape === "circle") {
        ctx.beginPath();
        ctx.arc(drawX, drawY, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(drawX - dotSize / 2, drawY - dotSize / 2, dotSize, dotSize);
      }
    }

    ctx.globalAlpha = 1;
  }, [imageLoaded, time, width, height, cellSize, dotScale, shape, backgroundColor, distortionStrength, distortionRadius, distortionMode, jitterStrength, jitterSpeed]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: backgroundColor || "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
        }}
      />
      {!imageLoaded && (
        <div style={{ position: "absolute", color: "#ffffff", fontSize: "16px", fontFamily: "Inter, sans-serif" }}>
          Loading Pixel Grid...
        </div>
      )}
    </div>
  );
}
