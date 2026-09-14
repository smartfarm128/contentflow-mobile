import type { HtmlTemplateProps } from "../types";

export function AnimatedCounterTemplate({ time, width, values }: HtmlTemplateProps) {
  const start = Number(values.start ?? 0);
  const end = Number(values.end ?? 999);
  const titleText = String(values.title ?? "ACTIVE USERS");
  const cycleDuration = Number(values.cycleDuration ?? 4.0);
  const accentColor = String(values.accentColor ?? "#3b82f6");
  const bgGradientColor = String(values.bgGradientColor ?? "#1d4ed8");

  const scale = width / 1920;
  const fontSize = Math.max(24, 120 * scale);
  const padding = Math.max(4, 20 * scale);
  const digitHeight = fontSize + padding;

  // Progress from 0 to 1
  const t = Math.min(1, time / Math.max(0.1, cycleDuration));
  // Ease out cubic for a premium decelerating feel
  const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
  const easedT = easeOutCubic(t);

  const currentValue = start + (end - start) * easedT;

  const valueInt = Math.floor(currentValue);
  const valueStr = String(valueInt);

  // We render up to 6 digit columns dynamically
  const digits = valueStr.split("").map(Number);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b",
        backgroundImage: `radial-gradient(circle at center, ${bgGradientColor}15 0%, #09090b 80%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Decorative Top Ambient Line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${4 * scale}px`,
          background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: `${16 * scale}px`,
          zIndex: 10,
        }}
      >
        {/* Label */}
        <span
          style={{
            fontSize: `${24 * scale}px`,
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "#94a3b8",
            textTransform: "uppercase",
            textShadow: `0 0 ${12 * scale}px rgba(148, 163, 184, 0.1)`,
          }}
        >
          {titleText}
        </span>

        {/* Counter Numbers */}
        <div
          style={{
            display: "flex",
            overflow: "hidden",
            borderRadius: `${16 * scale}px`,
            border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
            background: "rgba(9, 9, 11, 0.8)",
            backdropFilter: "blur(12px)",
            padding: `${8 * scale}px ${24 * scale}px`,
            boxShadow: `0 ${20 * scale}px ${50 * scale}px rgba(0, 0, 0, 0.6), inset 0 0 ${20 * scale}px rgba(255, 255, 255, 0.03)`,
          }}
        >
          {digits.map((_, i) => {
            // Find the position weight of this digit (e.g. 1, 10, 100...)
            const placeWeight = Math.pow(10, digits.length - 1 - i);

            // Compute placeValue smoothly
            // It rolls continuously based on the remainder
            const rawVal = currentValue / placeWeight;
            const placeValue = rawVal % 10;

            return (
              <div
                key={i}
                style={{
                  height: digitHeight,
                  position: "relative",
                  width: `${fontSize * 0.65}px`,
                  overflow: "hidden",
                }}
              >
                {[...Array(10)].map((_, num) => {
                  let offset = (10 + num - placeValue) % 10;
                  let yOffset = offset * digitHeight;

                  if (offset > 5) {
                    yOffset -= 10 * digitHeight;
                  }

                  return (
                    <span
                      key={num}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: `${fontSize}px`,
                        fontWeight: 800,
                        color: "#ffffff",
                        textShadow: `0 0 ${30 * scale}px ${accentColor}40`,
                        transform: `translateY(${yOffset}px)`,
                      }}
                    >
                      {num}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Decorative Grid Gridline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)",
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          pointerEvents: "none",
          opacity: 0.8,
        }}
      />
    </div>
  );
}
