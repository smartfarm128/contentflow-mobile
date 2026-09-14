import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

// Safe Unicode Segmenter helper
const splitIntoCharacters = (text: string): string[] => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  }
  return Array.from(text);
};

export function VerticalCutRevealTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const text1 = String(values.text1 ?? "HI 👋, FRIEND!");
  const text2 = String(values.text2 ?? "🌤️ IT IS NICE ⇗ TO");
  const text3 = String(values.text3 ?? "MEET 😊 YOU.");
  const color = String(values.color ?? "#0015ff");
  const backgroundColor = String(values.backgroundColor ?? "#ffffff");

  // 2. Scale factor calculation
  const scaleFactor = Math.min(width, height) / 1080;
  const fontSize = Math.max(20, 72 * scaleFactor);
  const gapSize = 32 * scaleFactor;
  const paddingSize = 64 * scaleFactor;

  // 3. Split elements
  const row1Chars = useMemo(() => splitIntoCharacters(text1), [text1]);
  const row2Chars = useMemo(() => splitIntoCharacters(text2), [text2]);
  const row3Chars = useMemo(() => splitIntoCharacters(text3), [text3]);

  // Row 1: Stagger First, starts at time = 0.0s
  const row1Data = useMemo(() => {
    return row1Chars.map((char, idx) => {
      const delay = idx * 0.035;
      const charProgress = clamp((time - delay) / 0.45, 0, 1);
      // easeOutCubic easing curve for premium motion feel
      const t = 1 - Math.pow(1 - charProgress, 3);
      const yOffset = (1 - t) * 100; // translate from 100% to 0%
      return { char, yOffset };
    });
  }, [row1Chars, time]);

  // Row 2: Stagger Last, reverse=true, starts at time = 0.6s
  const row2Data = useMemo(() => {
    const total = row2Chars.length;
    return row2Chars.map((char, idx) => {
      const delay = 0.6 + (total - 1 - idx) * 0.035;
      const charProgress = clamp((time - delay) / 0.45, 0, 1);
      const t = 1 - Math.pow(1 - charProgress, 3);
      const yOffset = (1 - t) * -100; // reverse transitions from -100% to 0%
      return { char, yOffset };
    });
  }, [row2Chars, time]);

  // Row 3: Stagger Center, starts at time = 1.2s
  const row3Data = useMemo(() => {
    const total = row3Chars.length;
    const center = Math.floor(total / 2);
    return row3Chars.map((char, idx) => {
      const delay = 1.2 + Math.abs(center - idx) * 0.035;
      const charProgress = clamp((time - delay) / 0.45, 0, 1);
      const t = 1 - Math.pow(1 - charProgress, 3);
      const yOffset = (1 - t) * 100;
      return { char, yOffset };
    });
  }, [row3Chars, time]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: backgroundColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        padding: `${paddingSize}px`,
        gap: `${gapSize}px`,
        boxSizing: "border-box",
      }}
    >
      {/* Background design grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundSize: `${40 * scaleFactor}px ${40 * scaleFactor}px`,
          backgroundImage: `
            linear-gradient(to right, rgba(0,21,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,21,255,0.02) 1px, transparent 1px)
          `,
          pointerEvents: "none",
        }}
      />

      {/* Row 1 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: color,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {row1Data.map((item, idx) => (
          <span
            key={idx}
            style={{
              display: "inline-block",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translate3d(0, ${item.yOffset}%, 0)`,
                whiteSpace: "pre",
              }}
            >
              {item.char}
            </span>
          </span>
        ))}
      </div>

      {/* Row 2 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: color,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {row2Data.map((item, idx) => (
          <span
            key={idx}
            style={{
              display: "inline-block",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translate3d(0, ${item.yOffset}%, 0)`,
                whiteSpace: "pre",
              }}
            >
              {item.char}
            </span>
          </span>
        ))}
      </div>

      {/* Row 3 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: color,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {row3Data.map((item, idx) => (
          <span
            key={idx}
            style={{
              display: "inline-block",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translate3d(0, ${item.yOffset}%, 0)`,
                whiteSpace: "pre",
              }}
            >
              {item.char}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
