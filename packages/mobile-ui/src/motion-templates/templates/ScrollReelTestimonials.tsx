import React, { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

const CELL = 121.33;
const GAP = 8;
const STEP = 3 * (CELL + GAP);

const FEATURED_SHADOW =
  "0 1.008px 0.705px -0.563px rgba(0,0,0,0.18), 0 2.389px 1.672px -1.125px rgba(0,0,0,0.17), 0 4.357px 3.05px -1.688px rgba(0,0,0,0.17), 0 7.244px 5.07px -2.25px rgba(0,0,0,0.16), 0 11.698px 8.188px -2.813px rgba(0,0,0,0.15), 0 19.148px 13.404px -3.375px rgba(0,0,0,0.13), 0 32.972px 23.08px -3.938px rgba(0,0,0,0.09), 0 60px 42px -4.5px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.6)";

const QUOTE_CLASSES =
  "m-0 text-lg font-semibold leading-[1.35] tracking-[-0.02em] text-white sm:text-[22px]";
const AUTHOR_CLASSES =
  "m-0 text-sm font-semibold leading-[1.3] text-zinc-400";

function Cell() {
  return (
    <div
      aria-hidden="true"
      className="shrink-0 rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 blur-[0.5px] shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]"
      style={{ width: CELL, height: CELL }}
    />
  );
}

function Featured({ src, alt }: { src: string; alt?: string }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl bg-zinc-800 border border-white/10"
      style={{ width: CELL, height: CELL, boxShadow: FEATURED_SHADOW }}
    >
      <img
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
      />
      {/* Desaturate sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] bg-white mix-blend-saturation opacity-90"
      />
      {/* Sheen gradient overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[3] blur-[4px] mix-blend-overlay"
        style={{
          background:
            "linear-gradient(220.99deg, rgba(108,92,255,0) 32%, rgb(108,92,255) 41%, rgb(173,177,255) 47%, rgba(130,189,237,0.57) 54%, rgba(130,189,237,0) 65%)",
        }}
      />
    </div>
  );
}

// Deterministic character split rise animation
function Chars({
  text,
  startIndex,
  staggerSeconds,
  relativeTime,
}: {
  text: string;
  startIndex: number;
  staggerSeconds: number;
  relativeTime: number;
}) {
  let idx = startIndex;
  const words = text.split(" ");
  const riseDuration = 0.35; // rise takes 0.35 seconds per character

  return (
    <>
      {words.map((word, wi) => {
        const wordSpan = (
          <span key={wi} className="inline-block whitespace-nowrap">
            {Array.from(word).map((ch, ci) => {
              const delay = idx * staggerSeconds;
              idx++;

              // Calculate character position progress based on relativeTime
              let charProgress = 0;
              if (relativeTime >= delay) {
                charProgress = Math.min(1, (relativeTime - delay) / riseDuration);
              }

              // Ease transition
              const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
              const eased = easeOutCubic(charProgress);

              const yOffset = (1 - eased) * 24; // rises from 24px down to 0px
              const opacity = eased;

              return (
                <span
                  key={ci}
                  className="inline-block"
                  style={{
                    transform: `translate3d(0, ${yOffset}px, 0)`,
                    opacity: opacity,
                    willChange: "transform, opacity",
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        );
        if (wi < words.length - 1) idx++;
        return (
          <React.Fragment key={wi}>
            {wordSpan}
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

export function ScrollReelTestimonialsTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Read controls
  const slideDuration = Number(values.slideDuration ?? 4.0);
  const charStaggerMs = Number(values.charStaggerMs ?? 6);
  const staggerSeconds = charStaggerMs / 1000;

  const quote1 = String(values.quote1 ?? "Working with this team completely changed our infrastructure game. The support and expertise were incredible.");
  const author1 = String(values.author1 ?? "Michael Chen — Cloud Architecture");
  const img1 = String(values.image1 ?? "https://plus.unsplash.com/premium_photo-1689977807477-a579eda91fa2?q=80&w=300&auto=format&fit=crop");

  const quote2 = String(values.quote2 ?? "The data analytics platform they built gave our team the confidence and tools needed for true data-driven decisions.");
  const author2 = String(values.author2 ?? "Jessica Roberts — VP Product");
  const img2 = String(values.image2 ?? "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=300&q=80");

  const quote3 = String(values.quote3 ?? "NovaLabs helped our products find the perfect market-fit. Their engineering team exceeded every delivery milestone.");
  const author3 = String(values.author3 ?? "William Carter — Design Partner");
  const img3 = String(values.image3 ?? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80");

  const testimonials = useMemo(() => {
    return [
      { quote: quote1, author: author1, image: img1 },
      { quote: quote2, author: author2, image: img2 },
      { quote: quote3, author: author3, image: img3 },
    ].filter(t => t.quote && t.image);
  }, [quote1, author1, img1, quote2, author2, img2, quote3, author3, img3]);

  const count = testimonials.length;

  // 2. Playhead-deterministic calculation of active testimonial slide
  const totalCycleTime = count * slideDuration;
  const activeTime = time % totalCycleTime;

  const currentSlideIndex = Math.floor(activeTime / slideDuration);
  const relativeTime = activeTime % slideDuration;

  const transitionDuration = 0.8;
  const isTransitioning = relativeTime < transitionDuration;

  // Smooth ease curve
  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const transitionProgress = isTransitioning ? relativeTime / transitionDuration : 1.0;
  const easedProgress = easeInOutCubic(transitionProgress);

  const previousSlideIndex = (currentSlideIndex - 1 + count) % count;

  // Interpolated visual scroll index
  const visualIndex = useMemo(() => {
    if (isTransitioning) {
      if (currentSlideIndex === 0) {
        return (count - 1) * (1 - easedProgress);
      }
      return previousSlideIndex + easedProgress;
    }
    return currentSlideIndex;
  }, [isTransitioning, currentSlideIndex, previousSlideIndex, easedProgress, count]);

  // 3. Middle & Side columns geometry Y offset
  const centerIdx = (count - 1) / 2;
  const middleY = (centerIdx - visualIndex) * STEP;
  const sideY = -middleY;

  const sideCellCount = 4 + 2 * count;

  const middleItems = useMemo(() => {
    const items: Array<{ type: "cell" } | { type: "featured"; index: number }> = [];
    for (let i = 0; i < 3; i++) items.push({ type: "cell" });
    testimonials.forEach((_, i) => {
      items.push({ type: "featured", index: i });
      if (i < count - 1) {
        items.push({ type: "cell" }, { type: "cell" });
      }
    });
    for (let i = 0; i < 3; i++) items.push({ type: "cell" });
    return items;
  }, [testimonials, count]);

  // 4. Scaling parameters
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#06070a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          transform: `scale(${scaleFactor * 1.85})`,
          transformOrigin: "center center",
          display: "flex",
          flexDirection: "row",
          width: "100%",
          maxWidth: "1060px",
          height: "360px",
          alignItems: "stretch",
          gap: "10px",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "#0d0f14",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Profile Photos Columns section */}
        <div
          style={{
            position: "relative",
            width: "380px",
            height: "100%",
            flexShrink: 0,
            overflow: "hidden",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {/* Left column */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transform: `translate3d(0, ${sideY}px, 0)`,
                willChange: "transform",
              }}
            >
              {Array.from({ length: sideCellCount }).map((_, i) => (
                <Cell key={i} />
              ))}
            </div>

            {/* Middle column */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transform: `translate3d(0, ${middleY}px, 0)`,
                willChange: "transform",
              }}
            >
              {middleItems.map((item, i) =>
                item.type === "featured" ? (
                  <Featured
                    key={i}
                    src={testimonials[item.index].image}
                    alt={testimonials[item.index].quote}
                  />
                ) : (
                  <Cell key={i} />
                )
              )}
            </div>

            {/* Right column */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transform: `translate3d(0, ${sideY}px, 0)`,
                willChange: "transform",
              }}
            >
              {Array.from({ length: sideCellCount }).map((_, i) => (
                <Cell key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Quotes & Authors Content section */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "24px 32px",
            position: "relative",
          }}
        >
          <svg
            className="block h-10 w-10 text-zinc-700/60 mb-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M4.58 17.32C3.55 16.23 3 15 3 13.01c0-3.5 2.46-6.64 6.03-8.19l.9 1.38c-3.34 1.8-4 4.15-4.25 5.62.54-.28 1.24-.38 1.93-.31 1.8.17 3.23 1.65 3.23 3.49a3.5 3.5 0 0 1-3.5 3.5c-1.07 0-2.1-.49-2.75-1.18zm10 0C13.55 16.23 13 15 13 13.01c0-3.5 2.46-6.64 6.03-8.19l.9 1.38c-3.34 1.8-4 4.15-4.25 5.62.54-.28 1.24-.38 1.93-.31 1.8.17 3.23 1.65 3.23 3.49a3.5 3.5 0 0 1-3.5 3.5c-1.07 0-2.1-.49-2.75-1.18z" />
          </svg>

          <div style={{ position: "relative", width: "100%", height: "180px" }}>
            {/* Transition exit (previous slide text fading out) */}
            {isTransitioning && count > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  opacity: 1 - easedProgress,
                }}
              >
                <p className={QUOTE_CLASSES}>{testimonials[previousSlideIndex].quote}</p>
                <p className={AUTHOR_CLASSES}>{testimonials[previousSlideIndex].author}</p>
              </div>
            )}

            {/* Transition enter/normal (current slide text fading in + rising) */}
            {count > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  opacity: isTransitioning ? easedProgress : 1.0,
                }}
              >
                <p className={QUOTE_CLASSES}>
                  <Chars
                    text={testimonials[currentSlideIndex].quote}
                    startIndex={0}
                    staggerSeconds={staggerSeconds}
                    relativeTime={relativeTime}
                  />
                </p>
                <p className={AUTHOR_CLASSES}>
                  <Chars
                    text={testimonials[currentSlideIndex].author}
                    startIndex={testimonials[currentSlideIndex].quote.length + 6}
                    staggerSeconds={staggerSeconds}
                    relativeTime={relativeTime}
                  />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
