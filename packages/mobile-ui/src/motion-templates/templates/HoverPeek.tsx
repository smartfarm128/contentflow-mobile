"use client";

import type { HtmlTemplateProps } from "../types";

export function HoverPeekTemplate({ time, values }: HtmlTemplateProps) {
  const linkText = String(values.linkText ?? "21st.dev");
  const peekWidth = Number(values.peekWidth ?? 220);
  const peekHeight = Number(values.peekHeight ?? 135);
  const cycleDuration = Number(values.cycleDuration ?? 6.0);
  const lensSize = Number(values.lensSize ?? 100);
  const lensZoomFactor = Number(values.lensZoomFactor ?? 1.75);

  const imageUrl = String(values.imageSrc ?? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&fit=crop");

  const progress = (time % cycleDuration) / cycleDuration;

  // Determine if open
  const isOpen = progress >= 0.15 && progress <= 0.85;

  // Translate open timeline into opacity and scale factors for the card
  let cardOpacity = 0;
  let cardScale = 0.6;
  let cardRotateY = -90;

  if (isOpen) {
    cardOpacity = 1;
    cardScale = 1;
    cardRotateY = 0;
  }

  // Smooth out the entrance/exit states slightly
  if (progress > 0.1 && progress < 0.15) {
    const t = (progress - 0.1) / 0.05;
    cardOpacity = t;
    cardScale = 0.6 + t * 0.4;
    cardRotateY = -90 + t * 90;
  } else if (progress > 0.85 && progress < 0.9) {
    const t = (progress - 0.85) / 0.05;
    cardOpacity = 1 - t;
    cardScale = 1 - t * 0.4;
    cardRotateY = t * 90;
  }

  // Calculate follow offset (sway card slightly)
  const cardX = 20 * Math.sin(progress * 2 * Math.PI);

  // Determine lens active phase
  const isLensActive = progress >= 0.25 && progress <= 0.75;
  const lensProgress = isLensActive ? (progress - 0.25) / 0.5 : 0;
  const lensOpacity = isLensActive ? 1 : 0;

  // Move lens on a diagonal path across the card
  const lensX = peekWidth * (0.2 + 0.6 * lensProgress);
  const lensY = peekHeight * (0.3 + 0.4 * lensProgress);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 px-4 font-sans text-center">
      <div>
        <span className="text-zinc-400 text-sm block mb-4 uppercase tracking-[0.2em]">Hover Peek Preview Simulation</span>
        <p className="text-lg text-zinc-200">
          Hover link for preview:{" "}
          <span className="font-medium text-blue-400 underline decoration-blue-400 decoration-dotted cursor-pointer">
            {linkText}
          </span>
        </p>
      </div>

      {/* Absolute container to render the preview card simulation above */}
      {cardOpacity > 0 && (
        <div
          className="absolute z-50 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden pointer-events-none transition-all duration-75"
          style={{
            width: `${peekWidth}px`,
            height: `${peekHeight}px`,
            opacity: cardOpacity,
            transform: `perspective(800px) translateY(-110px) translateX(${cardX}px) scale(${cardScale}) rotateY(${cardRotateY}deg)`,
            transformOrigin: "center center",
          }}
        >
          {/* Base image */}
          <img
            src={imageUrl}
            width={peekWidth}
            height={peekHeight}
            className="block rounded-md object-cover bg-zinc-950 w-full h-full"
            alt="Link preview"
          />

          {/* Lens layer */}
          {isLensActive && (
            <div
              className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none"
              style={{
                opacity: lensOpacity,
                maskImage: `radial-gradient(circle ${lensSize / 2}px at ${lensX}px ${lensY}px, black ${lensSize / 2}px, transparent ${lensSize / 2}px)`,
                WebkitMaskImage: `radial-gradient(circle ${lensSize / 2}px at ${lensX}px ${lensY}px, black ${lensSize / 2}px, transparent ${lensSize / 2}px)`,
                transition: "opacity 0.15s ease",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${lensZoomFactor})`,
                  transformOrigin: `${lensX}px ${lensY}px`,
                  width: "100%",
                  height: "100%",
                }}
              >
                <img
                  src={imageUrl}
                  className="block rounded-md object-cover bg-zinc-950 w-full h-full"
                  alt="Zoom preview"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HoverPeekTemplate;
