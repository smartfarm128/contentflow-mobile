"use client";

import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function AnimatedDashboardCardTemplate({ time, values }: HtmlTemplateProps) {
  const bonusesValue = Number(values.bonusesValue ?? 1250);
  const incentivesValue = Number(values.incentivesValue ?? 875);
  const cycleDuration = Number(values.cycleDuration ?? 6.0);
  const outerDotsCount = Number(values.outerDotsCount ?? 48);
  const innerDotsCount = Number(values.innerDotsCount ?? 36);

  const progress = (time % cycleDuration) / cycleDuration;

  // Stagger dot layouts
  const generateDots = (count: number, radius: number, centerX: number, centerY: number) => {
    const dots = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      const x = Math.round((centerX + radius * Math.cos(angle)) * 1000) / 1000;
      const y = Math.round((centerY + radius * Math.sin(angle)) * 1000) / 1000;
      dots.push({ x, y, delay: (i / count) * 0.3 }); // normalized stagger delay up to 0.3
    }
    return dots;
  };

  const outerDots = useMemo(() => generateDots(outerDotsCount, 185, 203, 200), [outerDotsCount]);
  const innerDots = useMemo(() => generateDots(innerDotsCount, 155, 203, 200), [innerDotsCount]);

  // Center values entrance progress (from 0.25 to 0.55)
  const valProgress = Math.max(0, Math.min(1, (progress - 0.25) / 0.3));
  const valScale = 0.8 + valProgress * 0.2;
  const valOpacity = valProgress;

  // Bottom text segment and button entrance progress (from 0.45 to 0.75)
  const bottomProgress = Math.max(0, Math.min(1, (progress - 0.45) / 0.3));
  const bottomOpacity = bottomProgress;
  const bottomY = (1 - bottomProgress) * 15;

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-lg">
        {/* Middle Section - Dots */}
        <div className="relative pl-4 pr-8 pb-4 pt-8 overflow-hidden">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-[2px] rounded-lg" />

          {/* Dots Container */}
          <div className="relative w-[28rem] h-[28rem] mx-auto">
            <svg className="w-full h-full" viewBox="0 0 448 448">
              {/* Outer dots */}
              {outerDots.map((dot, index) => {
                // Stagger dots entrance scale (from delay to delay + 0.15)
                const dotProgress = Math.max(0, Math.min(1, (progress - dot.delay) / 0.15));
                return (
                  <circle
                    key={`outer-${index}`}
                    cx={dot.x}
                    cy={dot.y}
                    r="10"
                    fill="currentColor"
                    style={{
                      color: "#5A8CEF",
                      transform: `scale(${dotProgress})`,
                      transformOrigin: `${dot.x}px ${dot.y}px`,
                      opacity: dotProgress * 0.6,
                      transition: "transform 0.05s linear, opacity 0.05s linear",
                    }}
                  />
                );
              })}

              {/* Inner dots */}
              {innerDots.map((dot, index) => {
                const dotProgress = Math.max(0, Math.min(1, (progress - (dot.delay + 0.1)) / 0.15));
                return (
                  <circle
                    key={`inner-${index}`}
                    cx={dot.x}
                    cy={dot.y}
                    r="10"
                    fill="currentColor"
                    style={{
                      color: "#4B7A63",
                      transform: `scale(${dotProgress})`,
                      transformOrigin: `${dot.x}px ${dot.y}px`,
                      opacity: dotProgress * 0.6,
                      transition: "transform 0.05s linear, opacity 0.05s linear",
                    }}
                  />
                );
              })}
            </svg>

            {/* Center Text Overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-24 -ml-12"
              style={{
                opacity: valOpacity,
                transform: `scale(${valScale})`,
                transition: "transform 0.05s linear, opacity 0.05s linear",
              }}
            >
              <div className="text-center" style={{ zIndex: 20 }}>
                <div className="text-xl font-medium text-white mb-2">TOTAL</div>
                <div className="text-5xl font-bold text-white">
                  ${(bonusesValue + incentivesValue).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Fade overlay for bottom half */}
          <div
            className="absolute -inset-4 pointer-events-none rounded-xl"
            style={{
              background: "linear-gradient(to bottom, transparent 0%, transparent 35%, rgba(9, 9, 11, 0.8) 45%, rgba(9, 9, 11, 0.9) 55%, rgba(9, 9, 11, 1) 65%)",
              zIndex: 5
            }}
          />

          {/* Bottom Section */}
          <div
            className="absolute bottom-0 left-0 right-0 px-6 pb-2 pt-4"
            style={{
              zIndex: 10,
              opacity: bottomOpacity,
              transform: `translateY(${bottomY}px)`,
              transition: "transform 0.05s linear, opacity 0.05s linear",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              {/* Bonuses Section */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-0.5 h-4 rounded-full"
                    style={{ backgroundColor: "#5A8CEF" }}
                  />
                  <div className="text-sm font-medium text-zinc-400">Bonuses</div>
                </div>
                <div className="flex flex-col">
                  <div className="text-xl font-bold text-white text-left">
                    ${bonusesValue.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-left text-blue-400">
                    +15.2%
                  </div>
                </div>
              </div>

              {/* Incentives Section */}
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-0.5 h-4 rounded-full"
                    style={{ backgroundColor: "#4B7A63" }}
                  />
                  <div className="text-sm font-medium text-zinc-400">Incentives</div>
                </div>
                <div className="flex flex-col">
                  <div className="text-xl font-bold text-white text-left">
                    ${incentivesValue.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-left text-green-400">
                    +8.7%
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full mb-4 bg-transparent border border-white/10 hover:bg-white/5 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition">
              More Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AnimatedDashboardCardTemplate;
