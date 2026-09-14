"use client";

import type { HtmlTemplateProps } from "../types";

interface ImageData {
  title: string;
  url: string;
}

const defaultImages: ImageData[] = [
  { title: "Mini canine", url: "https://images.unsplash.com/photo-1583551536442-0fc55ac443f6?w=600&h=600&fit=crop" },
  { title: "Wheely tent", url: "https://images.unsplash.com/photo-1583797227225-4233106c5a2a?w=600&h=600&fit=crop" },
  { title: "Red food things", url: "https://images.unsplash.com/photo-1561626450-730502dba332?w=600&h=600&fit=crop" },
  { title: "Sand boat", url: "https://images.unsplash.com/photo-1585221454166-ce690e60465f?w=600&h=600&fit=crop" },
  { title: "Screen thing", url: "https://images.unsplash.com/photo-1585427795543-33cf23ea2853?w=600&h=600&fit=crop" },
  { title: "Horse tornado", url: "https://images.unsplash.com/photo-1507160874687-6fe86a78b22e?w=600&h=600&fit=crop" },
];

export function CarouselCircularImageGalleryTemplate({ time, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 9.0);
  const images = defaultImages;
  const total = images.length;

  const width = 400;
  const height = 400;
  const circleRadius = 7;
  const gap = 10;

  // Active slide logic
  const slideProgress = (time % cycleDuration) / (cycleDuration / total);
  const activeIndex = Math.floor(slideProgress) % total;
  const fraction = slideProgress - Math.floor(slideProgress);

  // Transition parameters (transition happens in first 20% of the slide duration)
  const transitionWindow = 0.20;
  const t = fraction < transitionWindow ? fraction / transitionWindow : 1;
  const tSmooth = (1 - Math.cos(t * Math.PI)) / 2; // smooth sine curve

  const getPosX = (i: number) =>
    width / 2 - (total * (circleRadius * 2 + gap) - gap) / 2 + i * (circleRadius * 2 + gap);
  const getPosY = () => height - 30;

  const previousIndex = (activeIndex - 1 + total) % total;

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="relative h-[80vmin] w-[80vmin] max-h-[600px] max-w-[600px] overflow-hidden rounded-[20px] shadow-2xl border border-white/10 bg-zinc-950">
        
        {images.map((image, i) => {
          // Calculate clip-path parameters
          const xDot = getPosX(i);
          const yDot = getPosY();

          let cx = xDot;
          let cy = yDot;
          let r = circleRadius;

          // If it is the active slide transitioning in
          if (i === activeIndex) {
            cx = xDot + (width / 2 - xDot) * tSmooth;
            cy = yDot + (height / 2 - yDot) * tSmooth;
            r = circleRadius + (500 - circleRadius) * tSmooth;
          } 
          // Keep previous slide covering the background fully until active is fully transitioned
          else if (i === previousIndex) {
            cx = width / 2;
            cy = height / 2;
            r = 500;
          }

          // Decide z-index order
          let zIndex = 1;
          if (i === previousIndex) zIndex = 2;
          if (i === activeIndex) zIndex = 3;

          return (
            <div
              key={image.url}
              className="absolute left-0 top-0 h-full w-full"
              style={{ zIndex }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid slice"
                className="h-full w-full"
              >
                <defs>
                  <clipPath id={`template_clip_${i}`}>
                    <circle cx={cx} cy={cy} r={r} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#template_clip_${i})`}>
                  <image
                    width={width}
                    height={height}
                    href={image.url}
                    className="pointer-events-none"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
              </svg>
            </div>
          );
        })}

        {/* Small Navigation dots indicators at the bottom */}
        <div className="absolute left-0 top-0 z-[100] h-full w-full pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full"
          >
            {images.map((_, i) => (
              <g key={i}>
                <circle
                  className={`stroke-white/70 ${i === activeIndex ? "fill-purple-500 stroke-purple-400" : "fill-white/20"}`}
                  strokeWidth="1.5"
                  cx={getPosX(i)}
                  cy={getPosY()}
                  r={circleRadius + 1}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
export default CarouselCircularImageGalleryTemplate;
