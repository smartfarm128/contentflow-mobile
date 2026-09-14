import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { Button } from "../ui/button";
import { placeholderAvatar } from "../local-placeholder";

// Dependency-free inline Avatar component to avoid radix-ui package mismatch errors
function Avatar({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  return (
    <div 
      className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-800 shadow-md"
      style={{ width: "40px", height: "40px" }}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className="aspect-square h-full w-full object-cover" 
          onError={(e) => {
            // fallback if image fails to load
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
          {fallback}
        </div>
      )}
    </div>
  );
}

export function HeroSectionTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Read controls
  const title = String(values.title ?? "How to make money");
  const subtitle = String(values.subtitle ?? "Achieve your goals and learn high-income skills with Coursiv");
  const infoBadgeText = String(values.infoBadgeText ?? "Annual income of Social Media Marketer: $70,000*");
  const ctaButtonText = String(values.ctaButtonText ?? "Get started");
  const socialProofText = String(values.socialProofText ?? "More than 100,000+ people joined");
  const accentColor = String(values.accentColor ?? "#3b82f6");
  
  const phrasesRaw = String(
    values.phrases ?? "in digital marketing?, with content creation?, through e-commerce, by mastering SEO"
  );
  
  const avatar1 = String(values.avatar1 ?? placeholderAvatar("fitcropq80"));
  const avatar2 = String(values.avatar2 ?? placeholderAvatar("fitcropq80"));
  const avatar3 = String(values.avatar3 ?? placeholderAvatar("fitcropq80"));

  const phrases = useMemo(() => {
    return phrasesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  }, [phrasesRaw]);

  // 2. Playhead-deterministic typewriter calculations
  // Configuration
  const charTypeSpeed = 0.08;
  const charDeleteSpeed = 0.05;
  const pauseTyped = 1.8;
  const pauseDeleted = 0.5;

  // Pre-calculate timing details for each phrase
  const { phraseCycles, totalCycleTime } = useMemo(() => {
    const list = phrases.map((p) => {
      const typeDuration = p.length * charTypeSpeed;
      const deleteDuration = p.length * charDeleteSpeed;
      const total = typeDuration + pauseTyped + deleteDuration + pauseDeleted;
      return {
        text: p,
        typeDuration,
        pauseTyped,
        deleteDuration,
        pauseDeleted,
        total,
      };
    });
    const total = list.reduce((sum, c) => sum + c.total, 0);
    return { phraseCycles: list, totalCycleTime: total || 1 };
  }, [phrases]);

  // Evaluate current text and cursor blinking based on time
  const { displayText, cursorVisible } = useMemo(() => {
    if (phraseCycles.length === 0) {
      return { displayText: "", cursorVisible: true };
    }

    const loopTime = time % totalCycleTime;
    let accumulated = 0;
    let currentPhrase = phraseCycles[0];
    let relativeTime = 0;

    for (const cycle of phraseCycles) {
      if (loopTime >= accumulated && loopTime < accumulated + cycle.total) {
        currentPhrase = cycle;
        relativeTime = loopTime - accumulated;
        break;
      }
      accumulated += cycle.total;
    }

    let text = "";
    let cursor = true;

    if (relativeTime < currentPhrase.typeDuration) {
      // Typing
      const charCount = Math.floor(relativeTime / charTypeSpeed);
      text = currentPhrase.text.slice(0, charCount);
      cursor = true;
    } else if (relativeTime < currentPhrase.typeDuration + currentPhrase.pauseTyped) {
      // Paused full text
      text = currentPhrase.text;
      const blinkTimer = relativeTime - currentPhrase.typeDuration;
      cursor = Math.floor(blinkTimer * 3.5) % 2 === 0;
    } else if (
      relativeTime <
      currentPhrase.typeDuration + currentPhrase.pauseTyped + currentPhrase.deleteDuration
    ) {
      // Deleting
      const deleteTime = relativeTime - (currentPhrase.typeDuration + currentPhrase.pauseTyped);
      const deletedChars = Math.floor(deleteTime / charDeleteSpeed);
      text = currentPhrase.text.slice(0, currentPhrase.text.length - deletedChars);
      cursor = true;
    } else {
      // Paused empty text
      text = "";
      const blinkTimer =
        relativeTime -
        (currentPhrase.typeDuration + currentPhrase.pauseTyped + currentPhrase.deleteDuration);
      cursor = Math.floor(blinkTimer * 3.5) % 2 === 0;
    }

    return { displayText: text, cursorVisible: cursor };
  }, [phraseCycles, totalCycleTime, time]);

  // 3. Scaling relative to a 1080p composition height
  const scaleFactor = Math.min(width, height) / 1080;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#08090d",
        backgroundImage: "radial-gradient(circle at center, #10131f 0%, #030406 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Decorative dynamic ambient glow */}
      <div
        style={{
          position: "absolute",
          width: `${800 * scaleFactor}px`,
          height: `${800 * scaleFactor}px`,
          background: `radial-gradient(circle, ${accentColor}0a 0%, transparent 70%)`,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          transform: `scale(${scaleFactor * 1.5})`,
          transformOrigin: "center center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: "750px",
          padding: "0 24px",
          zIndex: 10,
        }}
      >
        {/* Main Heading */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-[1.15]">
          {title}
          <div className="relative mt-3 block w-fit mx-auto">
            {/* Dashed border glow backdrop */}
            <span className="absolute inset-0 -z-10 -m-2.5">
              <span 
                className="absolute inset-0 border border-dashed rounded-2xl opacity-60"
                style={{ borderColor: accentColor }}
              />
            </span>
            {/* Typewriter text */}
            <span className="min-h-[1.2em] inline-block px-4 font-black" style={{ color: accentColor }}>
              {displayText}
              <span className={`ml-1 select-none ${cursorVisible ? "opacity-100" : "opacity-0"}`}>|</span>
            </span>
          </div>
        </h1>

        {/* Subtitle */}
        <p className="mt-8 text-zinc-400 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
          {subtitle}
        </p>

        {/* Action Details Container */}
        <div className="mt-10 flex flex-col items-center gap-6">
          {/* Info Badge */}
          {infoBadgeText && (
            <div className="inline-flex items-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-1.5 text-xs font-semibold tracking-wide shadow-sm">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {infoBadgeText}
            </div>
          )}

          {/* CTA Button */}
          <Button 
            size="lg" 
            className="px-8 py-5 text-base font-bold shadow-lg hover:shadow-xl hover:opacity-90 text-white rounded-xl border border-white/10"
            style={{ backgroundColor: accentColor }}
          >
            {ctaButtonText}
          </Button>

          {/* Social Proof */}
          <div className="mt-4 flex items-center justify-center">
            <div className="flex -space-x-3.5">
              <Avatar src={avatar1} alt="Customer Avatar 1" fallback="A1" />
              <Avatar src={avatar2} alt="Customer Avatar 2" fallback="A2" />
              <Avatar src={avatar3} alt="Customer Avatar 3" fallback="A3" />
            </div>
            <p className="ml-4 text-xs sm:text-sm font-semibold text-zinc-400">
              {socialProofText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
