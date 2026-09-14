"use client";

import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function ThreeDCardTemplate({ time, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Sapa Valley");
  const subtitle = String(values.subtitle ?? "Vietnam");
  const imageUrl = String(
    values.imageUrl ??
      placeholderImage("matfitcrop")
  );
  const actionText = String(values.actionText ?? "Book your trip");
  const href = String(values.href ?? placeholderImage("rgwikiSaPa"));
  const cycleDuration = Number(values.cycleDuration ?? 6.0);

  // Smooth circular 3D float math bound to playback timeline
  const { rotateX, rotateY } = useMemo(() => {
    const angle = (time % cycleDuration) * (Math.PI * 2 / cycleDuration);
    // Circular tilt offset
    return {
      rotateX: Math.sin(angle) * 10.5,
      rotateY: Math.cos(angle) * 10.5,
    };
  }, [time, cycleDuration]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div style={{ perspective: "1000px" }}>
        <div
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform 0.05s linear",
          }}
          className="relative h-[26rem] w-80 rounded-2xl bg-transparent shadow-2xl border border-white/10"
        >
          <div
            style={{
              transform: "translateZ(50px)",
              transformStyle: "preserve-3d",
            }}
            className="absolute inset-4 grid h-[calc(100%-2rem)] w-[calc(100%-2rem)] grid-rows-[1fr_auto] rounded-xl shadow-lg"
          >
            {/* Background Image */}
            <img
              src={imageUrl}
              alt={`${title}, ${subtitle}`}
              className="absolute inset-0 h-full w-full rounded-xl object-cover"
            />
            
            {/* Darkening overlay */}
            <div className="absolute inset-0 h-full w-full rounded-xl bg-gradient-to-b from-black/20 via-transparent to-black/60" />

            {/* Card Content */}
            <div className="relative flex flex-col justify-between rounded-xl p-4 text-white">
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 
                    style={{ transform: "translateZ(50px)" }}
                    className="text-2xl font-bold"
                  >
                    {title}
                  </h2>
                  <p 
                    style={{ transform: "translateZ(40px)" }}
                    className="text-sm font-light text-white/80 mt-0.5"
                  >
                    {subtitle}
                  </p>
                </div>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ transform: "translateZ(60px)" }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-inset ring-white/30 transition-colors hover:bg-white/30"
                >
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </a>
              </div>

              {/* Footer Button */}
              <button
                style={{ transform: "translateZ(40px)" }}
                className="w-full rounded-lg py-3 text-center font-semibold text-white bg-white/10 backdrop-blur-md ring-1 ring-inset ring-white/20 hover:bg-white/20 transition-colors"
              >
                {actionText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ThreeDCardTemplate;
