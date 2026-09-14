"use client";

import { useMemo } from "react";
import { Rocket } from "lucide-react";
import type { HtmlTemplateProps } from "../types";

export function StateTemplate({ time, values }: HtmlTemplateProps) {
  const imageUrl = String(
    values.imageUrl ??
      "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop"
  );
  const title = String(values.title ?? "Your mail is full");
  const description = String(
    values.description ??
      "You have hit your storage limit. Clear out a few messages or upgrade your plan so you never miss a thing."
  );
  const primaryText = String(values.primaryText ?? "Upgrade Mail");
  const secondaryText = String(values.secondaryText ?? "Manage Storage");
  const cycleDuration = Number(values.cycleDuration ?? 6.0);

  const progress = (time % cycleDuration) / cycleDuration;

  const { imageStagger, titleStagger, descStagger, actionsStagger } = useMemo(() => {
    const getStagger = (start: number, end: number) => {
      const p = Math.max(0, Math.min(1, (progress - start) / (end - start)));
      return {
        opacity: p,
        y: (1 - p) * 20,
      };
    };

    return {
      imageStagger: getStagger(0.1, 0.4),
      titleStagger: getStagger(0.25, 0.55),
      descStagger: getStagger(0.4, 0.7),
      actionsStagger: getStagger(0.55, 0.85),
    };
  }, [progress]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center justify-center rounded-lg border border-white/10 bg-zinc-950 p-8 text-center shadow-lg">
        {/* Image section */}
        <img
          src={imageUrl}
          alt="Mailbox illustration"
          className="mb-6 h-40 w-40 object-contain"
          style={{
            opacity: imageStagger.opacity,
            transform: `translateY(${imageStagger.y}px)`,
            transition: "transform 0.05s linear, opacity 0.05s linear",
          }}
        />

        {/* Text content section */}
        <h2
          className="text-2xl font-semibold text-white"
          style={{
            opacity: titleStagger.opacity,
            transform: `translateY(${titleStagger.y}px)`,
            transition: "transform 0.05s linear, opacity 0.05s linear",
          }}
        >
          {title}
        </h2>

        <p
          className="mt-2 text-zinc-400"
          style={{
            opacity: descStagger.opacity,
            transform: `translateY(${descStagger.y}px)`,
            transition: "transform 0.05s linear, opacity 0.05s linear",
          }}
        >
          {description}
        </p>

        {/* Action buttons section */}
        <div
          className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
          style={{
            opacity: actionsStagger.opacity,
            transform: `translateY(${actionsStagger.y}px)`,
            transition: "transform 0.05s linear, opacity 0.05s linear",
          }}
        >
          <button className="w-full sm:w-auto px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 rounded-lg text-white font-medium shadow-sm transition">
            {secondaryText}
          </button>
          <button className="w-full sm:w-auto px-4 py-2 bg-white text-black hover:bg-white/90 rounded-lg font-medium shadow-sm transition flex items-center justify-center gap-2">
            <Rocket className="h-4 w-4" />
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StateTemplate;
