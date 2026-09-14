import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

// Linear interpolation helper
function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

export function ContainerTextFlipTemplate({ progress, width, values }: HtmlTemplateProps) {
  // Read customized template values
  const rawWords = String(values.words ?? "better, modern, Tyler Durden, awesome");
  const words = useMemo(() => {
    return rawWords.split(",").map((w) => w.trim()).filter(Boolean);
  }, [rawWords]);

  const textColor = String(values.textColor ?? "#ffffff");
  const bgGradientStart = String(values.bgGradientStart ?? "#374151");
  const bgGradientEnd = String(values.bgGradientEnd ?? "#1f2937");

  // Relative scaling factor
  const scale = width / 1920;
  const fontSize = Math.max(16, 72 * scale); // md:text-7xl

  // Approximate character-width measurement for deterministic container sizing
  const getWordWidth = (word: string) => {
    let total = 0;
    for (const char of word) {
      if (char === "i" || char === "l" || char === "t" || char === "I" || char === "1" || char === " ") {
        total += fontSize * 0.3;
      } else if (char === "w" || char === "m" || char === "W" || char === "M") {
        total += fontSize * 0.85;
      } else if (char === char.toUpperCase()) {
        total += fontSize * 0.65;
      } else {
        total += fontSize * 0.52;
      }
    }
    // Padding matches the raw component (+ 30) scaled
    return total + 30 * scale;
  };

  const wordCount = words.length || 1;
  const segmentWidth = 1 / wordCount;

  // Active indices and local segment progress
  const activeWordIdx = Math.min(wordCount - 1, Math.floor(progress * wordCount));
  const activeWord = words[activeWordIdx] || "";
  
  const start = activeWordIdx * segmentWidth;
  const localProgress = (progress - start) / segmentWidth;

  const currentWidth = getWordWidth(activeWord);
  const previousWord = activeWordIdx > 0 ? words[activeWordIdx - 1] : words[wordCount - 1];
  const previousWidth = getWordWidth(previousWord || "");

  // Interpolate container width dynamically over first 25% of the active word segment
  let animatedWidth = currentWidth;
  if (localProgress < 0.25) {
    const t = localProgress / 0.25;
    const ease = t * (2 - t); // quadratic ease-out
    animatedWidth = lerp(previousWidth, currentWidth, ease);
  }

  // Generate character style transformations for active word letters
  const letters = activeWord.split("").map((letter, idx) => {
    const delay = idx * 0.03;
    const duration = 0.15;
    const startOffset = 0.0 + delay;
    const letterProgress = Math.max(0, Math.min(1, (localProgress - startOffset) / duration));
    const ease = letterProgress * (2 - letterProgress); // quadratic ease-out
    const opacity = ease;
    const blur = lerp(10, 0, ease);

    return {
      letter,
      opacity,
      blur,
    };
  });

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
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: `${12 * scale}px`,
          paddingTop: `${8 * scale}px`,
          paddingBottom: `${12 * scale}px`,
          width: `${animatedWidth}px`,
          height: `${fontSize * 1.5}px`,
          background: `linear-gradient(to bottom, ${bgGradientStart}, ${bgGradientEnd})`,
          boxShadow: `inset 0 ${-1 * scale}px #10171e, inset 0 0 0 ${1 * scale}px hsla(205,89%,46%,.24), 0 ${4 * scale}px ${8 * scale}px #00000052`,
          textAlign: "center",
          fontWeight: "bold",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "inline-flex", gap: 0 }}>
          {letters.map((item, idx) => (
            <span
              key={idx}
              style={{
                display: "inline-block",
                color: textColor,
                fontSize: `${fontSize}px`,
                opacity: item.opacity,
                filter: `blur(${item.blur}px)`,
                whiteSpace: item.letter === " " ? "pre" : "normal",
              }}
            >
              {item.letter}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
