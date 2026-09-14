"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

const defaultCards = [
  {
    heading: "Plan",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque, exercitationem.",
    imgSrc: placeholderImage("matfitcrop"),
  },
  {
    heading: "Play",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque, exercitationem.",
    imgSrc: placeholderImage("matfitcrop"),
  },
  {
    heading: "Connect",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque, exercitationem.",
    imgSrc: placeholderImage("matfitcrop"),
  },
  {
    heading: "Support",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque, exercitationem.",
    imgSrc: placeholderImage("matfitcrop"),
  },
];

export function ColorChangeCardTemplate({ time, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 8.0);
  const cards = defaultCards;
  const total = cards.length;

  // Compute the current active card slot index and interpolation factor
  const progress = (time % cycleDuration) / cycleDuration;
  const slotProgress = progress * total;
  const activeCardIndex = Math.floor(slotProgress) % total;
  const fraction = slotProgress - Math.floor(slotProgress);

  const hoverValues = useMemo(() => {
    return cards.map((_, i) => {
      if (i !== activeCardIndex) return 0;
      if (fraction < 0.15) return fraction / 0.15;
      if (fraction < 0.75) return 1;
      if (fraction < 0.95) return 1 - (fraction - 0.75) / 0.20;
      return 0;
    });
  }, [activeCardIndex, fraction, total, cards.length]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
        {cards.map((card, i) => {
          const hoverVal = hoverValues[i];
          const scale = 1 + hoverVal * 0.1;
          const rotate = hoverVal * -45;
          const translateLetterY = hoverVal * -50; // percentage
          const opacity = 0.6 + hoverVal * 0.2;
          const filter = `saturate(${Math.round(hoverVal * 100)}%)`;

          return (
            <div
              key={i}
              className="group relative h-64 w-full overflow-hidden bg-zinc-900 rounded-2xl border border-white/10"
            >
              {/* Background Image with animated saturation filter and scale */}
              <div
                className="absolute inset-0 transition-transform duration-75"
                style={{
                  backgroundImage: `url(${card.imgSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  transform: `scale(${scale})`,
                  opacity,
                  filter,
                }}
              />

              {/* Card content overlay */}
              <div className="relative z-20 flex h-full flex-col justify-between p-6 text-zinc-300">
                <div className="ml-auto">
                  <ArrowRight
                    className="h-8 w-8 text-white/90"
                    style={{
                      transform: `rotate(${rotate}deg)`,
                      transition: "transform 0.05s linear",
                    }}
                  />
                </div>
                <div>
                  <h4 className="mb-2 flex gap-0.5">
                    {card.heading.split("").map((letter, idx) => (
                      <div
                        key={idx}
                        className="inline-block h-[36px] overflow-hidden font-bold text-3xl tracking-tight text-white"
                      >
                        <span
                          className="flex flex-col"
                          style={{
                            transform: `translateY(${translateLetterY}%)`,
                            transition: "transform 0.05s linear",
                          }}
                        >
                          <span>{letter}</span>
                          <span>{letter}</span>
                        </span>
                      </div>
                    ))}
                  </h4>
                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default ColorChangeCardTemplate;
