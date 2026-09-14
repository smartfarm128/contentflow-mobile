"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HtmlTemplateProps } from "../types";

interface DropItem {
  time: string;
  name: string;
  collection: string;
  imageSrc: string;
}

const defaultDrops: DropItem[] = [
  {
    time: "14:00",
    name: "Lemonade AF1",
    collection: "Off-White Air Force",
    imageSrc: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&fit=crop",
  },
  {
    time: "17:00",
    name: "University Blue",
    collection: "Off-White Air Force",
    imageSrc: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&fit=crop",
  },
  {
    time: "18:00",
    name: "Brooklyn Green",
    collection: "Off-White Air Force",
    imageSrc: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&fit=crop",
  },
  {
    time: "19:00",
    name: "Chicago Jordan 1",
    collection: "Off-White Air Jordan",
    imageSrc: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&fit=crop",
  },
  {
    time: "20:00",
    name: "Mocha Scott",
    collection: "Travis Scott Jordan",
    imageSrc: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&fit=crop",
  },
];

export function ProductDropCardTemplate({ time, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Today's Drops");
  const subtitle = String(values.subtitle ?? "Upcoming sneaker drops this afternoon");
  const cycleDuration = Number(values.cycleDuration ?? 8.0);

  const items = defaultDrops;
  const itemsToShow = 3;
  const maxIndex = items.length - itemsToShow; // 5 - 3 = 2

  // Interpolate index over timeline playhead
  const smoothedIndex = useMemo(() => {
    if (maxIndex <= 0) return 0;
    // Total steps to loop through: index 0 -> 1 -> 2 -> 1 -> 0
    const totalSteps = maxIndex * 2; // 4 steps
    const progress = (time % cycleDuration) / cycleDuration;
    const stepProgress = progress * totalSteps;
    const integerPart = Math.floor(stepProgress);
    const fraction = stepProgress - integerPart;

    // Transition segment (last 15% of step)
    const transitionThreshold = 0.85;
    let smoothFraction = 0;
    if (fraction > transitionThreshold) {
      const norm = (fraction - transitionThreshold) / (1 - transitionThreshold);
      smoothFraction = (1 - Math.cos(norm * Math.PI)) / 2;
    }

    const currentStepFloat = integerPart + smoothFraction;
    
    // Ping-pong style interpolation (0 -> 1 -> 2 -> 1 -> 0)
    if (currentStepFloat <= maxIndex) {
      return currentStepFloat;
    } else {
      return totalSteps - currentStepFloat;
    }
  }, [time, cycleDuration, maxIndex]);

  const activeIndex = Math.round(smoothedIndex);
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < maxIndex;

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white">{title}</h3>
            <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg border border-white/10 bg-white/5 text-white transition ${
                !canGoPrev ? "opacity-35" : ""
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </div>
            <div
              className={`p-2 rounded-lg border border-white/10 bg-white/5 text-white transition ${
                !canGoNext ? "opacity-35" : ""
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Slides Track */}
        <div className="p-6 overflow-hidden">
          <div
            className="flex gap-4"
            style={{
              transform: `translateX(-${smoothedIndex * (100 / itemsToShow)}%)`,
              transition: "transform 0.05s linear",
            }}
          >
            {items.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 rounded-xl border border-white/5 bg-zinc-800/40 p-4 text-white hover:border-white/10 transition-colors"
                style={{ flexBasis: `calc((100% / ${itemsToShow}) - (${(itemsToShow - 1) * 16}px / ${itemsToShow}))` }}
              >
                <div className="space-y-3">
                  <p className="text-sm text-purple-400 font-semibold">{item.time}</p>
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-zinc-950 flex items-center justify-center p-2 border border-white/5">
                    <img
                      src={item.imageSrc}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-100">{item.name}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {item.collection}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProductDropCardTemplate;
