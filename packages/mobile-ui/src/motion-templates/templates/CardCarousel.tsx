"use client";

import { useMemo } from "react";
import { SparklesIcon } from "lucide-react";
import type { HtmlTemplateProps } from "../types";

const defaultCarouselImages = [
  { src: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop", alt: "Slide 1" },
  { src: "https://images.unsplash.com/photo-1617869763329-8e8160d32adb?w=500&auto=format&fit=crop", alt: "Slide 2" },
  { src: "https://images.unsplash.com/photo-1705675742522-b0bdc228f2ed?w=500&auto=format&fit=crop", alt: "Slide 3" },
  { src: "https://images.unsplash.com/photo-1705615791178-d32cc2cdcd9c?w=500&auto=format&fit=crop", alt: "Slide 4" },
];

export function CardCarouselTemplate({ time, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Card Carousel");
  const subtitle = String(values.subtitle ?? "Seamless Images carousel animation.");
  const cycleDuration = Number(values.cycleDuration ?? 8.0);

  const images = defaultCarouselImages;

  // Calculate the current active slide index smoothly using an automated snap easing curve
  const smoothedIndex = useMemo(() => {
    const total = images.length;
    const progress = (time % cycleDuration) / cycleDuration; // 0 to 1
    const slideProgress = progress * total; // 0 to total
    const integerPart = Math.floor(slideProgress);
    const fraction = slideProgress - integerPart;

    // Slide transition takes place in the last 15% of the slide's period
    const transitionThreshold = 0.85;
    let smoothFraction = 0;
    if (fraction > transitionThreshold) {
      const normalizedFraction = (fraction - transitionThreshold) / (1 - transitionThreshold);
      smoothFraction = (1 - Math.cos(normalizedFraction * Math.PI)) / 2; // smooth sine easing
    }

    return (integerPart + smoothFraction) % total;
  }, [time, cycleDuration, images.length]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="mx-auto w-full max-w-4xl rounded-[24px] border border-white/5 p-4 shadow-sm md:rounded-[44px] bg-neutral-900/40">
        <div className="relative mx-auto flex w-full flex-col rounded-[24px] bg-neutral-800/10 p-6 md:items-start md:gap-8 md:rounded-[40px]">
          
          {/* Header */}
          <div className="flex flex-col justify-center pb-6 pl-4 md:items-start">
            <div className="flex items-center gap-2 mb-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 w-fit">
              <SparklesIcon className="h-4 w-4 fill-purple-400 stroke-1 text-purple-400" />
              <span className="text-xs font-semibold text-white/90">Latest Component</span>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-white/90">
              {title}
            </h3>
            <p className="text-sm text-neutral-400">{subtitle}</p>
          </div>

          {/* Carousel Layout */}
          <div className="relative flex w-full items-center justify-center min-h-[350px] overflow-hidden py-4">
            <div className="relative w-[300px] h-[300px]" style={{ perspective: "1000px" }}>
              {images.map((image, index) => {
                // Calculate distance in loop coordinates from the float active index
                let diff = index - smoothedIndex;
                if (diff > images.length / 2) {
                  diff -= images.length;
                }
                if (diff < -images.length / 2) {
                  diff += images.length;
                }

                const isVisible = Math.abs(diff) <= 2;
                if (!isVisible) return null;

                // 3D coverflow transforms based on computed float difference
                const translateX = diff * 150;
                const scale = 1 - Math.min(0.25, Math.abs(diff) * 0.15);
                const rotateY = diff * -35;
                const zIndex = Math.round(10 - Math.abs(diff));
                const opacity = 1 - Math.min(0.5, Math.abs(diff) * 0.4);

                return (
                  <div
                    key={image.src}
                    className="absolute inset-0"
                    style={{
                      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
                      zIndex,
                      opacity,
                      transformStyle: "preserve-3d",
                      transition: "transform 0.05s linear, opacity 0.05s linear",
                    }}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="size-full rounded-2xl object-cover border border-white/10 shadow-2xl"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination dots indicators matching progress */}
          <div className="flex justify-center w-full gap-2 pt-4">
            {images.map((_, i) => {
              const activeSlide = Math.floor(smoothedIndex);
              return (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeSlide ? "w-6 bg-purple-500" : "w-2 bg-white/20"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
export default CardCarouselTemplate;
