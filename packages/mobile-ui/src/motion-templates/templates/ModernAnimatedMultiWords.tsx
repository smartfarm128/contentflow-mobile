import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function ModernAnimatedMultiWordsTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const wordsRaw = String(values.words ?? "better, modern, beautiful, fast, efficient");
  const cycleDuration = Number(values.cycleDuration ?? 1.5);
  const prefixText = String(values.prefixText ?? "Build");
  const suffixText = String(values.suffixText ?? "interfaces");
  const wordColor = String(values.wordColor ?? "#6366f1");
  const textColor = String(values.textColor ?? "#f8fafc");

  const scaleFactor = Math.min(width, height) / 1080;
  const wordList = useMemo(() => {
    return wordsRaw.split(",").map((w) => w.trim());
  }, [wordsRaw]);

  const activeIndex = Math.floor(time / cycleDuration) % wordList.length;

  // Calculate clean slide offset and opacity values for active and exit word states
  const activeWord = wordList[activeIndex] || "";
  const nextWord = wordList[(activeIndex + 1) % wordList.length] || "";

  // The last 0.3 seconds of the cycle is the sliding transition
  const transitionWindow = 0.3;
  const timeInCycle = time % cycleDuration;
  const isTransitioning = timeInCycle > (cycleDuration - transitionWindow);

  let activeOpacity = 1;
  let activeY = 0;
  let nextOpacity = 0;
  let nextY = 40 * scaleFactor;

  if (isTransitioning) {
    const t = (timeInCycle - (cycleDuration - transitionWindow)) / transitionWindow; // 0 to 1
    
    // Active word slides out upwards
    activeOpacity = 1 - t;
    activeY = -35 * scaleFactor * t;

    // Next word slides in from below
    nextOpacity = t;
    nextY = 45 * scaleFactor * (1 - t);
  }

  // Scaled typography sizes
  const fontSize = Math.max(28, 54 * scaleFactor);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: `${16 * scaleFactor}px`,
          fontSize: `${fontSize}px`,
          fontWeight: 800,
          color: textColor,
          textAlign: "center",
        }}
      >
        <span>{prefixText}</span>

        {/* Text sliding window container */}
        <div
          style={{
            position: "relative",
            display: "inline-flex",
            height: `${fontSize * 1.3}px`,
            minWidth: "180px",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Active Word */}
          {!isTransitioning ? (
            <span
              style={{
                position: "absolute",
                color: wordColor,
                transform: "translateY(0px)",
                opacity: 1,
              }}
            >
              {activeWord}
            </span>
          ) : (
            <>
              <span
                style={{
                  position: "absolute",
                  color: wordColor,
                  transform: `translateY(${activeY}px)`,
                  opacity: activeOpacity,
                }}
              >
                {activeWord}
              </span>
              <span
                style={{
                  position: "absolute",
                  color: wordColor,
                  transform: `translateY(${nextY}px)`,
                  opacity: nextOpacity,
                }}
              >
                {nextWord}
              </span>
            </>
          )}
        </div>

        <span>{suffixText}</span>
      </div>
    </div>
  );
}
