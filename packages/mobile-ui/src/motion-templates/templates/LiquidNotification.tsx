"use client";

import { useMemo } from "react";
import { cn } from "../../lib/cn";
import type { HtmlTemplateProps } from "../types";

export function LiquidNotificationTemplate({ time, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 8.0);
  const widthVal = String(values.width ?? "410px");
  const heightVal = String(values.height ?? "90px");
  const expandedWidthVal = String(values.expandedWidth ?? "410px");
  const expandedHeightVal = String(values.expandedHeight ?? "325px");

  const progress = (time % cycleDuration) / cycleDuration; // 0 to 1

  // Parse integer values for interpolation
  const wStart = parseInt(widthVal);
  const wEnd = parseInt(expandedWidthVal);
  const hStart = parseInt(heightVal);
  const hEnd = parseInt(expandedHeightVal);

  const { width, height, isExpanded, opacity, translateY } = useMemo(() => {
    let w = wStart;
    let h = hStart;
    let isExp = false;
    let op = 1;
    let ty = 0;

    if (progress < 0.15) {
      // Slide in from bottom
      const localP = progress / 0.15;
      op = localP;
      ty = 50 * (1 - localP);
    } else if (progress >= 0.15 && progress < 0.35) {
      // Collapsed static
      w = wStart;
      h = hStart;
    } else if (progress >= 0.35 && progress < 0.45) {
      // Expanding
      const localP = (progress - 0.35) / 0.10;
      w = wStart + (wEnd - wStart) * localP;
      h = hStart + (hEnd - hStart) * localP;
      isExp = localP >= 0.5;
    } else if (progress >= 0.45 && progress < 0.75) {
      // Expanded static
      w = wEnd;
      h = hEnd;
      isExp = true;
    } else if (progress >= 0.75 && progress < 0.85) {
      // Collapsing
      const localP = (progress - 0.75) / 0.10;
      w = wEnd - (wEnd - wStart) * localP;
      h = hEnd - (hEnd - hStart) * localP;
      isExp = localP < 0.5;
    } else if (progress >= 0.85 && progress < 0.90) {
      // Collapsed static
      w = wStart;
      h = hStart;
    } else {
      // Slide out/fade out
      const localP = (progress - 0.90) / 0.10;
      op = 1 - localP;
      ty = 50 * localP;
    }

    return {
      width: `${w}px`,
      height: `${h}px`,
      isExpanded: isExp,
      opacity: op,
      translateY: `${ty}px`,
    };
  }, [progress, wStart, wEnd, hStart, hEnd]);

  const blurIntensity = "lg";
  const shadowIntensity = "md";
  const glowIntensity = "xl";
  const borderRadius = "18px";

  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
  };

  const shadowStyles = {
    none: "inset 0 0 0 0 rgba(255, 255, 255, 0)",
    xs: "inset 1px 1px 1px 0 rgba(255, 255, 255, 0.3), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.3)",
    sm: "inset 2px 2px 2px 0 rgba(255, 255, 255, 0.35), inset -2px -2px 2px 0 rgba(255, 255, 255, 0.35)",
    md: "inset 3px 3px 3px 0 rgba(255, 255, 255, 0.45), inset -3px -3px 3px 0 rgba(255, 255, 255, 0.45)",
    lg: "inset 4px 4px 4px 0 rgba(255, 255, 255, 0.5), inset -4px -4px 4px 0 rgba(255, 255, 255, 0.5)",
    xl: "inset 6px 6px 6px 0 rgba(255, 255, 255, 0.55), inset -6px -6px 6px 0 rgba(255, 255, 255, 0.55)",
    "2xl": "inset 8px 8px 8px 0 rgba(255, 255, 255, 0.6), inset -8px -8px 8px 0 rgba(255, 255, 255, 0.6)",
  };

  const glowStyles = {
    none: "0 4px 4px rgba(0, 0, 0, 0.05), 0 0 12px rgba(0, 0, 0, 0.05)",
    xs: "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 16px rgba(255, 255, 255, 0.05)",
    sm: "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 24px rgba(255, 255, 255, 0.1)",
    md: "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 32px rgba(255, 255, 255, 0.15)",
    lg: "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 40px rgba(255, 255, 255, 0.2)",
    xl: "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 48px rgba(255, 255, 255, 0.25)",
    "2xl": "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 60px rgba(255, 255, 255, 0.3)",
  };

  return (
    <div
      className="flex h-full w-full items-center justify-center p-8 bg-zinc-950 rounded-2xl border border-zinc-800"
      style={{
        background:
          'url("https://images.unsplash.com/photo-1534259070436-a95806b8621a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center / cover no-repeat',
      }}
    >
      <div className="hidden">
        <svg>
          <defs>
            <filter
              id="glass-blur-template"
              x="0"
              y="0"
              width="100%"
              height="100%"
              filterUnits="objectBoundingBox"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.003 0.007"
                numOctaves="1"
                result="turbulence"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="turbulence"
                scale="200"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      </div>

      <div
        className="relative z-10 flex flex-col justify-start relative overflow-hidden"
        style={{
          width,
          height,
          borderRadius,
          opacity,
          transform: `translateY(${translateY})`,
          transition: "transform 0.1s linear, opacity 0.1s linear, width 0.1s linear, height 0.1s linear",
        }}
      >
        {/* Bend Layer (Backdrop blur with distortion) */}
        <div
          className={cn("absolute inset-0 z-0", blurClasses[blurIntensity])}
          style={{
            borderRadius,
            filter: "url(#glass-blur-template)",
          }}
        />

        {/* Face Layer (Main shadow and glow) */}
        <div
          className="absolute inset-0 z-10"
          style={{
            borderRadius,
            boxShadow: glowStyles[glowIntensity],
          }}
        />

        {/* Edge Layer (Inner highlights) */}
        <div
          className="absolute inset-0 z-20"
          style={{
            borderRadius,
            boxShadow: shadowStyles[shadowIntensity],
          }}
        />

        {/* Content */}
        <div className="relative z-30 flex flex-col h-full justify-between">
          <div className="relative flex items-center p-4 text-white h-[90px] z-10 flex-shrink-0">
            {/* App Icon */}
            <div className="flex-shrink-0 mr-4">
              <img
                src="https://ui-layouts.com/apple-touch-icon.png"
                alt="icon"
                width={56}
                height={56}
                className="rounded-xl"
              />
            </div>

            <div className="flex-grow pr-4">
              <div className="font-semibold text-lg">UI-Layouts</div>
              <div className="text-sm">New components are available for you</div>
              <div className="text-sm text-gray-200">Liquid-Glass</div>
            </div>
            <div className="flex-shrink-0 ml-4 text-sm text-gray-200 self-start pt-1">
              12:34
            </div>
          </div>
          {isExpanded && (
            <div className="w-full flex-grow pb-4 px-4 overflow-hidden">
              <img
                src="https://ui-layouts.com/og.jpg"
                alt="og"
                width={400}
                height={400}
                className="rounded-xl w-full h-full object-cover z-20"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiquidNotificationTemplate;
