import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

const RANDOM_CHARS = "_!X$0-+*#";

export function SpecialTextTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Read controls
  const text = String(values.text ?? "Make it beautiful");
  const fontColor = String(values.fontColor ?? "#10b981"); // sleek emerald default color
  const baseSize = Number(values.fontSize ?? 36);
  
  const animDuration = Number(values.animDuration ?? 2.0);
  const cycleDuration = Number(values.cycleDuration ?? 5.0);

  // 2. Scale factor based on canvas
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  const fontSizePx = Math.max(16, baseSize * scaleFactor * 2.2);

  // 3. Playhead-deterministic scramble text calculation
  const displayText = useMemo(() => {
    if (!text) return "";

    const activeTime = time % Math.max(0.5, cycleDuration);
    
    // Total steps for the full reveal cycle
    const totalSteps = text.length * 4;
    
    // Determine the current step index (clamped to animDuration)
    const progress = Math.min(1, activeTime / Math.max(0.1, animDuration));
    const currentStep = Math.floor(progress * totalSteps);

    // Phase 1: randomly scrambling letters, gradually filling the string length with random characters
    if (currentStep < text.length * 2) {
      const currentLength = Math.min(currentStep + 1, text.length);
      const chars: string[] = [];
      for (let i = 0; i < currentLength; i++) {
        // Pseudo-random character index determined deterministically by step and index
        const charIndex = (currentStep * 7 + i * 13) % RANDOM_CHARS.length;
        chars.push(RANDOM_CHARS[charIndex]);
      }
      for (let i = currentLength; i < text.length; i++) {
        chars.push("\u00A0");
      }
      return chars.join("");
    } 
    // Phase 2: gradually revealing the actual characters of the text from left to right
    else {
      const step = currentStep - text.length * 2;
      const revealedCount = Math.floor(step / 2);
      const chars: string[] = [];

      for (let i = 0; i < revealedCount && i < text.length; i++) {
        chars.push(text[i]);
      }

      if (revealedCount < text.length) {
        if (step % 2 === 0) {
          chars.push("_");
        } else {
          const charIndex = (step * 3 + revealedCount * 17) % RANDOM_CHARS.length;
          chars.push(RANDOM_CHARS[charIndex]);
        }
      }

      for (let i = chars.length; i < text.length; i++) {
        const charIndex = (step * 9 + i * 23) % RANDOM_CHARS.length;
        chars.push(RANDOM_CHARS[charIndex]);
      }

      return chars.join("");
    }
  }, [text, time, animDuration, cycleDuration]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030303",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "JetBrains Mono, monospace", // enforces clean coding/scramble look
      }}
    >
      {/* Dynamic ambient grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, rgba(16, 185, 129, 0.04) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ textAlign: "center", width: "100%", padding: "0 24px" }}>
        <span
          style={{
            fontSize: `${fontSizePx}px`,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: fontColor,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            userSelect: "none",
          }}
        >
          {displayText}
        </span>
      </div>
    </div>
  );
}
