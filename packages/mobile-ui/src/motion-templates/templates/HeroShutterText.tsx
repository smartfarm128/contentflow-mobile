"use client";

import type { HtmlTemplateProps } from "../types";

export function HeroShutterTextTemplate({ time, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "IMMERSE");
  const cycleDuration = Number(values.cycleDuration ?? 5.0);
  const characters = text.split("");

  const charProgress = time % cycleDuration;

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full bg-zinc-950 transition-colors duration-700">
      {/* Immersive Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`,
          backgroundSize: "clamp(20px, 5vw, 60px) clamp(20px, 5vw, 60px)",
        }}
      />

      {/* Main Text Container */}
      <div className="relative z-10 w-full px-4 flex flex-col items-center">
        <div className="flex flex-wrap justify-center items-center w-full">
          {characters.map((char, i) => {
            // Main character fade & blur calculation
            const mainDelay = i * 0.04 + 0.3;
            const mainDuration = 0.8;
            const mainP = Math.max(0, Math.min(1, (charProgress - mainDelay) / mainDuration));
            const mainOpacity = mainP;
            const mainBlur = 10 * (1 - mainP);

            // Slices Calculations
            // Top slice
            const topDelay = i * 0.04;
            const topP = Math.max(0, Math.min(1, (charProgress - topDelay) / 0.7));
            const topX = -100 + topP * 200;
            const topOpacity = Math.sin(topP * Math.PI);

            // Middle slice
            const midDelay = i * 0.04 + 0.1;
            const midP = Math.max(0, Math.min(1, (charProgress - midDelay) / 0.7));
            const midX = 100 - midP * 200;
            const midOpacity = Math.sin(midP * Math.PI);

            // Bottom slice
            const botDelay = i * 0.04 + 0.2;
            const botP = Math.max(0, Math.min(1, (charProgress - botDelay) / 0.7));
            const botX = -100 + botP * 200;
            const botOpacity = Math.sin(botP * Math.PI);

            return (
              <div key={i} className="relative px-[0.1vw] overflow-hidden">
                {/* Main Character */}
                <span
                  className="text-[15vw] leading-none font-black text-white tracking-tighter block"
                  style={{
                    opacity: mainOpacity,
                    filter: `blur(${mainBlur}px)`,
                    transition: "filter 0.05s linear, opacity 0.05s linear",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>

                {/* Top Slice Layer */}
                <span
                  className="absolute inset-0 text-[15vw] leading-none font-black text-emerald-400 z-10 pointer-events-none"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 35%)",
                    transform: `translateX(${topX}%)`,
                    opacity: topOpacity,
                    transition: "transform 0.05s linear, opacity 0.05s linear",
                  }}
                >
                  {char}
                </span>

                {/* Middle Slice Layer */}
                <span
                  className="absolute inset-0 text-[15vw] leading-none font-black text-zinc-200 z-10 pointer-events-none"
                  style={{
                    clipPath: "polygon(0 35%, 100% 35%, 100% 65%, 0 65%)",
                    transform: `translateX(${midX}%)`,
                    opacity: midOpacity,
                    transition: "transform 0.05s linear, opacity 0.05s linear",
                  }}
                >
                  {char}
                </span>

                {/* Bottom Slice Layer */}
                <span
                  className="absolute inset-0 text-[15vw] leading-none font-black text-emerald-400 z-10 pointer-events-none"
                  style={{
                    clipPath: "polygon(0 65%, 100% 65%, 100% 100%, 0 100%)",
                    transform: `translateX(${botX}%)`,
                    opacity: botOpacity,
                    transition: "transform 0.05s linear, opacity 0.05s linear",
                  }}
                >
                  {char}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Accent Text */}
      <div className="absolute bottom-12 flex flex-col items-center gap-6 z-20">
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-zinc-500">
          Shutter Text Effect
        </p>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-8 left-8 border-l border-t border-zinc-800 w-12 h-12" />
      <div className="absolute bottom-8 right-8 border-r border-b border-zinc-800 w-12 h-12" />
    </div>
  );
}

export default HeroShutterTextTemplate;
