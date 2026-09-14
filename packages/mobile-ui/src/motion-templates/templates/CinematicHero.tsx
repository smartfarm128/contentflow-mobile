import type { HtmlTemplateProps } from "../types";

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export function CinematicHeroTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const brandName = String(values.brandName ?? "Sobers");
  const tagline1 = String(values.tagline1 ?? "Track the journey,");
  const tagline2 = String(values.tagline2 ?? "not just the days.");
  const cardHeading = String(values.cardHeading ?? "Accountability, redefined.");
  const cardDescription = String(
    values.cardDescription ?? 
    "Sobers empowers sponsors and sponsees in 12-step recovery programs with structured accountability, precise sobriety tracking, and beautiful visual timelines."
  );
  const metricValue = Number(values.metricValue ?? 365);
  const metricLabel = String(values.metricLabel ?? "Days Sober");
  const ctaHeading = String(values.ctaHeading ?? "Start your recovery.");
  const ctaDescription = String(values.ctaDescription ?? "Join thousands of others in the 12-step program today.");

  // 2. Scale Factor
  const scaleFactor = Math.min(width, height) / 1080;

  // 3. Mathematical Animation Checkpoints
  // - y offset of the card sliding up / down
  let cardY = height + 200 * scaleFactor;
  if (progress <= 0.15) {
    cardY = lerp(height + 200 * scaleFactor, 0, progress / 0.15);
  } else if (progress <= 0.9) {
    cardY = 0;
  } else {
    cardY = lerp(0, -height - 300 * scaleFactor, (progress - 0.9) / 0.1);
  }

  // - Card sizes as percentages of screen dimensions
  let cardWidthPct = 92;
  let cardHeightPct = 92;
  if (progress > 0.15 && progress <= 0.3) {
    const t = (progress - 0.15) / 0.15;
    cardWidthPct = lerp(92, 100, t);
    cardHeightPct = lerp(92, 100, t);
  } else if (progress > 0.3 && progress <= 0.75) {
    cardWidthPct = 100;
    cardHeightPct = 100;
  } else if (progress > 0.75 && progress <= 0.9) {
    const t = (progress - 0.75) / 0.15;
    cardWidthPct = lerp(100, 85, t);
    cardHeightPct = lerp(100, 85, t);
  } else if (progress > 0.9) {
    cardWidthPct = 85;
    cardHeightPct = 85;
  }

  // - Card border radius
  let cardRad = 40 * scaleFactor;
  if (progress > 0.15 && progress <= 0.3) {
    cardRad = lerp(40 * scaleFactor, 0, (progress - 0.15) / 0.15);
  } else if (progress > 0.3 && progress <= 0.75) {
    cardRad = 0;
  } else if (progress > 0.75 && progress <= 0.9) {
    cardRad = lerp(0, 40 * scaleFactor, (progress - 0.75) / 0.15);
  } else if (progress > 0.9) {
    cardRad = 40 * scaleFactor;
  }

  // - Hero Text styling
  let heroOpacity = 1;
  let heroScale = 1.0;
  let heroBlur = 0;
  if (progress <= 0.15) {
    const t = progress / 0.15;
    heroOpacity = lerp(1, 0.2, t);
    heroScale = lerp(1.0, 1.15, t);
    heroBlur = lerp(0, 20, t);
  } else if (progress <= 0.65) {
    heroOpacity = 0.2;
    heroScale = 1.15;
    heroBlur = 20;
  } else {
    heroOpacity = 0;
    heroScale = 1.15;
    heroBlur = 20;
  }

  // - Phone mockup transitions
  let mockupOpacity = 0;
  let mockupY = 300 * scaleFactor;
  let mockupScale = 0.6;
  if (progress > 0.3 && progress <= 0.5) {
    const t = (progress - 0.3) / 0.2;
    mockupOpacity = lerp(0, 1, t);
    mockupY = lerp(300 * scaleFactor, 0, t);
    mockupScale = lerp(0.6, 1.0, t);
  } else if (progress > 0.5 && progress <= 0.75) {
    mockupOpacity = 1;
    mockupY = 0;
    mockupScale = 1.0;
  } else if (progress > 0.75 && progress <= 0.9) {
    const t = (progress - 0.75) / 0.15;
    mockupOpacity = lerp(1, 0, t);
    mockupY = lerp(0, -40 * scaleFactor, t);
    mockupScale = lerp(1.0, 0.9, t);
  }

  // - Progress ring SVG dashoffset & ticker metric
  let ringOffset = 402;
  let counterVal = 0;
  if (progress > 0.3 && progress <= 0.5) {
    const t = (progress - 0.3) / 0.2;
    ringOffset = lerp(402, 60, t);
    counterVal = Math.round(lerp(0, metricValue, t));
  } else if (progress > 0.5) {
    ringOffset = 60;
    counterVal = metricValue;
  }

  // - Floating badges & card texts
  let badgeOpacity = 0;
  let badgeY = 100 * scaleFactor;
  let cardTextOpacity = 0;
  if (progress > 0.5 && progress <= 0.65) {
    const t = (progress - 0.5) / 0.15;
    badgeOpacity = lerp(0, 1, t);
    badgeY = lerp(100 * scaleFactor, 0, t);
    cardTextOpacity = lerp(0, 1, t);
  } else if (progress > 0.65 && progress <= 0.75) {
    badgeOpacity = 1;
    badgeY = 0;
    cardTextOpacity = 1;
  } else if (progress > 0.75 && progress <= 0.9) {
    const t = (progress - 0.75) / 0.15;
    badgeOpacity = lerp(1, 0, t);
    badgeY = lerp(0, -40 * scaleFactor, t);
    cardTextOpacity = lerp(1, 0, t);
  }

  // - CTA buttons
  let ctaOpacity = 0;
  let ctaScale = 0.8;
  let ctaBlur = 30;
  if (progress > 0.75 && progress <= 0.9) {
    const t = (progress - 0.75) / 0.15;
    ctaOpacity = lerp(0, 1, t);
    ctaScale = lerp(0.8, 1.0, t);
    ctaBlur = lerp(30, 0, t);
  } else if (progress > 0.9) {
    ctaOpacity = 1;
    ctaScale = 1.0;
    ctaBlur = 0;
  }

  // 4. Styles definition
  const styles = `
    .film-grain {
        position: absolute; inset: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 50; opacity: 0.05; mix-blend-mode: overlay;
        background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
    }

    .bg-grid-theme {
        background-size: ${60 * scaleFactor}px ${60 * scaleFactor}px;
        background-image: 
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
        mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
        -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    }

    .text-3d-matte {
        color: #ffffff;
        text-shadow: 0 10px 30px rgba(255,255,255,0.2), 0 2px 4px rgba(255,255,255,0.1);
    }

    .text-silver-matte {
        background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.4) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0px 10px 20px rgba(255,255,255,0.15)) drop-shadow(0px 2px 4px rgba(255,255,255,0.1));
    }

    .text-card-silver-matte {
        background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0px 12px 24px rgba(0,0,0,0.8)) drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
    }

    .premium-depth-card {
        background: linear-gradient(145deg, #162C6D 0%, #0A101D 100%);
        box-shadow: 
            0 40px 100px -20px rgba(0, 0, 0, 0.9),
            0 20px 40px -20px rgba(0, 0, 0, 0.8),
            inset 0 1px 2px rgba(255, 255, 255, 0.2),
            inset 0 -2px 4px rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .iphone-bezel {
        background-color: #111;
        box-shadow: 
            inset 0 0 0 2px #52525B, 
            inset 0 0 0 7px #000, 
            0 40px 80px -15px rgba(0,0,0,0.9),
            0 15px 25px -5px rgba(0,0,0,0.7);
        transform-style: preserve-3d;
    }

    .hardware-btn {
        background: linear-gradient(90deg, #404040 0%, #171717 100%);
        box-shadow: 
            -2px 0 5px rgba(0,0,0,0.8),
            inset -1px 0 1px rgba(255,255,255,0.15),
            inset 1px 0 2px rgba(0,0,0,0.8);
        border-left: 1px solid rgba(255,255,255,0.05);
    }

    .floating-ui-badge {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%);
        backdrop-filter: blur(24px); 
        -webkit-backdrop-filter: blur(24px);
        box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 25px 50px -12px rgba(0, 0, 0, 0.8),
            inset 0 1px 1px rgba(255,255,255,0.2),
            inset 0 -1px 1px rgba(0,0,0,0.5);
    }

    .progress-ring {
        transform: rotate(-90deg);
        transform-origin: center;
        stroke-dasharray: 402;
        stroke-linecap: round;
    }

    .btn-modern-light, .btn-modern-dark {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
  `;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000000",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="film-grain" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-40" />

      {/* BACKGROUND LAYER: Hero Texts */}
      {heroOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
            opacity: heroOpacity,
            filter: `blur(${heroBlur}px)`,
            transform: `scale(${heroScale})`,
          }}
        >
          <h1
            className="text-3d-matte"
            style={{
              fontSize: `${80 * scaleFactor}px`,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {tagline1}
          </h1>
          <h1
            className="text-silver-matte"
            style={{
              marginTop: `${12 * scaleFactor}px`,
              fontSize: `${80 * scaleFactor}px`,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {tagline2}
          </h1>
        </div>
      )}

      {/* BACKGROUND LAYER 2: CTA Wrapper */}
      {ctaOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 15,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
            opacity: ctaOpacity,
            filter: `blur(${ctaBlur}px)`,
            transform: `scale(${ctaScale})`,
            padding: `0 ${32 * scaleFactor}px`,
          }}
        >
          <h2
            className="text-silver-matte"
            style={{
              fontSize: `${72 * scaleFactor}px`,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: `${24 * scaleFactor}px`,
            }}
          >
            {ctaHeading}
          </h2>
          <p
            style={{
              color: "#a1a1aa",
              fontSize: `${20 * scaleFactor}px`,
              fontWeight: 300,
              lineHeight: 1.6,
              maxWidth: `${640 * scaleFactor}px`,
              margin: "0 auto",
              marginBottom: `${48 * scaleFactor}px`,
            }}
          >
            {ctaDescription}
          </p>
          <div style={{ display: "flex", flexDirection: "row", gap: `${24 * scaleFactor}px` }}>
            <div
              style={{
                backgroundColor: "#ffffff",
                color: "#0a0a0a",
                fontWeight: 700,
                fontSize: `${16 * scaleFactor}px`,
                padding: `${16 * scaleFactor}px ${36 * scaleFactor}px`,
                borderRadius: `${16 * scaleFactor}px`,
                boxShadow: "0 10px 30px rgba(255,255,255,0.1)",
              }}
            >
              App Store
            </div>
            <div
              style={{
                backgroundColor: "#18181b",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: `${16 * scaleFactor}px`,
                padding: `${16 * scaleFactor}px ${36 * scaleFactor}px`,
                borderRadius: `${16 * scaleFactor}px`,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Google Play
            </div>
          </div>
        </div>
      )}

      {/* FOREGROUND LAYER: Main Premium depth card */}
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: "1500px",
          pointerEvents: "none",
        }}
      >
        <div
          className="premium-depth-card"
          style={{
            position: "relative",
            width: `${cardWidthPct}%`,
            height: `${cardHeightPct}%`,
            borderRadius: `${cardRad}px`,
            transform: `translate3d(0, ${cardY}px, 0)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            transition: "width 0.05s linear, height 0.05s linear, border-radius 0.05s linear",
          }}
        >
          {/* Card sheen overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(800px circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 40%)",
              pointerEvents: "none",
              zIndex: 50,
            }}
          />

          <div
            style={{
              width: "100%",
              maxWidth: `${1200 * scaleFactor}px`,
              padding: `0 ${48 * scaleFactor}px`,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 10,
            }}
          >
            {/* Left Accountability text inside card */}
            <div
              style={{
                flex: 1,
                textAlign: "left",
                opacity: cardTextOpacity,
                transform: `translate3d(${lerp(-50 * scaleFactor, 0, clamp((progress - 0.5) / 0.15, 0, 1))}px, 0, 0)`,
              }}
            >
              <h3
                style={{
                  color: "#ffffff",
                  fontSize: `${36 * scaleFactor}px`,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: `${16 * scaleFactor}px`,
                }}
              >
                {cardHeading}
              </h3>
              <p
                style={{
                  color: "rgba(191, 219, 254, 0.75)",
                  fontSize: `${18 * scaleFactor}px`,
                  lineHeight: 1.6,
                  maxWidth: `${360 * scaleFactor}px`,
                  margin: 0,
                }}
              >
                {cardDescription}
              </p>
            </div>

            {/* Middle: iPhone Mockup */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: mockupOpacity,
                transform: `translate3d(0, ${mockupY}px, 0) scale(${mockupScale})`,
                perspective: "1000px",
              }}
            >
              {/* iPhone Bezel */}
              <div
                className="iphone-bezel"
                style={{
                  position: "relative",
                  width: `${280 * scaleFactor * 1.1}px`,
                  height: `${580 * scaleFactor * 1.1}px`,
                  borderRadius: `${48 * scaleFactor}px`,
                  display: "flex",
                  flexDirection: "column",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Physical buttons */}
                <div className="absolute hardware-btn" style={{ top: `${120 * scaleFactor}px`, left: "-3px", width: "3px", height: `${25 * scaleFactor}px`, borderRadius: "3px 0 0 3px" }} />
                <div className="absolute hardware-btn" style={{ top: `${160 * scaleFactor}px`, left: "-3px", width: "3px", height: `${45 * scaleFactor}px`, borderRadius: "3px 0 0 3px" }} />
                <div className="absolute hardware-btn" style={{ top: `${220 * scaleFactor}px`, left: "-3px", width: "3px", height: `${45 * scaleFactor}px`, borderRadius: "3px 0 0 3px" }} />
                <div className="absolute hardware-btn" style={{ top: `${170 * scaleFactor}px`, right: "-3px", width: "3px", height: `${70 * scaleFactor}px`, borderRadius: "0 3px 3px 0" }} />

                {/* Inner Screen */}
                <div
                  style={{
                    position: "absolute",
                    inset: `${8 * scaleFactor}px`,
                    backgroundColor: "#050914",
                    borderRadius: `${40 * scaleFactor}px`,
                    overflow: "hidden",
                    color: "#ffffff",
                    padding: `${48 * scaleFactor}px ${20 * scaleFactor}px`,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "inset 0 0 20px rgba(0,0,0,0.9)",
                  }}
                >
                  {/* Dynamic Island */}
                  <div
                    style={{
                      position: "absolute",
                      top: `${8 * scaleFactor}px`,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: `${100 * scaleFactor}px`,
                      height: `${28 * scaleFactor}px`,
                      backgroundColor: "#000000",
                      borderRadius: `${14 * scaleFactor}px`,
                    }}
                  />

                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: `${32 * scaleFactor}px` }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: `${9 * scaleFactor}px`, color: "#a3a3a3", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Today</span>
                      <span style={{ fontSize: `${20 * scaleFactor}px`, fontWeight: 700 }}>Journey</span>
                    </div>
                    <div style={{ width: `${36 * scaleFactor}px`, height: `${36 * scaleFactor}px`, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: `${12 * scaleFactor}px` }}>
                      JS
                    </div>
                  </div>

                  {/* Radial Ring */}
                  <div style={{ position: "relative", width: `${176 * scaleFactor}px`, height: `${176 * scaleFactor}px`, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: `${32 * scaleFactor}px` }}>
                    <svg
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <circle cx={`${88 * scaleFactor}`} cy={`${88 * scaleFactor}`} r={`${64 * scaleFactor}`} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={`${12 * scaleFactor}`} />
                      <circle
                        className="progress-ring"
                        cx={`${88 * scaleFactor}`}
                        cy={`${88 * scaleFactor}`}
                        r={`${64 * scaleFactor}`}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth={`${12 * scaleFactor}`}
                        strokeDashoffset={ringOffset * scaleFactor}
                      />
                    </svg>
                    <div style={{ textAlign: "center", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ fontSize: `${36 * scaleFactor}px`, fontWeight: 800 }}>{counterVal}</span>
                      <span style={{ fontSize: `${9 * scaleFactor}px`, color: "rgba(191,219,254,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{metricLabel}</span>
                    </div>
                  </div>

                  {/* Mock widgets inside device */}
                  <div style={{ display: "flex", flexDirection: "column", gap: `${12 * scaleFactor}px` }}>
                    <div style={{ padding: `${12 * scaleFactor}px`, borderRadius: `${16 * scaleFactor}px`, backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center" }}>
                      <div style={{ width: `${36 * scaleFactor}px`, height: `${36 * scaleFactor}px`, borderRadius: `${12 * scaleFactor}px`, backgroundColor: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: `${12 * scaleFactor}px`, border: "1px solid rgba(59,130,246,0.2)" }}>
                        🔥
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: `${8 * scaleFactor}px`, width: `${80 * scaleFactor}px`, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: `${4 * scaleFactor}px`, marginBottom: `${8 * scaleFactor}px` }} />
                        <div style={{ height: `${6 * scaleFactor}px`, width: `${48 * scaleFactor}px`, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: `${3 * scaleFactor}px` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <div
                className="floating-ui-badge"
                style={{
                  position: "absolute",
                  top: `${40 * scaleFactor}px`,
                  left: `${-60 * scaleFactor}px`,
                  padding: `${16 * scaleFactor}px`,
                  borderRadius: `${20 * scaleFactor}px`,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: `${16 * scaleFactor}px`,
                  opacity: badgeOpacity,
                  transform: `translate3d(0, ${badgeY}px, 0)`,
                  zIndex: 30,
                }}
              >
                <div style={{ width: `${40 * scaleFactor}px`, height: `${40 * scaleFactor}px`, borderRadius: "50%", backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  🔥
                </div>
                <div>
                  <p style={{ margin: 0, color: "#ffffff", fontSize: `${14 * scaleFactor}px`, fontWeight: 700 }}>Streak</p>
                  <p style={{ margin: 0, color: "rgba(191,219,254,0.5)", fontSize: `${11 * scaleFactor}px` }}>Milestone</p>
                </div>
              </div>

              <div
                className="floating-ui-badge"
                style={{
                  position: "absolute",
                  bottom: `${80 * scaleFactor}px`,
                  right: `${-60 * scaleFactor}px`,
                  padding: `${16 * scaleFactor}px`,
                  borderRadius: `${20 * scaleFactor}px`,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: `${16 * scaleFactor}px`,
                  opacity: badgeOpacity,
                  transform: `translate3d(0, ${badgeY}px, 0)`,
                  zIndex: 30,
                }}
              >
                <div style={{ width: `${40 * scaleFactor}px`, height: `${40 * scaleFactor}px`, borderRadius: "50%", backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  🤝
                </div>
                <div>
                  <p style={{ margin: 0, color: "#ffffff", fontSize: `${14 * scaleFactor}px`, fontWeight: 700 }}>Sponsor</p>
                  <p style={{ margin: 0, color: "rgba(191,219,254,0.5)", fontSize: `${11 * scaleFactor}px` }}>Update</p>
                </div>
              </div>
            </div>

            {/* Right: Brand Text inside card */}
            <div
              style={{
                flex: 1,
                textAlign: "right",
                opacity: cardTextOpacity,
                transform: `translate3d(${lerp(50 * scaleFactor, 0, clamp((progress - 0.5) / 0.15, 0, 1))}px, 0, 0) scale(${lerp(0.8, 1, clamp((progress - 0.5) / 0.15, 0, 1))})`,
              }}
            >
              <h2
                className="text-card-silver-matte"
                style={{
                  fontSize: `${110 * scaleFactor}px`,
                  fontWeight: 900,
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.0,
                }}
              >
                {brandName}
              </h2>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
