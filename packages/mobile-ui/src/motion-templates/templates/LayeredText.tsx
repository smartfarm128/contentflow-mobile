"use client";

import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function LayeredTextTemplate({ time, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 6.0);
  const fontSize = String(values.fontSize ?? "72px");
  const lineHeight = Number(values.lineHeight ?? 60);

  const lines = useMemo(
    () => [
      { top: "\u00A0", bottom: "INFINITE" },
      { top: "INFINITE", bottom: "PROGRESS" },
      { top: "PROGRESS", bottom: "INNOVATION" },
      { top: "INNOVATION", bottom: "FUTURE" },
      { top: "FUTURE", bottom: "DREAMS" },
      { top: "DREAMS", bottom: "ACHIEVEMENT" },
      { top: "ACHIEVEMENT", bottom: "\u00A0" },
    ],
    []
  );

  const progress = (time % cycleDuration) / cycleDuration;

  // Hover-cycle translation factor (0 to 1)
  const hoverValue = useMemo(() => {
    if (progress < 0.15) return 0;
    if (progress < 0.45) return (progress - 0.15) / 0.30;
    if (progress < 0.65) return 1;
    if (progress < 0.95) return 1 - (progress - 0.65) / 0.30;
    return 0;
  }, [progress]);

  const calculateTranslateX = (index: number) => {
    const baseOffset = 35;
    const centerIndex = Math.floor(lines.length / 2);
    return (index - centerIndex) * baseOffset;
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div
        className="mx-auto py-24 font-sans font-black tracking-[-2px] uppercase text-white antialiased"
        style={{ fontSize }}
      >
        <ul className="list-none p-0 m-0 flex flex-col items-center">
          {lines.map((line, index) => {
            const translateX = calculateTranslateX(index);
            
            // Stagger line slide offsets using hoverValue factor
            const staggerDelay = index * 0.05;
            const lineFactor = Math.max(0, Math.min(1, (hoverValue - staggerDelay) / 0.2));
            const yOffset = lineFactor * -lineHeight;

            return (
              <li
                key={index}
                className={`
                  overflow-hidden relative
                  ${
                    index % 2 === 0
                      ? "[transform:skew(60deg,-30deg)_scaleY(0.66667)]"
                      : "[transform:skew(0deg,-30deg)_scaleY(1.33333)]"
                  }
                `}
                style={{
                  height: `${lineHeight}px`,
                  transform: `translateX(${translateX}px) skew(${index % 2 === 0 ? "60deg, -30deg" : "0deg, -30deg"}) scaleY(${index % 2 === 0 ? "0.66667" : "1.33333"})`,
                }}
              >
                <p
                  className="leading-[55px] px-[15px] align-top whitespace-nowrap m-0"
                  style={{
                    height: `${lineHeight}px`,
                    lineHeight: `${lineHeight - 5}px`,
                    transform: `translateY(${yOffset}px)`,
                    transition: "transform 0.05s linear",
                  }}
                >
                  {line.top}
                </p>
                <p
                  className="leading-[55px] px-[15px] align-top whitespace-nowrap m-0"
                  style={{
                    height: `${lineHeight}px`,
                    lineHeight: `${lineHeight - 5}px`,
                    transform: `translateY(${yOffset}px)`,
                    transition: "transform 0.05s linear",
                  }}
                >
                  {line.bottom}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
export default LayeredTextTemplate;
