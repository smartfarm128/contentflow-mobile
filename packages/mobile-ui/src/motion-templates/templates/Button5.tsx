"use client";

import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function Button5Template({ time, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "Our Work");
  const hoverBgColor = String(values.hoverBgColor ?? "#4ade80");
  const textColor = String(values.textColor ?? "#000000");
  const hoverTextColor = String(values.hoverTextColor ?? "#ffffff");
  const cycleDuration = Number(values.cycleDuration ?? 4.0);

  const progress = (time % cycleDuration) / cycleDuration; // 0 to 1

  // Compute smooth hover progress (0 to 1 and back)
  const hoverProgress = useMemo(() => {
    if (progress < 0.3) {
      return 0;
    } else if (progress >= 0.3 && progress < 0.5) {
      // Ease in transition using sine curve
      const t = (progress - 0.3) / 0.2;
      return Math.sin((t * Math.PI) / 2);
    } else if (progress >= 0.5 && progress < 0.8) {
      return 1;
    } else {
      // Ease out transition
      const t = (progress - 0.8) / 0.2;
      return 1 - Math.sin((t * Math.PI) / 2);
    }
  }, [progress]);

  // Derived styles based on playhead hover progress
  const normalTextTransform = `translateY(-${hoverProgress * 48}px)`;
  const normalTextOpacity = 1 - hoverProgress;

  const hoverOverlayTransform = `translateY(${(1 - hoverProgress) * 48}px)`;
  const hoverOverlayOpacity = hoverProgress;
  const hoverOverlayBorderRadius = `${(1 - hoverProgress) * 24}px`; // 24px is pill radius for h-12

  return (
    <div className="flex h-full w-full items-center justify-center p-4 bg-zinc-950">
      <div
        className="relative cursor-pointer w-32 h-12 border border-zinc-200 bg-white overflow-hidden text-center font-semibold flex items-center justify-center select-none"
        style={{
          color: textColor,
          borderRadius: `${(1 - hoverProgress) * 24}px`,
          transition: "border-radius 0.05s linear",
        }}
      >
        {/* Normal Text */}
        <span
          className="inline-block"
          style={{
            transform: normalTextTransform,
            opacity: normalTextOpacity,
            transition: "transform 0.05s linear, opacity 0.05s linear",
          }}
        >
          {text}
        </span>

        {/* Hover Slide-up Overlay */}
        <div
          className="flex items-center justify-center absolute left-0 top-0 h-full w-full z-10"
          style={{
            backgroundColor: hoverBgColor,
            color: hoverTextColor,
            transform: hoverOverlayTransform,
            opacity: hoverOverlayOpacity,
            borderRadius: hoverOverlayBorderRadius,
            transition: "transform 0.05s linear, opacity 0.05s linear, border-radius 0.05s linear",
          }}
        >
          <span>{text}</span>
        </div>
      </div>
    </div>
  );
}

export default Button5Template;
