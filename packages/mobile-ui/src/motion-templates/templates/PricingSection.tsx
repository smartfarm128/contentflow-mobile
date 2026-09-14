import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

// Linear interpolation helper
function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

// Cubic ease-out helper
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Deterministic Sparkles Component
function SparklesDeterministic({ time, scale }: { time: number; scale: number }) {
  const stars = useMemo(() => {
    const list = [];
    for (let i = 0; i < 40; i++) {
      const xSeed = Math.sin(i * 12.34) * 0.5 + 0.5; // 0.0 to 1.0
      const ySeed = Math.cos(i * 56.78) * 0.5 + 0.5; // 0.0 to 1.0
      const sizeSeed = Math.sin(i * 90.12) * 0.5 + 0.5;
      const speed = 0.3 + Math.sin(i * 34.56) * 0.2;
      list.push({ i, xSeed, ySeed, sizeSeed, speed });
    }
    return list;
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {stars.map((star) => {
        const yOffset = ((star.ySeed * 100 - time * star.speed * 12) % 100 + 100) % 100;
        const xOffset = star.xSeed * 100 + Math.sin(time * 0.8 + star.i) * 2;
        const opacity = 0.15 + 0.7 * (0.5 + 0.5 * Math.sin(time * 3 + star.i));
        const size = (1 + star.sizeSeed * 2.5) * scale;

        return (
          <div
            key={star.i}
            style={{
              position: "absolute",
              left: `${xOffset}%`,
              top: `${yOffset}%`,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              opacity,
              boxShadow: `0 0 ${4 * scale}px #ffffff`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
}

export function PricingSectionTemplate({ progress, time, width, values }: HtmlTemplateProps) {
  // Read customized template values with fallbacks
  const titleText = String(values.title ?? "Plans that works best for your");
  const subtitleText = String(values.subtitle ?? "Trusted by millions, We help teams all around the world, Explore which option is right for you.");
  const monthlyLabel = String(values.monthlyLabel ?? "Monthly");
  const yearlyLabel = String(values.yearlyLabel ?? "Yearly");
  const ctaText = String(values.ctaText ?? "Get started");

  // Plan 1 (Starter)
  const plan1Name = String(values.plan1Name ?? "Starter");
  const plan1Price = Number(values.plan1Price ?? 12);
  const plan1YearlyPrice = Number(values.plan1YearlyPrice ?? 99);
  const plan1Desc = String(values.plan1Desc ?? "Great for small businesses and startups looking to get started with AI");

  // Plan 2 (Business)
  const plan2Name = String(values.plan2Name ?? "Business");
  const plan2Price = Number(values.plan2Price ?? 48);
  const plan2YearlyPrice = Number(values.plan2YearlyPrice ?? 399);
  const plan2Desc = String(values.plan2Desc ?? "Best value for growing businesses that need more advanced features");
  const plan2Popular = !!(values.plan2Popular ?? true);

  // Plan 3 (Enterprise)
  const plan3Name = String(values.plan3Name ?? "Enterprise");
  const plan3Price = Number(values.plan3Price ?? 96);
  const plan3YearlyPrice = Number(values.plan3YearlyPrice ?? 899);
  const plan3Desc = String(values.plan3Desc ?? "Advanced plan with enhanced security and unlimited access for large teams");

  // Responsive scaling factor relative to 1920px canvas
  const scale = width / 1920;

  // 1. Blue Ellipses Entrance (progress 0.0 to 0.3)
  const ellipseProgress = Math.max(0, Math.min(1, progress / 0.3));
  const ellipseEase = easeOutCubic(ellipseProgress);
  const ellipseScale = lerp(0.8, 1.0, ellipseEase);
  const ellipseOpacity = lerp(0.0, 0.65, ellipseEase);

  // 2. Title word-by-word reveal (progress 0.15 to 0.45)
  const titleWords = titleText.split(" ");
  const revealedTitle = titleWords.map((word, idx) => {
    const totalWords = titleWords.length;
    const wordDuration = 0.15;
    const start = 0.15 + (idx * 0.1) / totalWords;
    const end = start + wordDuration;
    const wordProgress = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    const wordEase = easeOutCubic(wordProgress);
    const wordY = (1 - wordEase) * 100; // slide up from 100%
    return { word, y: wordY };
  });

  // 3. Subtitle fade/slide-up (progress 0.35 to 0.60)
  const subtitleProgress = Math.max(0, Math.min(1, (progress - 0.35) / 0.25));
  const subtitleEase = easeOutCubic(subtitleProgress);
  const subtitleOpacity = subtitleProgress;
  const subtitleY = (1 - subtitleEase) * 30 * scale;

  // 4. Toggle switch slide-up (progress 0.40 to 0.65)
  const toggleProgress = Math.max(0, Math.min(1, (progress - 0.40) / 0.25));
  const toggleEase = easeOutCubic(toggleProgress);
  const toggleOpacity = toggleProgress;
  const toggleY = (1 - toggleEase) * 30 * scale;

  // 5. Staggered pricing cards slide-up/fade (Starter: 0.50-0.70, Business: 0.58-0.78, Enterprise: 0.66-0.86)
  const getCardTransition = (cardIndex: number) => {
    const start = 0.50 + cardIndex * 0.08;
    const end = start + 0.20;
    const cardProgress = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    const cardEase = easeOutCubic(cardProgress);
    return {
      opacity: cardProgress,
      y: (1 - cardEase) * 50 * scale,
    };
  };

  const card1Anim = getCardTransition(0);
  const card2Anim = getCardTransition(1);
  const card3Anim = getCardTransition(2);

  // 6. Yearly toggle transition: progress 0.80 to 0.84
  const isYearly = progress >= 0.82;
  const switchShiftProgress = Math.max(0, Math.min(1, (progress - 0.80) / 0.04));
  const switchShiftEase = easeOutCubic(switchShiftProgress);
  // Monthly to Yearly slider shift indicator (translates slider left/right)
  const sliderTranslateX = lerp(0, 100 * scale, isYearly ? switchShiftEase : (1 - switchShiftEase));

  // Determine rendered prices
  const plan1DisplayPrice = isYearly ? plan1YearlyPrice : plan1Price;
  const plan2DisplayPrice = isYearly ? plan2YearlyPrice : plan2Price;
  const plan3DisplayPrice = isYearly ? plan3YearlyPrice : plan3Price;

  // Card Content Lists
  const plan1Includes = String(values.plan1Features ?? "Free includes:,Unlimited Cards,Custom background & stickers,2-factor authentication")
    .split(",")
    .map(f => f.trim())
    .filter(Boolean);
  const plan2Includes = String(values.plan2Features ?? "Everything in Starter, plus:,Advanced checklists,Custom fields,Serverless functions")
    .split(",")
    .map(f => f.trim())
    .filter(Boolean);
  const plan3Includes = String(values.plan3Features ?? "Everything in Business, plus:,Multi-board management,Multi-board guest,Attachment permissions")
    .split(",")
    .map(f => f.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Space Grotesk, sans-serif",
        color: "#ffffff",
        userSelect: "none",
      }}
    >
      {/* Background Ellipses */}
      <div
        style={{
          position: "absolute",
          top: "-114px",
          left: 0,
          right: 0,
          height: "113.625vh",
          display: "flex",
          justifyContent: "center",
          opacity: ellipseOpacity,
          transform: `scale(${ellipseScale})`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: `${1200 * scale}px`,
            height: `${1200 * scale}px`,
            border: `${200 * scale}px solid #3131f5`,
            borderRadius: "50%",
            filter: "blur(92px)",
            WebkitFilter: "blur(92px)",
          }}
        />
      </div>

      {/* Grid overlay & Sparkles */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(58, 58, 58, 0.005) 1px, transparent 1px)`,
          backgroundSize: `${70 * scale}px ${80 * scale}px`,
          maskImage: "radial-gradient(50% 50%, white, transparent)",
          WebkitMaskImage: "radial-gradient(50% 50%, white, transparent)",
          zIndex: 2,
        }}
      />
      <SparklesDeterministic time={time} scale={scale} />

      {/* Radial Blue Glow */}
      <div
        style={{
          position: "absolute",
          left: "10%",
          right: "10%",
          top: 0,
          height: "100%",
          backgroundImage: "radial-gradient(circle at center, #206ce8 0%, transparent 70%)",
          opacity: 0.35,
          mixBlendMode: "multiply",
          zIndex: 3,
        }}
      />

      {/* Container holding header + toggle + cards */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: `${1024 * scale}px`,
          padding: `${20 * scale}px`,
        }}
      >
        {/* Header Block */}
        <div
          style={{
            textAlign: "center",
            marginBottom: `${24 * scale}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: `${12 * scale}px`,
          }}
        >
          {/* Title with Vertical Cut Reveal */}
          <h2
            style={{
              fontSize: `${40 * scale}px`,
              fontWeight: 500,
              margin: 0,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: `${10 * scale}px`,
              lineHeight: 1.2,
            }}
          >
            {revealedTitle.map((item, idx) => (
              <span
                key={idx}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  position: "relative",
                  height: `${48 * scale}px`,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${item.y}%)`,
                  }}
                >
                  {item.word}
                </span>
              </span>
            ))}
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: `${16 * scale}px`,
              color: "#d1d5db",
              margin: 0,
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleY}px)`,
              maxWidth: `${720 * scale}px`,
              lineHeight: 1.5,
            }}
          >
            {subtitleText}
          </p>

          {/* Monthly / Yearly Switch Toggle */}
          <div
            style={{
              opacity: toggleOpacity,
              transform: `translateY(${toggleY}px)`,
              marginTop: `${12 * scale}px`,
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                backgroundColor: "#171717",
                border: `${1 * scale}px solid #374151`,
                padding: `${4 * scale}px`,
                borderRadius: `${9999}px`,
              }}
            >
              {/* Sliding Switch Pill */}
              <div
                style={{
                  position: "absolute",
                  top: `${4 * scale}px`,
                  left: `${4 * scale}px`,
                  height: `${32 * scale}px`,
                  width: `${110 * scale}px`,
                  borderRadius: `${9999}px`,
                  border: `${3 * scale}px solid #2563eb`,
                  boxShadow: `0 2px 4px rgba(37,99,235,0.4)`,
                  background: "linear-gradient(to top, #3b82f6, #2563eb)",
                  transform: `translateX(${sliderTranslateX}px)`,
                  transition: "transform 100ms ease",
                  zIndex: 1,
                }}
              />
              <button
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: `${110 * scale}px`,
                  height: `${32 * scale}px`,
                  border: "none",
                  background: "transparent",
                  color: !isYearly ? "#ffffff" : "#9ca3af",
                  fontWeight: 500,
                  fontSize: `${14 * scale}px`,
                  cursor: "pointer",
                }}
              >
                {monthlyLabel}
              </button>
              <button
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: `${110 * scale}px`,
                  height: `${32 * scale}px`,
                  border: "none",
                  background: "transparent",
                  color: isYearly ? "#ffffff" : "#9ca3af",
                  fontWeight: 500,
                  fontSize: `${14 * scale}px`,
                  cursor: "pointer",
                }}
              >
                {yearlyLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: `${16 * scale}px`,
            width: "100%",
          }}
        >
          {/* Card 1: Starter */}
          <div
            style={{
              opacity: card1Anim.opacity,
              transform: `translateY(${card1Anim.y}px)`,
              background: "linear-gradient(to right, #171717, #262626, #171717)",
              borderRadius: `${12 * scale}px`,
              border: `${1 * scale}px solid #262626`,
              padding: `${24 * scale}px`,
              display: "flex",
              flexDirection: "column",
              height: `${530 * scale}px`,
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ fontSize: `${28 * scale}px`, margin: `0 0 ${8 * scale}px 0`, fontWeight: 400 }}>{plan1Name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: `${12 * scale}px` }}>
                <span style={{ fontSize: `${38 * scale}px`, fontWeight: 600 }}>${plan1DisplayPrice}</span>
                <span style={{ color: "#d1d5db", marginLeft: `${4 * scale}px`, fontSize: `${14 * scale}px` }}>/{isYearly ? "year" : "month"}</span>
              </div>
              <p style={{ fontSize: `${13 * scale}px`, color: "#d1d5db", margin: `0 0 ${20 * scale}px 0`, lineHeight: 1.4 }}>{plan1Desc}</p>
            </div>

            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <button
                style={{
                  width: "100%",
                  marginBottom: `${20 * scale}px`,
                  padding: `${12 * scale}px`,
                  fontSize: `${16 * scale}px`,
                  borderRadius: `${10 * scale}px`,
                  border: `${1 * scale}px solid #262626`,
                  background: "linear-gradient(to top, #0a0a0a, #4a4a4a)",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                {ctaText}
              </button>
              <div style={{ borderTop: `${1 * scale}px solid #404040`, paddingTop: `${16 * scale}px` }}>
                <h4 style={{ fontSize: `${14 * scale}px`, fontWeight: 500, margin: `0 0 ${12 * scale}px 0` }}>{plan1Includes[0]}</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: `${8 * scale}px` }}>
                  {plan1Includes.slice(1).map((feature, fIdx) => (
                    <li key={fIdx} style={{ display: "flex", alignItems: "center", gap: `${8 * scale}px`, fontSize: `${13 * scale}px`, color: "#d1d5db" }}>
                      <span style={{ width: `${8 * scale}px`, height: `${8 * scale}px`, backgroundColor: "#737373", borderRadius: "50%" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Card 2: Business (Popular) */}
          <div
            style={{
              opacity: card2Anim.opacity,
              transform: `translateY(${card2Anim.y}px)`,
              background: "linear-gradient(to right, #171717, #262626, #171717)",
              borderRadius: `${12 * scale}px`,
              border: `${1 * scale}px solid #262626`,
              padding: `${24 * scale}px`,
              display: "flex",
              flexDirection: "column",
              height: `${530 * scale}px`,
              justifyContent: "space-between",
              boxShadow: plan2Popular ? `0 -13px ${100 * scale}px 0 rgba(9, 0, 255, 0.4)` : "none",
              position: "relative",
              zIndex: 5,
            }}
          >
            <div>
              <h3 style={{ fontSize: `${28 * scale}px`, margin: `0 0 ${8 * scale}px 0`, fontWeight: 400 }}>{plan2Name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: `${12 * scale}px` }}>
                <span style={{ fontSize: `${38 * scale}px`, fontWeight: 600 }}>${plan2DisplayPrice}</span>
                <span style={{ color: "#d1d5db", marginLeft: `${4 * scale}px`, fontSize: `${14 * scale}px` }}>/{isYearly ? "year" : "month"}</span>
              </div>
              <p style={{ fontSize: `${13 * scale}px`, color: "#d1d5db", margin: `0 0 ${20 * scale}px 0`, lineHeight: 1.4 }}>{plan2Desc}</p>
            </div>

            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <button
                style={{
                  width: "100%",
                  marginBottom: `${20 * scale}px`,
                  padding: `${12 * scale}px`,
                  fontSize: `${16 * scale}px`,
                  borderRadius: `${10 * scale}px`,
                  border: `${1 * scale}px solid #3b82f6`,
                  background: "linear-gradient(to top, #3b82f6, #2563eb)",
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: `0 4px ${12 * scale}px rgba(37,99,235,0.5)`,
                }}
              >
                {ctaText}
              </button>
              <div style={{ borderTop: `${1 * scale}px solid #404040`, paddingTop: `${16 * scale}px` }}>
                <h4 style={{ fontSize: `${14 * scale}px`, fontWeight: 500, margin: `0 0 ${12 * scale}px 0` }}>{plan2Includes[0]}</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: `${8 * scale}px` }}>
                  {plan2Includes.slice(1).map((feature, fIdx) => (
                    <li key={fIdx} style={{ display: "flex", alignItems: "center", gap: `${8 * scale}px`, fontSize: `${13 * scale}px`, color: "#d1d5db" }}>
                      <span style={{ width: `${8 * scale}px`, height: `${8 * scale}px`, backgroundColor: "#737373", borderRadius: "50%" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Card 3: Enterprise */}
          <div
            style={{
              opacity: card3Anim.opacity,
              transform: `translateY(${card3Anim.y}px)`,
              background: "linear-gradient(to right, #171717, #262626, #171717)",
              borderRadius: `${12 * scale}px`,
              border: `${1 * scale}px solid #262626`,
              padding: `${24 * scale}px`,
              display: "flex",
              flexDirection: "column",
              height: `${530 * scale}px`,
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ fontSize: `${28 * scale}px`, margin: `0 0 ${8 * scale}px 0`, fontWeight: 400 }}>{plan3Name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: `${12 * scale}px` }}>
                <span style={{ fontSize: `${38 * scale}px`, fontWeight: 600 }}>${plan3DisplayPrice}</span>
                <span style={{ color: "#d1d5db", marginLeft: `${4 * scale}px`, fontSize: `${14 * scale}px` }}>/{isYearly ? "year" : "month"}</span>
              </div>
              <p style={{ fontSize: `${13 * scale}px`, color: "#d1d5db", margin: `0 0 ${20 * scale}px 0`, lineHeight: 1.4 }}>{plan3Desc}</p>
            </div>

            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <button
                style={{
                  width: "100%",
                  marginBottom: `${20 * scale}px`,
                  padding: `${12 * scale}px`,
                  fontSize: `${16 * scale}px`,
                  borderRadius: `${10 * scale}px`,
                  border: `${1 * scale}px solid #262626`,
                  background: "linear-gradient(to top, #0a0a0a, #4a4a4a)",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                {ctaText}
              </button>
              <div style={{ borderTop: `${1 * scale}px solid #404040`, paddingTop: `${16 * scale}px` }}>
                <h4 style={{ fontSize: `${14 * scale}px`, fontWeight: 500, margin: `0 0 ${12 * scale}px 0` }}>{plan3Includes[0]}</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: `${8 * scale}px` }}>
                  {plan3Includes.slice(1).map((feature, fIdx) => (
                    <li key={fIdx} style={{ display: "flex", alignItems: "center", gap: `${8 * scale}px`, fontSize: `${13 * scale}px`, color: "#d1d5db" }}>
                      <span style={{ width: `${8 * scale}px`, height: `${8 * scale}px`, backgroundColor: "#737373", borderRadius: "50%" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
