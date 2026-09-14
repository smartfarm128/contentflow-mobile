import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function TextEffectTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const text = String(values.text ?? "Design. Code. Create. Inspire.");
  const preset = String(values.preset ?? "blur"); // blur, scale, fade, slide
  const stagger = Number(values.stagger ?? 0.12); // delay between items in seconds
  const itemDuration = Number(values.itemDuration ?? 0.6); // duration per item animation
  const textColor = String(values.color ?? "#ffffff");
  const fontSizeInput = Number(values.fontSize ?? 54);
  const bgOpacity = Number(values.bgOpacity ?? 0.85);

  // Design scale factor relative to 1080p
  const scale = Math.min(width, height) / 1080;
  const fontSize = Math.max(18, Math.round(fontSizeInput * scale * 1.5));
  const padding = Math.max(16, Math.round(50 * scale));
  const wordGap = Math.max(6, Math.round(20 * scale));

  // Split string into words
  const words = useMemo(() => {
    return text.split(/\s+/).filter(Boolean);
  }, [text]);

  // Compute animations for each word based on timeline time
  const animatedWords = useMemo(() => {
    return words.map((word, idx) => {
      const tStart = idx * stagger;
      const tProgress = Math.min(1, Math.max(0, (time - tStart) / itemDuration));

      // Ease out cubic
      const ease = 1 - Math.pow(1 - tProgress, 3);

      let opacity = ease;
      let filter = "none";
      let transform = "none";

      if (preset === "blur") {
        const blurAmount = (1 - ease) * 16;
        filter = `blur(${blurAmount}px)`;
        opacity = ease;
      } else if (preset === "slide") {
        const translateY = (1 - ease) * 40 * scale;
        transform = `translateY(${translateY}px)`;
        opacity = ease;
      } else if (preset === "scale") {
        const scaleVal = 0.5 + 0.5 * ease;
        transform = `scale(${scaleVal})`;
        opacity = ease;
      } else if (preset === "fade") {
        opacity = ease;
      }

      return {
        word,
        opacity,
        filter,
        transform,
      };
    });
  }, [words, stagger, itemDuration, time, preset, scale]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: `rgba(10, 10, 10, ${bgOpacity})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: `${padding}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: `${wordGap}px`,
          maxWidth: "90%",
        }}
      >
        {animatedWords.map((item, idx) => (
          <span
            key={`${item.word}-${idx}`}
            style={{
              display: "inline-block",
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              color: textColor,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              opacity: item.opacity,
              filter: item.filter,
              transform: item.transform,
              transition: "none",
            }}
          >
            {item.word}
          </span>
        ))}
      </div>
    </div>
  );
}
