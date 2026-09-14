import type { HtmlTemplateProps } from "../types";

export function DynamicTextSliderTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const titleText = String(values.title ?? "The Open Source");
  const sliderText = String(values.sliderText ?? "Video Editor");
  const descText = String(values.description ?? "An intuitive, powerful, and free video editor for everyone. Create stunning videos with professional tools, right from your browser.");
  const speed = Number(values.speed ?? 1.0);

  const scale = Math.min(width, height) / 1080;
  const sliderWidth = 520 * scale;
  const sliderHeight = 88 * scale;
  const handleSize = 32 * scale;

  // Base constants
  const ROTATION_DEG = -2.76;

  // Automatic playhead-driven sliding paths
  const left = (sliderWidth * 0.15) + Math.sin(time * 1.4 * speed) * (sliderWidth * 0.1);
  const right = (sliderWidth * 0.85) + Math.cos(time * 1.1 * speed) * (sliderWidth * 0.12);
  
  // Calculate dynamic rotation angle based on midpoint deviation
  const midpoint = (left + right) / 2;
  const center = sliderWidth / 2;
  const deviation = (midpoint - center) / center;
  const dynamicRotation = ROTATION_DEG + deviation * 3.5;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        padding: `${32 * scale}px`,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: `${800 * scale}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Title */}
        <span
          style={{
            fontSize: `${72 * scale}px`,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            marginBottom: `${20 * scale}px`,
          }}
        >
          {titleText}
        </span>

        {/* Dynamic Slid-Clipping Text Box */}
        <div
          style={{
            position: "relative",
            width: sliderWidth,
            height: sliderHeight,
            transform: `rotate(${dynamicRotation}deg)`,
            userSelect: "none",
            marginBottom: `${32 * scale}px`,
          }}
        >
          {/* Yellow boundary card edge border */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: `${16 * scale}px`,
              border: `${1.5 * scale}px solid #eab308`,
              pointerEvents: "none",
            }}
          />

          {/* Left Handle */}
          <div
            style={{
              position: "absolute",
              left: left,
              top: 0,
              width: handleSize,
              height: "100%",
              borderRadius: `${20 * scale}px`,
              backgroundColor: "#262626",
              border: `${1.5 * scale}px solid #eab308`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translateX(-50%)`,
              zIndex: 20,
            }}
          >
            <div style={{ width: `${3 * scale}px`, height: "40%", borderRadius: "999px", backgroundColor: "#eab308" }} />
          </div>

          {/* Right Handle */}
          <div
            style={{
              position: "absolute",
              left: right,
              top: 0,
              width: handleSize,
              height: "100%",
              borderRadius: `${20 * scale}px`,
              backgroundColor: "#262626",
              border: `${1.5 * scale}px solid #eab308`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translateX(-50%)`,
              zIndex: 20,
            }}
          >
            <div style={{ width: `${3 * scale}px`, height: "40%", borderRadius: "999px", backgroundColor: "#eab308" }} />
          </div>

          {/* Clipped sliding text container */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `${72 * scale}px`,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              clipPath: `inset(0 ${sliderWidth - right}px 0 ${left}px round ${16 * scale}px)`,
              WebkitClipPath: `inset(0 ${sliderWidth - right}px 0 ${left}px round ${16 * scale}px)`,
              zIndex: 10,
              whiteSpace: "nowrap",
            }}
          >
            {sliderText}
          </div>
        </div>

        {/* Sub-description paragraph */}
        <p
          style={{
            fontSize: `${20 * scale}px`,
            color: "#94a3b8",
            lineHeight: 1.5,
            maxWidth: `${640 * scale}px`,
            margin: 0,
          }}
        >
          {descText}
        </p>
      </div>
    </div>
  );
}
