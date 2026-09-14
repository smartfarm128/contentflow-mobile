"use client";

import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function LoopAnimationHookTemplate({ time, values }: HtmlTemplateProps) {
  const stepDuration = Number(values.stepDuration ?? 1.5);

  const array = useMemo(
    () => [
      "Tik-Tik uno",
      "Tik-Tik dos",
      "Tik-Tik tres",
      "Tik-Tik cuatro",
      "Tik-Tik cinco",
      "Tik-Tik seis",
      "Tik-Tik siete",
      "Tik-Tik ocho",
      "Tik-Tik nueve",
      "Tik-Tik diez",
    ],
    []
  );

  // Compute active item index and transition state directly from timeline playhead
  const stepProgress = time / stepDuration;
  const activeIndex = Math.floor(stepProgress) % array.length;
  const fraction = stepProgress - Math.floor(stepProgress);

  const { yOffset, opacity } = useMemo(() => {
    // Transition segment sizes
    const transitionWindow = 0.20;

    // Slide-in transition
    if (fraction < transitionWindow) {
      const t = fraction / transitionWindow;
      return {
        yOffset: (1 - t) * 100, // percentage
        opacity: t,
      };
    }
    // Slide-out transition
    if (fraction > 1 - transitionWindow) {
      const t = (fraction - (1 - transitionWindow)) / transitionWindow;
      return {
        yOffset: -t * 100,
        opacity: 1 - t,
      };
    }
    // Sitting still
    return {
      yOffset: 0,
      opacity: 1,
    };
  }, [fraction]);

  const currentItem = array[activeIndex];

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 h-full w-full bg-zinc-950 text-white">
      <div className="mb-20 grid content-start justify-items-center gap-6 text-center">
        <span className="after:bg-zinc-800 relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-transparent after:content-['']">
          useLoop hook
        </span>
      </div>
      <div className="h-12 overflow-hidden relative flex items-center justify-center min-w-[200px]">
        <h1
          style={{
            transform: `translateY(${yOffset}%)`,
            opacity,
            transition: "transform 0.05s linear, opacity 0.05s linear",
          }}
          className="whitespace-nowrap text-center text-4xl font-bold tracking-tight text-white absolute"
        >
          {currentItem}
        </h1>
      </div>
    </div>
  );
}
export default LoopAnimationHookTemplate;
