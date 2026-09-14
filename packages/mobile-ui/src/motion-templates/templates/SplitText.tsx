"use client";

import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function SplitTextTemplate({ time, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "Cut through the silence");
  const maxMove = Number(values.maxMove ?? 150);
  const falloff = Number(values.falloff ?? 0.1);
  const cycleDuration = Number(values.cycleDuration ?? 5.0);

  const progress = (time % cycleDuration) / cycleDuration; // 0 to 1

  const textLength = text.length;

  // Map progress to cursor index sweep from left (-3) to right (length + 3)
  const hoverIndex = useMemo(() => {
    return -3 + progress * (textLength + 6);
  }, [progress, textLength]);

  // Compute character offsets
  const characterOffsets = useMemo(() => {
    const offsets = [];
    for (let i = 0; i < textLength; i++) {
      const distance = Math.abs(i - hoverIndex);
      offsets.push(Math.max(0, maxMove * (1 - distance * falloff)));
    }
    return offsets;
  }, [hoverIndex, textLength, maxMove, falloff]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4 bg-zinc-950">
      <div className="relative flex items-center justify-center text-4xl font-medium text-zinc-50 select-none">
        {text.split("").map((char, index) => {
          const offset = characterOffsets[index] ?? 0;
          const displayChar = char === " " ? "\u00A0" : char;

          return (
            <div
              key={index}
              className="relative flex flex-col h-[1em] w-auto leading-none"
              style={{
                fontSize: "2.25rem",
              }}
            >
              {/* Top half span, slides up */}
              <span
                className="overflow-hidden transition-transform duration-75"
                style={{
                  transform: `translateY(-${offset}%)`,
                  display: "inline-block",
                }}
              >
                {displayChar}
              </span>

              {/* Bottom half span, slides down */}
              <span
                className="overflow-hidden transition-transform duration-75"
                style={{
                  transform: `translateY(${offset}%)`,
                  display: "inline-block",
                }}
              >
                <span
                  className="block"
                  style={{
                    transform: "translateY(-50%)",
                  }}
                >
                  {displayChar}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SplitTextTemplate;
