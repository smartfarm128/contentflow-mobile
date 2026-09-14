import NumberFlow from "@number-flow/react";
import type { HtmlTemplateProps } from "../types";

export function SliderNumberFlowTemplate({ time, width, values }: HtmlTemplateProps) {
  const minVal = Number(values.minVal ?? 0);
  const maxVal = Number(values.maxVal ?? 100);
  const animate = values.animate !== false;
  const staticValue = Number(values.staticValue ?? 50);
  const cycleDuration = Number(values.cycleDuration ?? 4);

  // Scale relative to composition resolution (1920 design width)
  const scale = width / 1920;
  const resolvedSliderWidth = Math.max(150, 400 * scale);

  // Calculate value deterministically
  let currentValue = staticValue;
  if (animate) {
    const wave = (Math.sin((2 * Math.PI * time) / Math.max(0.5, cycleDuration)) + 1) / 2;
    currentValue = Math.round(minVal + wave * (maxVal - minVal));
  }

  const pct = Math.max(0, Math.min(1, (currentValue - minVal) / (maxVal - minVal || 1)));
  const thumbLeft = pct * resolvedSliderWidth;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        backgroundImage: "radial-gradient(circle at center, #18181b 0%, #09090b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: `${20 * scale}px`,
          width: `${resolvedSliderWidth}px`,
        }}
      >
        {/* Track */}
        <div
          style={{
            position: "relative",
            height: `${4 * scale}px`,
            width: "100%",
            borderRadius: "9999px",
            backgroundColor: "#27272a",
          }}
        >
          {/* Range */}
          <div
            style={{
              position: "absolute",
              height: "100%",
              left: 0,
              width: `${pct * 100}%`,
              borderRadius: "9999px",
              backgroundColor: "#ffffff",
            }}
          />
        </div>

        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            left: `${thumbLeft - (10 * scale)}px`,
            display: "block",
            height: `${20 * scale}px`,
            width: `${20 * scale}px`,
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Float Number Bubble */}
          <div
            style={{
              position: "absolute",
              bottom: `${28 * scale}px`,
              left: "50%",
              transform: "translateX(-50%)",
              color: "#ffffff",
              fontSize: `${22 * scale}px`,
              fontWeight: "600",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <NumberFlow
              willChange
              value={currentValue}
              isolate
              opacityTiming={{ duration: 250, easing: "ease-out" }}
              transformTiming={{ duration: 500, easing: "ease" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
