import type { HtmlTemplateProps } from "../types";

// Linear interpolation helper
function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

type ColorVariant =
  | "default"
  | "primary"
  | "success"
  | "error"
  | "gold"
  | "bronze";

const colorVariants: Record<
  ColorVariant,
  {
    outerGradient: string;
    innerGradient: string;
    buttonGradient: string;
    textColor: string;
    textShadow: string;
  }
> = {
  default: {
    outerGradient: "linear-gradient(to bottom, #000, #A0A0A0)",
    innerGradient: "linear-gradient(to bottom, #FAFAFA, #3E3E3E, #E5E5E5)",
    buttonGradient: "linear-gradient(to bottom, #B9B9B9, #969696)",
    textColor: "#ffffff",
    textShadow: "0 -1px 0 rgb(80 80 80)",
  },
  primary: {
    outerGradient: "linear-gradient(to bottom, #000, #A0A0A0)",
    innerGradient: "linear-gradient(to bottom, #3b82f6, #1d4ed8, #1e293b)", // primary blue gradient
    buttonGradient: "linear-gradient(to bottom, #3b82f6, rgba(59, 130, 246, 0.4))",
    textColor: "#ffffff",
    textShadow: "0 -1px 0 rgb(30 58 138)",
  },
  success: {
    outerGradient: "linear-gradient(to bottom, #005A43, #7CCB9B)",
    innerGradient: "linear-gradient(to bottom, #E5F8F0, #00352F, #D1F0E6)",
    buttonGradient: "linear-gradient(to bottom, #9ADBC8, #3E8F7C)",
    textColor: "#FFF7F0",
    textShadow: "0 -1px 0 rgb(6 78 59)",
  },
  error: {
    outerGradient: "linear-gradient(to bottom, #5A0000, #FFAEB0)",
    innerGradient: "linear-gradient(to bottom, #FFDEDE, #680002, #FFE9E9)",
    buttonGradient: "linear-gradient(to bottom, #F08D8F, #A45253)",
    textColor: "#FFF7F0",
    textShadow: "0 -1px 0 rgb(146 64 14)",
  },
  gold: {
    outerGradient: "linear-gradient(to bottom, #917100, #EAD98F)",
    innerGradient: "linear-gradient(to bottom, #FFFDDD, #856807, #FFF1B3)",
    buttonGradient: "linear-gradient(to bottom, #FFEBA1, #9B873F)",
    textColor: "#FFFDE5",
    textShadow: "0 -1px 0 rgb(178 140 2)",
  },
  bronze: {
    outerGradient: "linear-gradient(to bottom, #864813, #E9B486)",
    innerGradient: "linear-gradient(to bottom, #EDC5A1, #5F2D01, #FFDEC1)",
    buttonGradient: "linear-gradient(to bottom, #FFE3C9, #A36F3D)",
    textColor: "#FFF7F0",
    textShadow: "0 -1px 0 rgb(124 45_18)",
  },
};

export function LiquidGlassButtonTemplate({ progress, time, width, values }: HtmlTemplateProps) {
  // Read customized template values
  const label1 = values.label1 !== undefined ? String(values.label1) : "Liquid Glass";
  const label2 = values.label2 !== undefined ? String(values.label2) : "Metal Button";
  const metalVariant = (values.metalVariant ?? "default") as ColorVariant;
  const textColorOverride = String(values.textColor ?? "#ffffff");

  const scale = width / 1920;

  // Ambient floating animation driven by time
  const floatY = Math.sin(time * 1.8) * 4 * scale;

  // ─── 1. Liquid Button Animations ───
  // Entrance: fades in and slides up from progress 0.0 to 0.35
  const liquidEntranceProgress = Math.max(0, Math.min(1, progress / 0.35));
  const liquidEntranceEase = 1 - Math.pow(1 - liquidEntranceProgress, 3);
  const liquidOpacity = liquidEntranceProgress;
  const liquidEntranceY = (1 - liquidEntranceEase) * 40 * scale;

  // Interactive click simulation scale logic:
  // - progress 0.0 -> 0.35: scale is 1.0
  // - progress 0.35 -> 0.48: scale grows to 1.05 (hover)
  // - progress 0.48 -> 0.56: scale drops to 0.95 (click)
  // - progress 0.56 -> 0.65: scale returns to 1.0 (release)
  let liquidScale = 1.0;
  if (progress >= 0.35 && progress < 0.48) {
    const t = (progress - 0.35) / 0.13;
    liquidScale = lerp(1.0, 1.05, t);
  } else if (progress >= 0.48 && progress < 0.56) {
    const t = (progress - 0.48) / 0.08;
    liquidScale = lerp(1.05, 0.95, t);
  } else if (progress >= 0.56 && progress < 0.65) {
    const t = (progress - 0.56) / 0.09;
    liquidScale = lerp(0.95, 1.0, t);
  }

  // ─── 2. Metal Button Animations ───
  // Entrance: fades in and slides up from progress 0.15 to 0.50
  const metalEntranceProgress = Math.max(0, Math.min(1, (progress - 0.15) / 0.35));
  const metalEntranceEase = 1 - Math.pow(1 - metalEntranceProgress, 3);
  const metalOpacity = metalEntranceProgress;
  const metalEntranceY = (1 - metalEntranceEase) * 40 * scale;

  // Interactive hover & press states:
  // - Hover: progress 0.60 to 0.70 & 0.80 to 0.90
  // - Pressed: progress 0.70 to 0.80
  let metalIsPressed = false;
  let metalIsHovered = false;
  let metalScale = 1.0;
  let metalYClickOffset = 0;

  if (progress >= 0.60 && progress < 0.70) {
    metalIsHovered = true;
  } else if (progress >= 0.70 && progress <= 0.80) {
    metalIsPressed = true;
    metalIsHovered = true;
    const t = Math.sin(((progress - 0.70) / 0.10) * Math.PI); // sine-based click curve
    metalYClickOffset = 2.5 * scale * t;
    metalScale = lerp(1.0, 0.98, t);
  } else if (progress > 0.80 && progress <= 0.90) {
    metalIsHovered = true;
  }

  const colors = colorVariants[metalVariant] || colorVariants.default;

  // Sizing configurations
  const fontSize = Math.max(12, Math.round(18 * scale));
  const paddingX = Math.round(32 * scale);
  const paddingY = Math.round(16 * scale);
  const buttonHeight = Math.round(56 * scale);
  const buttonGap = Math.round(80 * scale);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b", // zinc-950 dark background
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${buttonGap}px`,
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        userSelect: "none",
      }}
    >
      {/* ─── Liquid Glass Button ─── */}
      <div
        style={{
          position: "relative",
          opacity: liquidOpacity,
          transform: `translateY(${liquidEntranceY + floatY}px) scale(${liquidScale})`,
          transition: "transform 0.1s ease",
          zIndex: 10,
        }}
      >
        <button
          style={{
            position: "relative",
            height: `${buttonHeight}px`,
            padding: `${paddingY}px ${paddingX}px`,
            border: "none",
            background: "transparent",
            color: textColorOverride,
            fontSize: `${fontSize}px`,
            fontWeight: 500,
            cursor: "pointer",
            outline: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Glass shadows */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "9999px",
              boxShadow: "0 0 6px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 1px -3px rgba(0,0,0,0.9), inset -3px -3px 1px -3px rgba(0,0,0,0.85), inset 1px 1px 1px -0.5px rgba(0,0,0,0.6), inset -1px -1px 1px -0.5px rgba(0,0,0,0.6), inset 0 0 6px 6px rgba(0,0,0,0.12), inset 0 0 2px 2px rgba(0,0,0,0.06), 0 0 12px rgba(255,255,255,0.15)",
              pointerEvents: "none",
            }}
          />
          {/* SVG filter backdrop mapping */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "8px",
              backdropFilter: 'url("#container-glass-template")',
              WebkitBackdropFilter: 'url("#container-glass-template")',
              zIndex: -1,
            }}
          />
          <span style={{ position: "relative", zIndex: 10 }}>{label1}</span>
        </button>
      </div>

      {/* ─── Metal Button ─── */}
      <div
        style={{
          position: "relative",
          opacity: metalOpacity,
          transform: `translateY(${metalEntranceY + metalYClickOffset + floatY * 0.8}px) scale(${metalScale})`,
          background: colors.outerGradient,
          borderRadius: "8px",
          padding: "1.5px",
          boxShadow: metalIsPressed
            ? "0 1px 2px rgba(0, 0, 0, 0.15)"
            : metalIsHovered
              ? "0 6px 16px rgba(0, 0, 0, 0.15)"
              : "0 3px 8px rgba(0, 0, 0, 0.08)",
          transition: "box-shadow 250ms ease, transform 100ms ease",
          zIndex: 10,
        }}
      >
        {/* Inner gradient */}
        <div
          style={{
            position: "absolute",
            inset: "1px",
            background: colors.innerGradient,
            borderRadius: "7px",
            filter: metalIsHovered && !metalIsPressed ? "brightness(1.05)" : "none",
            transition: "filter 250ms ease",
          }}
        />

        <button
          style={{
            position: "relative",
            zIndex: 10,
            margin: "1px",
            borderRadius: "6px",
            height: `${buttonHeight - 4}px`,
            padding: `${paddingY - 2}px ${paddingX}px`,
            background: colors.buttonGradient,
            color: colors.textColor,
            textShadow: colors.textShadow,
            fontSize: `${fontSize}px`,
            fontWeight: 600,
            border: "none",
            outline: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            filter: metalIsHovered && !metalIsPressed ? "brightness(1.02)" : "none",
            transition: "filter 250ms ease",
            overflow: "hidden",
          }}
        >
          {/* Shine effect overlay when pressed */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15), transparent)",
              opacity: metalIsPressed ? 1 : 0,
              transition: "opacity 300ms ease",
              pointerEvents: "none",
            }}
          />
          {label2}
          
          {/* Hover highlight overlay */}
          {metalIsHovered && !metalIsPressed && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, transparent, rgba(255,255,255,0.06))",
                borderRadius: "6px",
                pointerEvents: "none",
              }}
            />
          )}
        </button>
      </div>

      {/* SVG filter definition for glass rendering */}
      <svg
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter
            id="container-glass-template"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05 0.05"
              numOctaves="1"
              seed="1"
              result="turbulence"
            />
            <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurredNoise"
              scale="70"
              xChannelSelector="R"
              yChannelSelector="B"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
            <feComposite in="finalBlur" in2="finalBlur" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
