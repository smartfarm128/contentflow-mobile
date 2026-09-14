"use client";

import { useMemo } from "react";
import { Zap, Laptop } from "lucide-react";
import type { HtmlTemplateProps } from "../types";

export function BatteryCardTemplate({ time, values }: HtmlTemplateProps) {
  const deviceName = String(values.deviceName ?? "Josh MacBook");
  const cycleDuration = Number(values.cycleDuration ?? 10.0);
  const isCharging = values.isCharging !== false;

  // Determinisitically animate battery level from 20% to 100% over cycleDuration
  const batteryLevel = useMemo(() => {
    const progress = (time % cycleDuration) / cycleDuration;
    return Math.round(20 + progress * 80);
  }, [time, cycleDuration]);

  const timeToFull = useMemo(() => {
    if (batteryLevel >= 100) return "Charged";
    const remainingPercentage = 100 - batteryLevel;
    const minutesRemaining = Math.round(remainingPercentage * 1.5);
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [batteryLevel]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white shadow-lg">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes wave-animation {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <Laptop className="h-4 w-4" />
            <span>{deviceName}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 items-center gap-4">
          <div className="relative col-span-1 h-32 w-full overflow-hidden rounded-lg bg-zinc-900/60 border border-white/5">
            <div
              className="absolute bottom-0 w-[2000px] transition-all duration-100 ease-linear"
              style={{ height: `${batteryLevel}%` }}
            >
              <svg
                className="absolute -bottom-1 h-4 w-[2000px] animate-[wave-animation_7s_linear_infinite]"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 800 88.6"
                style={{ fill: "hsl(142 71% 45%)" }}
              >
                <path d="M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.7h800v-.2-31.4z" />
              </svg>
              <svg
                className="absolute -bottom-1 h-5 w-[2000px] animate-[wave-animation_10s_linear_infinite]"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 800 88.6"
                style={{
                  fill: "hsl(142 71% 45%)",
                  opacity: 0.5,
                }}
              >
                <path d="M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.7h800v-.2-31.4z" />
              </svg>
            </div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
              {isCharging && (
                <Zap className="h-5 w-5 text-emerald-950" />
              )}
              <span className="text-xl font-bold text-emerald-950">
                {batteryLevel}%
              </span>
            </div>
          </div>
          
          <div className="col-span-2 flex flex-col items-start justify-center">
            <p className="text-4xl font-bold tracking-tight text-white font-mono">
              {timeToFull}
            </p>
            <p className="text-sm text-zinc-400">Time to full charge</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatteryCardTemplate;
