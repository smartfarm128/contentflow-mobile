"use client";

import type { HtmlTemplateProps } from "../types";

export function GlowingCardTemplate({ time, values }: HtmlTemplateProps) {
  const views = String(values.views ?? "750k");
  const label = String(values.label ?? "Views");
  const dotColor = String(values.dotColor ?? "#38bdf8");
  const glowColor = String(values.glowColor ?? "rgba(56, 189, 248, 0.4)");
  const cycleDuration = Number(values.cycleDuration ?? 4.0);

  // Compute position of the dot based on progress
  const progress = (time % cycleDuration) / cycleDuration;
  let top = 16;
  let right = 26;

  if (progress < 0.25) {
    const p = progress / 0.25;
    top = 16;
    right = 26 + p * (225 - 26);
  } else if (progress < 0.5) {
    const p = (progress - 0.25) / 0.25;
    right = 225;
    top = 16 + p * (130 - 16);
  } else if (progress < 0.75) {
    const p = (progress - 0.5) / 0.25;
    top = 130;
    right = 225 - p * (225 - 26);
  } else {
    const p = (progress - 0.75) / 0.25;
    right = 26;
    top = 130 - p * (130 - 16);
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="relative w-[260px] h-[160px] flex items-center justify-center font-sans">
        {/* The dot positioned deterministically */}
        <div
          className="absolute w-3 h-3 rounded-full z-10 pointer-events-none"
          style={{
            backgroundColor: dotColor,
            boxShadow: `0 0 15px 4px ${dotColor}`,
            top: `${top}px`,
            right: `${right}px`,
          }}
        />

        {/* Outer Card */}
        <div
          className="relative w-full h-full bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center overflow-hidden z-5"
          style={{ backdropFilter: "blur(12px)" }}
        >
          {/* Radial ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.15) 0%, transparent 60%)`,
            }}
          />

          <div className="text-[3rem] font-extrabold text-white tracking-tighter leading-none">
            {views}
          </div>
          <div className="text-sm font-semibold text-zinc-400 mt-1.5 uppercase tracking-widest">
            {label}
          </div>

          {/* Border lines */}
          <div
            className="absolute top-0 left-0 w-full h-[1.5px] pointer-events-none"
            style={{ background: `linear-gradient(to right, transparent, ${glowColor}, transparent)` }}
          />
          <div
            className="absolute bottom-0 left-0 w-full h-[1.5px] pointer-events-none"
            style={{ background: `linear-gradient(to right, transparent, ${glowColor}, transparent)` }}
          />
          <div
            className="absolute top-0 left-0 w-[1.5px] h-full pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${glowColor}, transparent)` }}
          />
          <div
            className="absolute top-0 right-0 w-[1.5px] h-full pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${glowColor}, transparent)` }}
          />
        </div>
      </div>
    </div>
  );
}

export default GlowingCardTemplate;
