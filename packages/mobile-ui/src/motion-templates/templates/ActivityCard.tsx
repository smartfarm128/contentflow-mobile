"use client";

import type { HtmlTemplateProps } from "../types";
import { Activity, ArrowUpRight, Target, CheckCircle2 } from "lucide-react";

export function ActivityCardTemplate({ time, values }: HtmlTemplateProps) {
  const category = String(values.category ?? "Activity");
  const title = String(values.title ?? "Today's Progress");
  const cycleDuration = Number(values.cycleDuration ?? 6.0);

  const moveValue = String(values.moveValue ?? "420");
  const moveTrend = Number(values.moveTrend ?? 85);
  const exerciseValue = String(values.exerciseValue ?? "35");
  const exerciseTrend = Number(values.exerciseTrend ?? 70);
  const standValue = String(values.standValue ?? "10");
  const standTrend = Number(values.standTrend ?? 83);

  const goal1Title = String(values.goal1Title ?? "30min Morning Yoga");
  const goal2Title = String(values.goal2Title ?? "10k Steps");
  const goal3Title = String(values.goal3Title ?? "Drink 2L Water");

  // Determine playhead progress (0 to 1)
  const progress = (time % cycleDuration) / cycleDuration;

  // Compute ring percentages driven by time
  const currentMoveTrend = Math.round(Math.min(1, progress / 0.4) * moveTrend);
  const currentExerciseTrend = Math.round(Math.min(1, Math.max(0, (progress - 0.1) / 0.4)) * exerciseTrend);
  const currentStandTrend = Math.round(Math.min(1, Math.max(0, (progress - 0.2) / 0.4)) * standTrend);

  // Compute checklist states sequentially
  const isGoal1Completed = progress > 0.4;
  const isGoal2Completed = progress > 0.6;
  const isGoal3Completed = progress > 0.8;

  const METRIC_COLORS = {
    Move: "#FF2D55",
    Exercise: "#2CD758",
    Stand: "#007AFF",
  } as const;

  const metrics = [
    { label: "Move", value: moveValue, trend: currentMoveTrend, unit: "cal" as const },
    { label: "Exercise", value: exerciseValue, trend: currentExerciseTrend, unit: "min" as const },
    { label: "Stand", value: standValue, trend: currentStandTrend, unit: "hrs" as const },
  ];

  const goals = [
    { id: "1", title: goal1Title, isCompleted: isGoal1Completed },
    { id: "2", title: goal2Title, isCompleted: isGoal2Completed },
    { id: "3", title: goal3Title, isCompleted: isGoal3Completed },
  ];

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-3xl p-6 bg-zinc-900 border border-zinc-800 shadow-xl transition-all duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-zinc-800/50">
            <Activity className="w-5 h-5 text-[#FF2D55]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>
            <p className="text-sm text-zinc-400">
              {category}
            </p>
          </div>
        </div>

        {/* Metrics Rings */}
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="relative flex flex-col items-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-zinc-800/50" />
                <div
                  className="absolute inset-0 rounded-full border-4 transition-all duration-100"
                  style={{
                    borderColor: METRIC_COLORS[metric.label as keyof typeof METRIC_COLORS],
                    clipPath: `polygon(0 0, 100% 0, 100% ${metric.trend}%, 0 ${metric.trend}%)`,
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {metric.value}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {metric.unit}
                  </span>
                </div>
              </div>
              <span className="mt-3 text-sm font-medium text-zinc-300">
                {metric.label}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {metric.trend}%
              </span>
            </div>
          ))}
        </div>

        {/* Goals Section */}
        <div className="mt-8 space-y-6">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Target className="w-4 h-4" />
                Today's Goals
              </h4>
            </div>

            <div className="space-y-2">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800/50"
                >
                  <CheckCircle2
                    className={`w-5 h-5 transition-colors duration-200 ${
                      goal.isCompleted ? "text-emerald-500" : "text-zinc-700"
                    }`}
                  />
                  <span
                    className={`text-sm text-left transition-all duration-200 ${
                      goal.isCompleted ? "text-zinc-500 line-through" : "text-zinc-300"
                    }`}
                  >
                    {goal.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400">
              View Activity Details
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityCardTemplate;
