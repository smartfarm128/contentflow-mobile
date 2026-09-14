"use client";

import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderIcon } from "../local-placeholder";

const exercisesData = [
  {
    iconSrc: placeholderIcon("matfitcrop"),
    name: "Jumping Jacks",
    detail: "2 minutes",
  },
  {
    iconSrc: placeholderIcon("matfitcrop"),
    name: "High Knees",
    detail: "4 minutes",
  },
  {
    iconSrc: placeholderIcon("matfitcrop"),
    name: "Bicycle Crunches",
    detail: "20 reps",
  },
];

export function WorkoutCardTemplate({ time, values }: HtmlTemplateProps) {
  const date = String(values.date ?? "Wed Jul 17");
  const wodTitle = String(values.wodTitle ?? "WOD");
  const sessionTitle = String(values.sessionTitle ?? "Warm-Up Session");
  const sessionDuration = Number(values.sessionDuration ?? 50);
  const cycleDuration = Number(values.cycleDuration ?? 6.0);

  const progress = (time % cycleDuration) / cycleDuration;

  // Clock ticks/spins over the playhead time
  const clockHandRotation = (time % 10) * (360 / 10);

  const itemsStagger = useMemo(() => {
    return exercisesData.map((_, index) => {
      const start = 0.15 + index * 0.15;
      const end = start + 0.3;
      const p = Math.max(0, Math.min(1, (progress - start) / (end - start)));
      return {
        opacity: p,
        y: (1 - p) * 20,
      };
    });
  }, [progress]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-zinc-900 p-2.5 font-sans border border-white/10 shadow-lg">
        {/* Header section for date and WOD title */}
        <div className="text-center py-2">
          <p className="text-sm font-medium text-zinc-400">{date}</p>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {wodTitle}
          </h2>
        </div>

        {/* Main content card */}
        <div className="mt-2 w-full rounded-2xl bg-zinc-950 p-6 shadow-sm border border-white/5">
          {/* Session header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {sessionTitle}
            </h3>
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-400 border border-white/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-clock"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline
                  points="12 6 12 12 16 14"
                  style={{
                    transform: `rotate(${clockHandRotation}deg)`,
                    transformOrigin: "12px 12px",
                    transition: "transform 0.05s linear",
                  }}
                />
              </svg>
              <span>{sessionDuration} min</span>
            </div>
          </div>

          {/* Animated exercise list */}
          <ul role="list" className="mt-6 space-y-3">
            {exercisesData.map((exercise, index) => {
              const itemStyle = itemsStagger[index];
              return (
                <li
                  key={index}
                  role="listitem"
                  className="flex items-center gap-4 rounded-xl bg-zinc-900 p-4 border border-white/5"
                  style={{
                    opacity: itemStyle.opacity,
                    transform: `translateY(${itemStyle.y}px)`,
                    transition: "transform 0.05s linear, opacity 0.05s linear",
                  }}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full overflow-hidden">
                    <img src={exercise.iconSrc} alt={`${exercise.name} icon`} className="h-10 w-10 object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{exercise.name}</p>
                    <p className="text-sm text-zinc-400">{exercise.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default WorkoutCardTemplate;
