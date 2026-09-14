"use client";

import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage, placeholderLogo } from "../local-placeholder";

export function Card7Template({ time, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Nike M2K Tekno");
  const description = String(values.description ?? "Elevate Your Every Step");
  const price = String(values.price ?? "$149");
  const imageUrl = String(
    values.imageUrl ??
      placeholderImage("matfitcrop")
  );
  const logoUrl = String(
    values.logoUrl ?? placeholderLogo("ogoNIKEsvg")
  );
  const cycleDuration = Number(values.cycleDuration ?? 6.0);

  // Computes playhead-deterministic 3D rotation wiggles
  const { rotateX, rotateY } = useMemo(() => {
    const angle = (time % cycleDuration) * ((Math.PI * 2) / cycleDuration);
    return {
      rotateX: Math.sin(angle) * 8, // Max rotation 8 deg
      rotateY: Math.cos(angle) * 8, // Max rotation 8 deg
    };
  }, [time, cycleDuration]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div style={{ perspective: "1000px" }}>
        <div
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
            transformStyle: "preserve-3d",
            transition: "transform 0.05s linear",
          }}
          className="relative w-[340px] aspect-[9/12] rounded-3xl bg-zinc-950 shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Background Image */}
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover rounded-3xl scale-[1.1]"
            style={{ transform: "translateZ(-20px)" }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-3xl" />

          {/* Main Content with 3D effect */}
          <div
            className="absolute inset-0 p-5 flex flex-col justify-between"
            style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}
          >
            {/* Glassmorphism Header */}
            <div className="flex items-start justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-xs text-white/70">{description}</p>
              </div>
              <img src={logoUrl} alt="Brand Logo" className="h-4 w-auto brightness-0 invert" />
            </div>

            {/* Price Tag */}
            <div className="absolute top-[108px] left-5">
              <div className="rounded-full bg-black/40 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm border border-white/5">
                {price}
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="mt-auto flex w-full justify-center gap-2 pb-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === 0 ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card7Template;
