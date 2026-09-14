import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { GlowingShadow } from "../ui/glowing-shadow";

export function GlowingShadowTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const cardText = String(values.cardText ?? "Glowing Shadow");
  const subText = String(values.subText ?? "Interactive playhead scrubbing demo");
  const bgOpacity = Number(values.bgOpacity ?? 0.9);

  // Design scale factors
  const scale = Math.min(width, height) / 1080;
  
  // Map progress to CSS variables overrides
  const hue = progress * 360;
  const rotate = -70 + progress * 360;

  // Map progress around a square path for bg-x and bg-y
  const { bgX, bgY } = useMemo(() => {
    let x = 0;
    let y = 0;
    if (progress < 0.25) {
      x = (progress / 0.25) * 100;
      y = 0;
    } else if (progress < 0.5) {
      x = 100;
      y = ((progress - 0.25) / 0.25) * 100;
    } else if (progress < 0.75) {
      x = 100 - ((progress - 0.5) / 0.25) * 100;
      y = 100;
    } else {
      x = 0;
      y = 100 - ((progress - 0.75) / 0.25) * 100;
    }
    return { bgX: x, bgY: y };
  }, [progress]);

  const textValSize = Math.max(16, Math.round(54 * scale));
  const subTextSize = Math.max(10, Math.round(18 * scale));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: `rgba(8, 8, 12, ${bgOpacity})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Background spotlights */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <GlowingShadow
        hueOverride={hue}
        rotateOverride={rotate}
        bgXOverride={bgX}
        bgYOverride={bgY}
        isScrubbing={true}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: `${Math.round(40 * scale)}px`,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: `${textValSize}px`,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "white",
              lineHeight: 1.1,
            }}
          >
            {cardText}
          </span>
          <span
            style={{
              marginTop: `${Math.round(16 * scale)}px`,
              fontSize: `${subTextSize}px`,
              color: "rgba(255, 255, 255, 0.4)",
              fontWeight: 500,
            }}
          >
            {subText}
          </span>
        </div>
      </GlowingShadow>
    </div>
  );
}
export default GlowingShadowTemplate;
