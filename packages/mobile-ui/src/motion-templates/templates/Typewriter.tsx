import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function TypewriterTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const prefixText = String(values.prefixText ?? "We're born 🌞 to ");
  const phrasesRaw = String(
    values.phrases ?? "experience, dance, love, be alive, create"
  );
  const accentColor = String(values.accentColor ?? "#f59e0b");
  const cursorChar = String(values.cursorChar ?? "_");

  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Split phrases
  const phrases = useMemo(() => {
    return phrasesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  }, [phrasesRaw]);

  // Timing configuration (seconds)
  const typeSpeed = 0.08;
  const deleteSpeed = 0.05;
  const pauseTyped = 1.6;
  const pauseDeleted = 0.6;

  // Pre-calculate phrase cycles and total duration
  const { phraseCycles, totalCycleTime } = useMemo(() => {
    const list = phrases.map((p) => {
      const typeDuration = p.length * typeSpeed;
      const deleteDuration = p.length * deleteSpeed;
      const total = typeDuration + pauseTyped + deleteDuration + pauseDeleted;
      return {
        text: p,
        typeDuration,
        pauseTyped,
        deleteDuration,
        pauseDeleted,
        total,
      };
    });

    const total = list.reduce((sum, c) => sum + c.total, 0);
    return { phraseCycles: list, totalCycleTime: total || 1 };
  }, [phrases]);

  // Evaluate state based on time
  const { displayText, cursorVisible } = useMemo(() => {
    if (phraseCycles.length === 0) {
      return { displayText: "", cursorVisible: true };
    }

    const loopTime = time % totalCycleTime;
    let accumulated = 0;
    let currentPhrase = phraseCycles[0];
    let relativeTime = 0;

    for (const cycle of phraseCycles) {
      if (loopTime >= accumulated && loopTime < accumulated + cycle.total) {
        currentPhrase = cycle;
        relativeTime = loopTime - accumulated;
        break;
      }
      accumulated += cycle.total;
    }

    let text = "";
    let cursor = true;

    if (relativeTime < currentPhrase.typeDuration) {
      // Typing state
      const charCount = Math.floor(relativeTime / typeSpeed);
      text = currentPhrase.text.slice(0, charCount);
      cursor = true;
    } else if (relativeTime < currentPhrase.typeDuration + currentPhrase.pauseTyped) {
      // Paused on full text
      text = currentPhrase.text;
      const blinkTimer = relativeTime - currentPhrase.typeDuration;
      cursor = Math.floor(blinkTimer * 3.5) % 2 === 0;
    } else if (
      relativeTime <
      currentPhrase.typeDuration + currentPhrase.pauseTyped + currentPhrase.deleteDuration
    ) {
      // Deleting state
      const deleteTime = relativeTime - (currentPhrase.typeDuration + currentPhrase.pauseTyped);
      const deletedChars = Math.floor(deleteTime / deleteSpeed);
      text = currentPhrase.text.slice(0, currentPhrase.text.length - deletedChars);
      cursor = true;
    } else {
      // Paused on empty text
      text = "";
      const blinkTimer =
        relativeTime -
        (currentPhrase.typeDuration + currentPhrase.pauseTyped + currentPhrase.deleteDuration);
      cursor = Math.floor(blinkTimer * 3.5) % 2 === 0;
    }

    return { displayText: text, cursorVisible: cursor };
  }, [phraseCycles, totalCycleTime, time]);

  // Scaled dimensions
  const paddingX = 60 * scaleFactor;
  const fontSize = Math.max(20, 52 * scaleFactor);
  const maxContentWidth = 1100 * scaleFactor;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030408",
        backgroundImage: "radial-gradient(circle at center, #090e1a 0%, #010204 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background glow overlay */}
      <div
        style={{
          position: "absolute",
          width: `${600 * scaleFactor}px`,
          height: `${600 * scaleFactor}px`,
          background: `radial-gradient(circle, ${accentColor}0a 0%, transparent 70%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          paddingLeft: `${paddingX}px`,
          paddingRight: `${paddingX}px`,
          maxWidth: `${maxContentWidth}px`,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        <p
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          <span>{prefixText}</span>
          <span
            style={{
              color: accentColor,
              fontWeight: 800,
            }}
          >
            {displayText}
          </span>
          <span
            style={{
              marginLeft: `${4 * scaleFactor}px`,
              opacity: cursorVisible ? 1 : 0,
              color: accentColor,
            }}
          >
            {cursorChar}
          </span>
        </p>
      </div>
    </div>
  );
}
