import type { HtmlTemplateProps } from "../types";

export function PricingInteractionTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const plan1Name = String(values.plan1Name ?? "Free");
  const freePriceText = String(values.freePriceText ?? "$0.00");
  const plan2Name = String(values.plan2Name ?? "Starter");
  const plan3Name = String(values.plan3Name ?? "Pro");
  const ctaText = String(values.ctaText ?? "Get Started");
  const starterMonth = Number(values.starterMonth ?? 9);
  const starterAnnual = Number(values.starterAnnual ?? 79);
  const proMonth = Number(values.proMonth ?? 19);
  const proAnnual = Number(values.proAnnual ?? 159);
  const monthlyLabel = String(values.monthlyLabel ?? "Monthly");
  const yearlyLabel = String(values.yearlyLabel ?? "Yearly");
  const popularBadgeText = String(values.popularBadgeText ?? "Popular");
  const cycleDuration = Number(values.cycleDuration ?? 8);

  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Let's divide cycleDuration into two halves: Monthly and Yearly
  // Each half rotates through Free -> Starter -> Pro
  const t = time % cycleDuration;
  const periodProgress = t / cycleDuration; // 0.0 to 1.0

  // 1. Period state: 0 for Monthly, 1 for Yearly
  // We can transition period position smoothly around the half-cycle mark (0.5)
  const isYearly = periodProgress >= 0.5;
  
  // Smooth period transition (using a sharp transition near the middle)
  const transitionStart = 0.46;
  const transitionEnd = 0.5;
  const transitionStart2 = 0.96;
  const transitionEnd2 = 1.0;
  
  let smoothPeriod = 0;
  if (periodProgress >= transitionStart && periodProgress <= transitionEnd) {
    const fraction = (periodProgress - transitionStart) / (transitionEnd - transitionStart);
    smoothPeriod = fraction; // transition from 0 to 1
  } else if (periodProgress > transitionEnd && periodProgress < transitionStart2) {
    smoothPeriod = 1;
  } else if (periodProgress >= transitionStart2 && periodProgress <= transitionEnd2) {
    const fraction = (periodProgress - transitionStart2) / (transitionEnd2 - transitionStart2);
    smoothPeriod = 1.0 - fraction; // transition back from 1 to 0
  } else {
    smoothPeriod = 0;
  }

  // 2. Active plan state: 0 (Free), 1 (Starter), 2 (Pro)
  // Within each half-cycle, we cycle 0 -> 1 -> 2
  const subTime = isYearly ? t - cycleDuration / 2 : t;
  const subDuration = cycleDuration / 2;
  const subProgress = subTime / subDuration; // 0.0 to 1.0

  // Plan indices: 0 (Free), 1 (Starter), 2 (Pro)
  // We want to spend equal time on each plan and transition smoothly between them
  let targetPlan = 0;
  if (subProgress < 0.33) {
    targetPlan = 0;
  } else if (subProgress < 0.66) {
    targetPlan = 1;
  } else {
    targetPlan = 2;
  }

  // Smooth plan transition position
  // We'll calculate a continuous virtual plan coordinate from 0.0 to 2.0
  let virtualPlan = 0;
  if (subProgress < 0.28) {
    virtualPlan = 0;
  } else if (subProgress >= 0.28 && subProgress <= 0.38) {
    // transition 0 -> 1
    const f = (subProgress - 0.28) / 0.1;
    virtualPlan = f; // 0 to 1
  } else if (subProgress > 0.38 && subProgress < 0.61) {
    virtualPlan = 1;
  } else if (subProgress >= 0.61 && subProgress <= 0.71) {
    // transition 1 -> 2
    const f = (subProgress - 0.61) / 0.1;
    virtualPlan = 1 + f; // 1 to 2
  } else if (subProgress > 0.71 && subProgress < 0.9) {
    virtualPlan = 2;
  } else if (subProgress >= 0.9 && subProgress <= 1.0) {
    // transition 2 -> 0
    const f = (subProgress - 0.9) / 0.1;
    virtualPlan = 2 * (1 - f); // 2 to 0
  } else {
    virtualPlan = 0;
  }

  // Interpolated price numbers for the UI
  // When period transitions, the prices should animate smoothly!
  const currentStarterPrice = starterMonth * (1 - smoothPeriod) + (starterAnnual / 12) * smoothPeriod;
  const currentProPrice = proMonth * (1 - smoothPeriod) + (proAnnual / 12) * smoothPeriod;

  // Layout sizing relative to scaleFactor
  const cardWidth = 440 * scaleFactor;
  const padding = 20 * scaleFactor;
  const gap = 16 * scaleFactor;
  const headerHeight = 54 * scaleFactor;
  const planItemHeight = 90 * scaleFactor;
  const borderRadius = 28 * scaleFactor;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#090d16",
        backgroundImage: "radial-gradient(circle at center, #111a2e 0%, #05080e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Decorative background glow */}
      <div
        style={{
          position: "absolute",
          width: `${500 * scaleFactor}px`,
          height: `${500 * scaleFactor}px`,
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Pricing Card */}
      <div
        style={{
          width: `${cardWidth}px`,
          backgroundColor: "#ffffff",
          borderRadius: `${borderRadius}px`,
          padding: `${padding}px`,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          gap: `${gap}px`,
          color: "#0f172a",
        }}
      >
        {/* Period Selector (Monthly vs Yearly) */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: `${headerHeight}px`,
            backgroundColor: "#f1f5f9",
            borderRadius: "999px",
            padding: `${4 * scaleFactor}px`,
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Active Period Background Slider */}
          <div
            style={{
              position: "absolute",
              top: `${4 * scaleFactor}px`,
              bottom: `${4 * scaleFactor}px`,
              left: `${4 * scaleFactor}px`,
              width: `calc(50% - ${4 * scaleFactor}px)`,
              backgroundColor: "#ffffff",
              borderRadius: "999px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              transform: `translateX(${smoothPeriod * 100}%)`,
              zIndex: 1,
            }}
          />

          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: `${16 * scaleFactor}px`,
              fontWeight: 600,
              color: smoothPeriod < 0.5 ? "#0f172a" : "#64748b",
              zIndex: 2,
              userSelect: "none",
            }}
          >
            {monthlyLabel}
          </div>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: `${16 * scaleFactor}px`,
              fontWeight: 600,
              color: smoothPeriod >= 0.5 ? "#0f172a" : "#64748b",
              zIndex: 2,
              userSelect: "none",
            }}
          >
            {yearlyLabel}
          </div>
        </div>

        {/* Plans list */}
        <div
          style={{
            position: "relative",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: `${12 * scaleFactor}px`,
          }}
        >
          {/* Active Plan Border Overlay Highlight */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: `${planItemHeight}px`,
              border: `${3 * scaleFactor}px solid #000000`,
              borderRadius: `${16 * scaleFactor}px`,
              transform: `translateY(${virtualPlan * planItemHeight + virtualPlan * 12 * scaleFactor}px)`,
              pointerEvents: "none",
              zIndex: 5,
            }}
          />

          {/* Plan 1: Free */}
          <div
            style={{
              height: `${planItemHeight}px`,
              border: `${2 * scaleFactor}px solid #e2e8f0`,
              borderRadius: `${16 * scaleFactor}px`,
              padding: `0 ${20 * scaleFactor}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: targetPlan === 0 ? "#f8fafc" : "transparent",
              transition: "background-color 0.2s",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontSize: `${18 * scaleFactor}px`, fontWeight: 700, color: "#0f172a" }}>{plan1Name}</span>
              <span style={{ fontSize: `${14 * scaleFactor}px`, color: "#64748b" }}>
                <strong style={{ color: "#0f172a", fontWeight: 600 }}>{freePriceText}</strong>/month
              </span>
            </div>
            {/* Selection Check Circle */}
            <div
              style={{
                width: `${24 * scaleFactor}px`,
                height: `${24 * scaleFactor}px`,
                borderRadius: "50%",
                border: `${2 * scaleFactor}px solid ${targetPlan === 0 ? "#000000" : "#94a3b8"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: `${12 * scaleFactor}px`,
                  height: `${12 * scaleFactor}px`,
                  borderRadius: "50%",
                  backgroundColor: "#000000",
                  opacity: targetPlan === 0 ? 1 : 0,
                }}
              />
            </div>
          </div>

          {/* Plan 2: Starter */}
          <div
            style={{
              height: `${planItemHeight}px`,
              border: `${2 * scaleFactor}px solid #e2e8f0`,
              borderRadius: `${16 * scaleFactor}px`,
              padding: `0 ${20 * scaleFactor}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: targetPlan === 1 ? "#f8fafc" : "transparent",
              transition: "background-color 0.2s",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: `${8 * scaleFactor}px` }}>
                <span style={{ fontSize: `${18 * scaleFactor}px`, fontWeight: 700, color: "#0f172a" }}>{plan2Name}</span>
                  <span
                    style={{
                      fontSize: `${11 * scaleFactor}px`,
                      fontWeight: 600,
                      backgroundColor: "#fef9c3",
                      color: "#713f12",
                      padding: `${2 * scaleFactor}px ${8 * scaleFactor}px`,
                      borderRadius: `${6 * scaleFactor}px`,
                    }}
                  >
                    {popularBadgeText}
                  </span>
              </div>
              <span style={{ fontSize: `${14 * scaleFactor}px`, color: "#64748b" }}>
                <strong style={{ color: "#0f172a", fontWeight: 600 }}>
                  ${currentStarterPrice.toFixed(2)}
                </strong>
                /month
              </span>
            </div>
            {/* Selection Check Circle */}
            <div
              style={{
                width: `${24 * scaleFactor}px`,
                height: `${24 * scaleFactor}px`,
                borderRadius: "50%",
                border: `${2 * scaleFactor}px solid ${targetPlan === 1 ? "#000000" : "#94a3b8"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: `${12 * scaleFactor}px`,
                  height: `${12 * scaleFactor}px`,
                  borderRadius: "50%",
                  backgroundColor: "#000000",
                  opacity: targetPlan === 1 ? 1 : 0,
                }}
              />
            </div>
          </div>

          {/* Plan 3: Pro */}
          <div
            style={{
              height: `${planItemHeight}px`,
              border: `${2 * scaleFactor}px solid #e2e8f0`,
              borderRadius: `${16 * scaleFactor}px`,
              padding: `0 ${20 * scaleFactor}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: targetPlan === 2 ? "#f8fafc" : "transparent",
              transition: "background-color 0.2s",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontSize: `${18 * scaleFactor}px`, fontWeight: 700, color: "#0f172a" }}>{plan3Name}</span>
              <span style={{ fontSize: `${14 * scaleFactor}px`, color: "#64748b" }}>
                <strong style={{ color: "#0f172a", fontWeight: 600 }}>
                  ${currentProPrice.toFixed(2)}
                </strong>
                /month
              </span>
            </div>
            {/* Selection Check Circle */}
            <div
              style={{
                width: `${24 * scaleFactor}px`,
                height: `${24 * scaleFactor}px`,
                borderRadius: "50%",
                border: `${2 * scaleFactor}px solid ${targetPlan === 2 ? "#000000" : "#94a3b8"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: `${12 * scaleFactor}px`,
                  height: `${12 * scaleFactor}px`,
                  borderRadius: "50%",
                  backgroundColor: "#000000",
                  opacity: targetPlan === 2 ? 1 : 0,
                }}
              />
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          style={{
            width: "100%",
            height: `${56 * scaleFactor}px`,
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "none",
            borderRadius: "999px",
            fontSize: `${18 * scaleFactor}px`,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}
