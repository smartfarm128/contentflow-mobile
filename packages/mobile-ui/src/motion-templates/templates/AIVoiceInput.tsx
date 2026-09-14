import { useEffect, useRef } from "react";
import type { HtmlTemplateProps } from "../types";

export function AIVoiceInputTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Read controls
  const title = String(values.title ?? "AI Voice Agent");
  const statusListening = String(values.statusListening ?? "Listening...");
  const statusProcessing = String(values.statusProcessing ?? "Processing...");
  const statusResponding = String(values.statusResponding ?? "Analyzing response...");
  const statusIdle = String(values.statusIdle ?? "Click to speak");
  const accentColor = String(values.accentColor ?? "#00f2fe"); // Neon cyan
  const secondaryColor = String(values.secondaryColor ?? "#7f00ff"); // Purple
  const voiceBarsCount = Number(values.voiceBarsCount ?? 64);
  const cycleDuration = Number(values.cycleDuration ?? 8);

  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Let's determine the state based on cycleTime
  const t = time % cycleDuration;
  const progress = t / cycleDuration;

  let statusText = statusIdle;
  let state: "listening" | "processing" | "responding" = "listening";

  if (progress < 0.5) {
    statusText = statusListening;
    state = "listening";
  } else if (progress < 0.75) {
    statusText = statusProcessing;
    state = "processing";
  } else {
    statusText = statusResponding;
    state = "responding";
  }

  // Draw voice wave bars or waves on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const centerY = h / 2;

    const bars = voiceBarsCount;
    const barWidth = 3 * scaleFactor;
    const gap = 4 * scaleFactor;
    const totalWidth = bars * (barWidth + gap) - gap;
    const startX = (w - totalWidth) / 2;

    // Draw bars
    for (let i = 0; i < bars; i++) {
      const x = startX + i * (barWidth + gap);
      
      // Calculate normalized position relative to center (-1 to 1)
      const normPos = (i - bars / 2) / (bars / 2);
      const envelope = Math.exp(-4 * normPos * normPos); // bell curve to taper edges

      let heightMultiplier = 0;

      if (state === "listening") {
        // Active sine wave summation
        const wave1 = Math.sin(i * 0.25 - time * 8) * 28;
        const wave2 = Math.cos(i * 0.15 + time * 12) * 16;
        const wave3 = Math.sin(i * 0.4 + time * 4) * 8;
        heightMultiplier = (wave1 + wave2 + wave3) * envelope * scaleFactor;
      } else if (state === "processing") {
        // Fast, low amplitude wave
        const wave1 = Math.sin(i * 0.6 - time * 25) * 8;
        heightMultiplier = wave1 * envelope * scaleFactor;
      } else {
        // Slow pulsing waves
        const wave1 = Math.sin(i * 0.15 - time * 3) * 20;
        const wave2 = Math.cos(time * 2) * 12;
        heightMultiplier = (wave1 + wave2) * envelope * scaleFactor;
      }

      // Ensure minimum height
      const barHeight = Math.max(3 * scaleFactor, Math.abs(heightMultiplier));

      // Draw bar symmetrically
      const y = centerY - barHeight / 2;

      // Color gradient
      const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
      grad.addColorStop(0, accentColor);
      grad.addColorStop(0.5, secondaryColor);
      grad.addColorStop(1, accentColor);

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Draw rounded rectangle
      ctx.roundRect ? ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2) : ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();
    }
  }, [state, time, voiceBarsCount, scaleFactor, accentColor, secondaryColor]);

  // Scaled dimensions
  const outerSize = 650 * scaleFactor;
  const buttonSize = 120 * scaleFactor;
  const iconSize = 48 * scaleFactor;
  const statusFontSize = 24 * scaleFactor;
  const timerFontSize = 18 * scaleFactor;
  const titleFontSize = 42 * scaleFactor;

  // Formatted duration
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const timerText = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#05070c",
        backgroundImage: "radial-gradient(circle at center, #0b111e 0%, #020407 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Glow Rings (Pulsing) */}
      <div
        style={{
          position: "absolute",
          width: `${outerSize}px`,
          height: `${outerSize}px`,
          borderRadius: "50%",
          border: `1px solid ${accentColor}10`,
          background: `radial-gradient(circle, ${accentColor}05 0%, transparent 70%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${1 + Math.sin(time * 2) * 0.03})`,
          transition: "transform 0.1s linear",
        }}
      >
        <div
          style={{
            width: `${outerSize * 0.75}px`,
            height: `${outerSize * 0.75}px`,
            borderRadius: "50%",
            border: `1px solid ${secondaryColor}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 + Math.cos(time * 3) * 0.02})`,
          }}
        />
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: `${titleFontSize}px`,
          fontWeight: 700,
          color: "#ffffff",
          marginBottom: `${50 * scaleFactor}px`,
          letterSpacing: "-0.02em",
          background: "linear-gradient(to right, #ffffff, #94a3b8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          zIndex: 10,
        }}
      >
        {title}
      </div>

      {/* Mic Trigger Button */}
      <div
        style={{
          position: "relative",
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 30px ${accentColor}1c, inset 0 2px 4px rgba(255, 255, 255, 0.15)`,
          zIndex: 10,
          transform: state === "listening" ? `scale(${1 + Math.sin(time * 5) * 0.05})` : "scale(1)",
        }}
      >
        {state === "processing" ? (
          // Rotating loader block
          <div
            style={{
              width: `${iconSize * 0.6}px`,
              height: `${iconSize * 0.6}px`,
              border: `${3 * scaleFactor}px solid ${accentColor}33`,
              borderTop: `${3 * scaleFactor}px solid ${accentColor}`,
              borderRadius: "50%",
              transform: `rotate(${time * 360}deg)`,
            }}
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke={state === "listening" ? accentColor : "#94a3b8"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              width: `${iconSize}px`,
              height: `${iconSize}px`,
            }}
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </div>

      {/* Timer text */}
      <div
        style={{
          marginTop: `${20 * scaleFactor}px`,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: `${timerFontSize}px`,
          color: "#94a3b8",
          fontWeight: 500,
          zIndex: 10,
        }}
      >
        {timerText}
      </div>

      {/* Visualizer Canvas */}
      <canvas
        ref={canvasRef}
        width={400 * scaleFactor}
        height={100 * scaleFactor}
        style={{
          width: `${400 * scaleFactor}px`,
          height: `${100 * scaleFactor}px`,
          marginTop: `${30 * scaleFactor}px`,
          marginBottom: `${30 * scaleFactor}px`,
          zIndex: 10,
        }}
      />

      {/* Listening Status Text */}
      <div
        style={{
          fontSize: `${statusFontSize}px`,
          fontWeight: 600,
          color: "#e2e8f0",
          letterSpacing: "-0.01em",
          zIndex: 10,
          opacity: state === "listening" ? 0.9 : 0.6,
        }}
      >
        {statusText}
      </div>
    </div>
  );
}
