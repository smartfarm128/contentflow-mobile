import type { HtmlTemplateProps } from "../types";

// Easing cubic-bezier solver matching standard CSS/Framer motion ease curve
function solveCubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
  if (t === 0 || t === 1) return t;
  let x = t;
  for (let i = 0; i < 8; i++) {
    const currentX = 3 * Math.pow(1 - x, 2) * x * x1 + 3 * (1 - x) * x * x * x2 + x * x * x - t;
    if (Math.abs(currentX) < 1e-5) break;
    const derivative = 3 * Math.pow(1 - x, 2) * x1 + 6 * (1 - x) * x * (x2 - x1) + 3 * x * x * (1 - x2);
    x -= currentX / (derivative || 1);
  }
  return 3 * Math.pow(1 - x, 2) * x * y1 + 3 * (1 - x) * x * x * y2 + x * x * x;
}

export function HandWritingTextTemplate({ progress, width, values }: HtmlTemplateProps) {
  // Read customized template values with fallbacks matching KokonutUI defaults
  const title = values.title !== undefined ? String(values.title) : "Hand Written";
  const subtitle = values.subtitle !== undefined ? String(values.subtitle) : "Optional subtitle";
  const strokeColor = String(values.strokeColor ?? "#ffffff");
  const textColor = String(values.textColor ?? "#ffffff");

  // Scale relative to SVG viewBox width (1200px)
  const scale = width / 1200;

  // 1. Drawing SVG path drawing: progress 0.0 to 0.7
  const drawProgress = Math.max(0, Math.min(1, progress / 0.7));
  const drawEase = solveCubicBezier(drawProgress, 0.43, 0.13, 0.23, 0.96);
  // Use a stroke dash length of 2400
  const pathLengthValue = 2400;
  const strokeDashoffset = pathLengthValue * (1 - drawEase);
  const strokeOpacity = Math.max(0, Math.min(1, progress / 0.15));

  // 2. Title fade and slide-up: progress 0.2 to 0.7
  const titleProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.5));
  const titleEase = 1 - Math.pow(1 - titleProgress, 3); // cubic ease-out
  const titleOpacity = titleProgress;
  const titleY = (1 - titleEase) * 20 * scale;

  // 3. Subtitle fade-in: progress 0.4 to 0.9
  const subtitleProgress = Math.max(0, Math.min(1, (progress - 0.4) / 0.5));
  const subtitleOpacity = subtitleProgress;

  // Font and stroke dimensions
  const titleFontSize = Math.max(16, 56 * scale);
  const subtitleFontSize = Math.max(12, 20 * scale);
  const strokeWidth = 12 * scale;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        userSelect: "none",
      }}
    >
      {/* SVG hand writing path background overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          viewBox="0 0 1200 600"
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "960px",
            maxHeight: "480px",
            opacity: strokeOpacity,
          }}
        >
          <title>KokonutUI</title>
          <path
            d="M 950 90 C 1250 300, 1050 480, 600 520 C 250 520, 150 480, 150 300 C 150 120, 350 80, 600 80 C 850 80, 950 180, 950 180"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLengthValue}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "none",
            }}
          />
        </svg>
      </div>

      {/* Title & Subtitle text layer */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: `${8 * scale}px`,
        }}
      >
        <h1
          style={{
            fontSize: `${titleFontSize}px`,
            color: textColor,
            letterSpacing: "-0.02em",
            margin: 0,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontWeight: 600,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: `${subtitleFontSize}px`,
              color: textColor,
              opacity: subtitleOpacity * 0.8,
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
