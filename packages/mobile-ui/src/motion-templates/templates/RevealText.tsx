import type { HtmlTemplateProps } from "../types";

const easeOutBack = (x: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export function RevealTextTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "STUNNING");
  const textColor = String(values.textColor ?? "#ffffff");
  const overlayColor = String(values.overlayColor ?? "#ef4444");
  const letterDelay = Number(values.letterDelay ?? 0.08);
  const overlayDelay = Number(values.overlayDelay ?? 0.05);
  const overlayDuration = Number(values.overlayDuration ?? 0.4);

  const scaleFactor = Math.min(width, height) / 1080;
  const fontSize = Math.max(28, 120 * scaleFactor);

  const letterImages = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
  ];

  // Auto-focused index moving left to right every 0.75 seconds to display background panning automatically
  const activeFocusIndex = Math.floor(time / 0.75) % text.length;

  // The overlay sweep starts after letters complete scaling
  const sweepStartTime = text.length * letterDelay + 0.3;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ display: "flex" }}>
        {text.split("").map((letter, index) => {
          // 1. Entrance Scaling
          const letterStart = index * letterDelay;
          const scaleProg = Math.min(1, Math.max(0, (time - letterStart) / 0.4));
          const scale = scaleProg > 0 ? easeOutBack(scaleProg) : 0;
          const opacity = scaleProg;

          // 2. Background Image Panning (active index focus)
          const isFocused = activeFocusIndex === index;
          const imgOpacity = isFocused ? 1 : 0;
          const bgPos = isFocused ? "10% center" : "0% center";

          // 3. Overlay Sweep Opacity
          const overlayStart = sweepStartTime + index * overlayDelay;
          const sweepProg = (time - overlayStart) / overlayDuration;
          let sweepOpacity = 0;
          if (sweepProg >= 0 && sweepProg <= 1) {
            if (sweepProg < 0.1) sweepOpacity = sweepProg / 0.1;
            else if (sweepProg < 0.7) sweepOpacity = 1;
            else sweepOpacity = 1 - (sweepProg - 0.7) / 0.3;
          }

          return (
            <span
              key={index}
              style={{
                position: "relative",
                display: "inline-block",
                fontSize: `${fontSize}px`,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                transform: `scale(${scale})`,
                opacity,
                overflow: "hidden",
                width: `${fontSize * 0.7}px`,
                height: `${fontSize * 1.3}px`,
                textAlign: "center",
              }}
            >
              {/* Base text layer */}
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  color: textColor,
                  opacity: 1 - imgOpacity,
                  transition: "opacity 0.15s ease-out",
                }}
              >
                {letter}
              </span>

              {/* Image text layer */}
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url('${letterImages[index % letterImages.length]}')`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: bgPos,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  opacity: imgOpacity,
                  transition: "opacity 0.15s ease-out, background-position 0.5s ease-out",
                }}
              >
                {letter}
              </span>

              {/* Sweep Overlay */}
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  color: overlayColor,
                  opacity: sweepOpacity,
                  pointerEvents: "none",
                }}
              >
                {letter}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
