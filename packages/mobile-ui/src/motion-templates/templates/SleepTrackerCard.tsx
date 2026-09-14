"use client";

import { useMemo } from "react";
import { Bed, Moon, Sun, ArrowUp } from "lucide-react";
import type { HtmlTemplateProps } from "../types";

type SleepStage = "Awake" | "REM" | "Core" | "Deep";

interface SleepGraphSegment {
  stage: SleepStage;
  duration: number;
  height: number;
}

const stageColors: Record<SleepStage, string> = {
  Awake: "bg-orange-400",
  REM: "bg-sky-400",
  Core: "bg-blue-500",
  Deep: "bg-indigo-600",
};

export function SleepTrackerCardTemplate({ time, values }: HtmlTemplateProps) {
  const timeSlept = String(values.timeSlept ?? "5:44");
  const quality = Number(values.quality ?? 72);
  const changePercent = Number(values.changePercent ?? 16);
  const startTime = String(values.startTime ?? "01:42");
  const endTime = String(values.endTime ?? "07:26");
  const cycleDuration = Number(values.cycleDuration ?? 6.0);

  const progress = (time % cycleDuration) / cycleDuration; // 0 to 1

  const graphData: SleepGraphSegment[] = useMemo(() => [
    { stage: "Core", duration: 10, height: 60 },
    { stage: "Deep", duration: 5, height: 30 },
    { stage: "Awake", duration: 2, height: 75 },
    { stage: "REM", duration: 8, height: 50 },
    { stage: "Core", duration: 15, height: 65 },
    { stage: "REM", duration: 10, height: 55 },
    { stage: "Core", duration: 20, height: 60 },
    { stage: "Deep", duration: 8, height: 35 },
    { stage: "Core", duration: 10, height: 60 },
    { stage: "REM", duration: 5, height: 50 },
    { stage: "Awake", duration: 2, height: 80 },
    { stage: "Core", duration: 5, height: 60 },
  ], []);

  const stages = useMemo(() => ({
    Awake: "14min",
    REM: "1h 4min",
    Core: "4h 8min",
    Deep: "18min",
  }), []);

  // Compute the scale factors for all 12 bars based on playhead time
  const barScales = useMemo(() => {
    return graphData.map((_, i) => {
      if (progress < 0.4) {
        // Stagger entrance: each bar starts growing later
        const startThreshold = (i / graphData.length) * 0.25; // spread start times across first 25% of timeline
        if (progress < startThreshold) return 0;
        const duration = 0.1; // takes 10% of time to grow
        const localProgress = Math.min(1, (progress - startThreshold) / duration);
        // Spring overshoot simulation: go up to 1.15, settle at 1
        if (localProgress < 0.7) {
          return (localProgress / 0.7) * 1.15;
        } else {
          return 1.15 - ((localProgress - 0.7) / 0.3) * 0.15;
        }
      } else if (progress >= 0.4 && progress < 0.8) {
        return 1;
      } else if (progress >= 0.8 && progress < 0.95) {
        // Exit animation: all scale down together
        const localProgress = (progress - 0.8) / 0.15;
        return Math.max(0, 1 - localProgress);
      } else {
        return 0;
      }
    });
  }, [progress, graphData]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-lg">
        {/* Header Section */}
        <div className="mb-6 flex items-center gap-3 text-zinc-400">
          <Bed className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-white">Sleep</h2>
        </div>

        {/* Main Stats Section */}
        <div className="mb-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{timeSlept}</p>
            <p className="text-xs text-zinc-400">Time Sleep</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{quality}%</p>
            <p className="text-xs text-zinc-400">Quality</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-green-500">
              <ArrowUp className="h-4 w-4" />
              <p className="text-2xl font-bold">{changePercent}%</p>
            </div>
            <p className="text-xs text-zinc-400">than yesterday</p>
          </div>
        </div>

        {/* Animated Graph Section */}
        <div className="rounded-lg bg-zinc-800/40 p-4">
          <div className="flex h-24 w-full items-end justify-center gap-px">
            {graphData.map((segment, index) => (
              <div
                key={index}
                className={`rounded-full transition-all duration-75 ${stageColors[segment.stage]}`}
                style={{
                  flexGrow: segment.duration,
                  height: `${segment.height}%`,
                  transform: `scaleY(${barScales[index]})`,
                  transformOrigin: "bottom center",
                  opacity: barScales[index] > 0 ? 1 : 0,
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Moon className="h-4 w-4" />
              <span>{startTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{endTime}</span>
              <Sun className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Legend Section */}
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {Object.entries(stages).map(([stage, duration]) => (
            <div key={stage} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${stageColors[stage as SleepStage]}`} />
              <div>
                <p className="text-sm font-medium">{stage}</p>
                <p className="text-xs text-zinc-400">{duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SleepTrackerCardTemplate;
