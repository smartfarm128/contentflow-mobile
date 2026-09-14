import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export function FlipWordsTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const rawWordsString = String(values.words ?? "better, cute, beautiful, modern");
  const words = useMemo(() => {
    return rawWordsString.split(",").map((w) => w.trim()).filter(Boolean);
  }, [rawWordsString]);

  const textColor = String(values.textColor ?? "#111827");
  const prefixText = String(values.prefixText ?? "Build");
  const suffixText = String(values.suffixText ?? "websites with ContentFlow");

  // 2. Scale factor for canvas responsiveness
  const scaleFactor = Math.min(width, height) / 1080;
  const fontSize = Math.max(16, 54 * scaleFactor);

  // 3. Mathematical active word and frame selection
  const totalWords = words.length;
  const activeWordIndex = Math.min(Math.floor(progress * totalWords), totalWords - 1);
  const activeWord = words[activeWordIndex] ?? "";

  const localProgress = (progress * totalWords) - activeWordIndex;

  // Word exit/entry container modifiers
  let wordOpacity = 1;
  let wordY = 0;
  let wordX = 0;
  let wordBlur = 0;
  let wordScale = 1;

  if (localProgress < 0.1) {
    // entry
    const t = localProgress / 0.1;
    wordOpacity = t;
    wordY = (1 - t) * 10 * scaleFactor;
  } else if (localProgress > 0.85) {
    // exit
    const t = (localProgress - 0.85) / 0.15;
    wordOpacity = 1 - t;
    wordY = t * -40 * scaleFactor;
    wordX = t * 40 * scaleFactor;
    wordBlur = t * 8 * scaleFactor;
    wordScale = 1 + t;
  }

  // Segment active word into sub-words and characters
  const activeWordSegments = useMemo(() => {
    return activeWord.split(" ");
  }, [activeWord]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        padding: `${24 * scaleFactor}px`,
        boxSizing: "border-box",
      }}
    >
      {/* Background ambient pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundSize: `${50 * scaleFactor}px ${50 * scaleFactor}px`,
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          textAlign: "center",
          fontSize: `${fontSize}px`,
          fontWeight: 600,
          color: "#4b5563",
          lineHeight: 1.4,
        }}
      >
        <span>{prefixText}&nbsp;</span>
        
        {/* FlipWords Animated Segment */}
        <div
          style={{
            display: "inline-block",
            position: "relative",
            color: textColor,
            opacity: wordOpacity,
            transform: `translate3d(${wordX}px, ${wordY}px, 0) scale(${wordScale})`,
            filter: wordBlur > 0 ? `blur(${wordBlur}px)` : "none",
          }}
        >
          {activeWordSegments.map((subWord, subIdx) => {
            return (
              <span
                key={subWord + subIdx}
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                }}
              >
                {subWord.split("").map((letter, charIdx) => {
                  // Compute stagger entry for each letter based on local word progress
                  const delay = subIdx * 0.15 + charIdx * 0.03;
                  const charProgress = clamp((localProgress - delay) / 0.12, 0, 1);
                  // Ease out curve
                  const t = 1 - Math.pow(1 - charProgress, 3);
                  
                  const opacity = t;
                  const y = (1 - t) * 10 * scaleFactor;
                  const blur = (1 - t) * 8 * scaleFactor;

                  return (
                    <span
                      key={subWord + charIdx}
                      style={{
                        display: "inline-block",
                        opacity: opacity,
                        transform: `translate3d(0, ${y}px, 0)`,
                        filter: blur > 0 ? `blur(${blur}px)` : "none",
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
                <span style={{ display: "inline-block" }}>&nbsp;</span>
              </span>
            );
          })}
        </div>

        <br />
        <span>{suffixText}</span>
      </div>
    </div>
  );
}
