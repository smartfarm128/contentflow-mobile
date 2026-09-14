import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function TextRotateTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const prefixText = String(values.prefixText ?? "Make it ");
  const text1 = String(values.text1 ?? "work!");
  const text2 = String(values.text2 ?? "fancy ✽");
  const text3 = String(values.text3 ?? "right");
  const text4 = String(values.text4 ?? "fast");
  const text5 = String(values.text5 ?? "fun");
  const text6 = String(values.text6 ?? "rock");
  
  const rotationInterval = Number(values.rotationInterval ?? 2.0); // seconds
  const staggerDuration = Number(values.staggerDuration ?? 0.025); // seconds
  const splitBy = String(values.splitBy ?? "characters"); // "characters" | "words"
  const fontColor = String(values.fontColor ?? "#ffffff");
  const prefixColor = String(values.prefixColor ?? "#94a3b8");
  const highlightBg = String(values.highlightBg ?? "#ff5941");
  const highlightPadding = String(values.highlightPadding ?? "4px 12px");

  // 2. Scale factor based on canvas height (e.g. 1080p reference)
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  const fontSize = Math.max(16, Math.round(54 * scaleFactor * 1.5));

  const texts = useMemo(() => {
    return [text1, text2, text3, text4, text5, text6].filter(t => t && t.trim() !== "");
  }, [text1, text2, text3, text4, text5, text6]);

  if (texts.length === 0) {
    return (
      <div style={{ color: "#fff", fontSize: "20px" }}>No Rotation Texts Provided</div>
    );
  }

  // 3. Playhead-driven deterministic indices
  const activeIndex = Math.floor(time / rotationInterval) % texts.length;
  const currentText = texts[activeIndex];

  // Stagger items split
  const items = useMemo(() => {
    if (splitBy === "words") {
      return currentText.split(" ");
    }
    // characters (handle emoji graphemes safely)
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
      return Array.from(segmenter.segment(currentText), ({ segment }) => segment);
    }
    return Array.from(currentText);
  }, [currentText, splitBy]);

  // Algebraic animation calculations
  const localTime = time % rotationInterval;
  const inDuration = 0.35;
  const outDuration = 0.25;
  const outStartTime = rotationInterval - outDuration;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0d0d0d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          whiteSpace: "pre",
          letterSpacing: "-0.02em"
        }}
      >
        {/* Prefix Text */}
        <span style={{ color: prefixColor }}>{prefixText}</span>

        {/* Rotating Highlighted Text */}
        <span
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: highlightBg,
            color: fontColor,
            borderRadius: `${12 * scaleFactor}px`,
            padding: highlightPadding,
            overflow: "hidden"
          }}
        >
          {items.map((item, idx) => {
            // Delay based on index
            const delay = idx * staggerDuration;

            // Compute algebraic transformation
            let y = 100; // start hidden below
            let opacity = 0;

            if (localTime < delay) {
              y = 100;
              opacity = 0;
            } else if (localTime >= delay && localTime < delay + inDuration) {
              const p = (localTime - delay) / inDuration;
              // Smooth out curve
              const ease = p * p * (3 - 2 * p);
              y = 100 * (1 - ease);
              opacity = ease;
            } else if (localTime >= delay + inDuration && localTime < outStartTime) {
              y = 0;
              opacity = 1;
            } else if (localTime >= outStartTime) {
              const p = (localTime - outStartTime) / outDuration;
              const ease = p * p;
              y = -120 * ease;
              opacity = 1 - ease;
            }

            return (
              <span
                key={idx}
                style={{
                  display: "inline-block",
                  transform: `translate3d(0, ${y}%, 0)`,
                  opacity: opacity,
                  // If splitting by words, add a space after each word except last
                  marginRight: splitBy === "words" && idx !== items.length - 1 ? "0.25em" : "0"
                }}
              >
                {item}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}
