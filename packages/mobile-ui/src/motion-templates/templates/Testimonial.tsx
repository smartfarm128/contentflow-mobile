/**
 * Testimonial slide — adapted from 21st.dev unique-testimonial.
 *
 * Original: click-to-switch, Unsplash avatars.
 * Adapted:  `time` drives activeIndex; cross-fade via eased fraction;
 *           avatars come from user-provided values (no external URLs).
 */

import type { HtmlTemplateProps } from "../types";

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function TestimonialTemplate({ time, progress, values, width }: HtmlTemplateProps) {
  const accent = String(values.accent ?? "#7bf1a8");
  const perSlide = Number(values.perSlide ?? 4);
  const fontFamily = "Inter, sans-serif";

  // Font sizes derived from canvas width (not vw)
  const quoteFontSize = Math.round(Math.max(14, Math.min(36, width * 0.028)));
  const roleFontSize = Math.round(Math.max(9, Math.min(13, width * 0.011)));
  const authorFontSize = Math.round(Math.max(10, Math.min(14, width * 0.012)));
  const quoteMarkSize = Math.round(Math.max(48, Math.min(100, width * 0.09)));

  // Parse testimonials from values
  const testimonials = [
    {
      quote: String(values.quote1 ?? "This changed everything for me."),
      author: String(values.author1 ?? "Sarah Chen"),
      role: String(values.role1 ?? "Designer at Figma"),
    },
    {
      quote: String(values.quote2 ?? "Simply brilliant. Nothing else compares."),
      author: String(values.author2 ?? "Marcus Johnson"),
      role: String(values.role2 ?? "Engineer at Vercel"),
    },
    {
      quote: String(values.quote3 ?? "The attention to detail is unmatched."),
      author: String(values.author3 ?? "Elena Rodriguez"),
      role: String(values.role3 ?? "Founder at Craft"),
    },
  ];

  const n = testimonials.length;
  const cycleTime = time % (perSlide * n);
  const activeIndex = Math.floor(cycleTime / perSlide) % n;
  // Fraction within current slide (0→1)
  const slideProgress = (cycleTime % perSlide) / perSlide;

  // Cross-fade: fade out last 15% of each slide, fade in first 15%
  const FADE = 0.15;
  let opacity = 1;
  if (slideProgress < FADE) {
    opacity = easeInOutQuad(slideProgress / FADE);
  } else if (slideProgress > 1 - FADE) {
    opacity = easeInOutQuad((1 - slideProgress) / FADE);
  }

  const active = testimonials[activeIndex];
  const blurPx = (1 - opacity) * 4;

  // Overall intro: fade in during first 3% of total clip
  const introOpacity = Math.min(1, progress / 0.03);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        opacity: introOpacity,
        padding: "8%",
      }}
    >
      {/* Opening quote mark */}
      <span
        style={{
          fontSize: `${quoteMarkSize}px`,
          lineHeight: 0.6,
          fontFamily: "Georgia, serif",
          color: "rgba(255,255,255,0.06)",
          userSelect: "none",
          alignSelf: "flex-start",
          marginLeft: "5%",
        }}
      >
        "
      </span>

      {/* Quote */}
      <p
        style={{
          fontSize: `${quoteFontSize}px`,
          fontWeight: 300,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.5,
          maxWidth: "680px",
          margin: "16px auto",
          opacity,
          filter: `blur(${blurPx}px)`,
          transform: `scale(${0.98 + 0.02 * opacity})`,
          transition: "none",
        }}
      >
        {active.quote}
      </p>

      {/* Role */}
      <p
        style={{
          fontSize: `${roleFontSize}px`,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginTop: "12px",
          opacity,
          transform: `translateY(${(1 - opacity) * 8}px)`,
        }}
      >
        {active.role}
      </p>

      {/* Author pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "24px",
        }}
      >
        {testimonials.map((t, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: isActive ? "6px 14px 6px 6px" : "2px",
                borderRadius: "999px",
                background: isActive ? "#ffffff" : "transparent",
                border: isActive ? "none" : "1px solid rgba(255,255,255,0.2)",
                transition: "all 400ms cubic-bezier(0.4,0,0.2,1)",
                gap: "8px",
              }}
            >
              {/* Avatar circle (initials) */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: isActive ? accent : "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isActive ? "#000" : "#fff",
                  flexShrink: 0,
                }}
              >
                {t.author.charAt(0)}
              </div>

              {/* Name — only visible when active */}
              {isActive && (
                <span
                  style={{
                    fontSize: `${authorFontSize}px`,
                    fontWeight: 600,
                    color: "#000000",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.author}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
