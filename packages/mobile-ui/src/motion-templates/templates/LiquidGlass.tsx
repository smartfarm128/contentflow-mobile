import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

// Linear interpolation helper
function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

export function LiquidGlassTemplate({ progress, time, width, values }: HtmlTemplateProps) {
  // Read customizable values
  const buttonText = values.buttonText !== undefined ? String(values.buttonText) : "How can i help you today?";
  const bgImageSrc = String(values.bgImageSrc ?? "https://images.unsplash.com/photo-1432251407527-504a6b4174a2?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");

  // Dynamic Dock Icons
  const dockIcons = useMemo(() => [
    {
      src: String(values.icon1 ?? "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/a13d1acfd046f503f987c1c95af582c8_low_res_Claude.png"),
      alt: "Claude",
    },
    {
      src: String(values.icon2 ?? "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/9e80c50a5802d3b0a7ec66f3fe4ce348_low_res_Finder.png"),
      alt: "Finder",
    },
    {
      src: String(values.icon3 ?? "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/c2c4a538c2d42a8dc0927d7d6530d125_low_res_ChatGPT___Liquid_Glass__Default_.png"),
      alt: "Chatgpt",
    },
    {
      src: String(values.icon4 ?? "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/6d26d432bd65c522b0708185c0768ec3_low_res_Maps.png"),
      alt: "Maps",
    },
    {
      src: String(values.icon5 ?? "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/7c59c945731aecf4f91eb8c2c5f867ce_low_res_Safari.png"),
      alt: "Safari",
    },
    {
      src: String(values.icon6 ?? "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/b7f24edc7183f63dbe34c1943bef2967_low_res_Steam___Liquid_Glass__Default_.png"),
      alt: "Steam",
    },
  ], [values]);

  const scale = width / 1920;

  // 1. Background Scroll: scrolls backgroundPosition y from 0% to -20% over timeline progress
  const bgPositionY = `${-20 * progress}%`;

  // 2. Dock Entrance Animation: fades in and slides up from bottom over progress 0.0 to 0.4
  const dockEntranceProgress = Math.max(0, Math.min(1, progress / 0.4));
  const dockEntranceEase = 1 - Math.pow(1 - dockEntranceProgress, 3);
  const dockOpacity = dockEntranceProgress;
  const dockY = (1 - dockEntranceEase) * 80 * scale;

  // 3. Button Entrance Animation: fades in and slides up from bottom over progress 0.1 to 0.5
  const buttonEntranceProgress = Math.max(0, Math.min(1, (progress - 0.1) / 0.4));
  const buttonEntranceEase = 1 - Math.pow(1 - buttonEntranceProgress, 3);
  const buttonOpacity = buttonEntranceProgress;
  const buttonY = (1 - buttonEntranceEase) * 80 * scale;

  // 4. Sequential Dock Zoom Animation: cycles zoom (hover) over progress 0.4 to 0.75
  const getIconScale = (index: number) => {
    const totalIcons = dockIcons.length;
    const windowStart = 0.4;
    const windowEnd = 0.75;
    const totalWindow = windowEnd - windowStart;
    const durationPerIcon = totalWindow / totalIcons;

    const start = windowStart + index * durationPerIcon;
    const end = start + durationPerIcon;

    if (progress >= start && progress < end) {
      const t = (progress - start) / durationPerIcon;
      // Zoom factor oscillates up to 1.15 in a smooth sine wave
      return 1 + 0.15 * Math.sin(t * Math.PI);
    }
    return 1.0;
  };

  // 5. Button click simulation (scale down to 0.92): progress 0.78 to 0.86
  let buttonClickScale = 1.0;
  if (progress >= 0.78 && progress <= 0.86) {
    const t = (progress - 0.78) / 0.08;
    buttonClickScale = lerp(1.0, 0.92, Math.sin(t * Math.PI));
  }

  // Ambient floating animation using time
  const floatY = Math.sin(time * 1.5) * 5 * scale;

  // Dimensions
  const iconSize = Math.round(64 * scale);
  const dockPadding = Math.round(12 * scale);
  const dockGap = Math.round(8 * scale);
  const fontSize = Math.max(12, Math.round(20 * scale));
  const buttonPaddingX = Math.round(40 * scale);
  const buttonPaddingY = Math.round(24 * scale);
  const centerGap = Math.round(24 * scale);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${bgImageSrc})`,
        backgroundSize: "cover",
        backgroundPosition: `center ${bgPositionY}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        userSelect: "none",
      }}
    >
      {/* SVG glass distortion filter */}
      <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <filter
            id="glass-distortion-template-filter"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.001 0.005"
              numOctaves="1"
              seed="17"
              result="turbulence"
            />
            <feComponentTransfer in="turbulence" result="mapped">
              <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
              <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
              <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
            </feComponentTransfer>
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            <feSpecularLighting
              in="softMap"
              surfaceScale="5"
              specularConstant="1"
              specularExponent="100"
              lightingColor="white"
              result="specLight"
            >
              <fePointLight x="-200" y="-200" z="300" />
            </feSpecularLighting>
            <feComposite
              in="specLight"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="litImage"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softMap"
              scale="200"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: `${centerGap}px`,
        }}
      >
        {/* macOS Dock Component */}
        <div
          style={{
            position: "relative",
            opacity: dockOpacity,
            transform: `translateY(${dockY + floatY}px)`,
            display: "inline-flex",
            borderRadius: `${24 * scale}px`,
            padding: `${dockPadding}px`,
            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.25), 0 0 40px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          {/* Glass layers */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              filter: 'url("#glass-distortion-template-filter")',
              isolation: "isolate",
              borderRadius: `${24 * scale}px`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              background: "rgba(255, 255, 255, 0.25)",
              borderRadius: `${24 * scale}px`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              boxShadow: "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)",
              borderRadius: `${24 * scale}px`,
            }}
          />

          {/* Icons container */}
          <div
            style={{
              position: "relative",
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: `${dockGap}px`,
            }}
          >
            {dockIcons.map((icon, idx) => {
              const iconScale = getIconScale(idx);
              return (
                <img
                  key={idx}
                  src={icon.src}
                  alt={icon.alt}
                  style={{
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                    transform: `scale(${iconScale})`,
                    transformOrigin: "center center",
                    transition: "transform 100ms ease",
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* macOS Glass Button Component */}
        <div
          style={{
            position: "relative",
            opacity: buttonOpacity,
            transform: `translateY(${buttonY + floatY * 0.8}px) scale(${buttonClickScale})`,
            display: "inline-flex",
            borderRadius: `${24 * scale}px`,
            padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.25), 0 0 40px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
            cursor: "pointer",
            transition: "transform 100ms ease",
          }}
        >
          {/* Glass layers */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              filter: 'url("#glass-distortion-template-filter")',
              isolation: "isolate",
              borderRadius: `${24 * scale}px`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              background: "rgba(255, 255, 255, 0.25)",
              borderRadius: `${24 * scale}px`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              boxShadow: "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)",
              borderRadius: `${24 * scale}px`,
            }}
          />

          {/* Button Text */}
          <div
            style={{
              position: "relative",
              zIndex: 30,
              fontSize: `${fontSize}px`,
              color: "#ffffff",
              fontWeight: 300,
            }}
          >
            {buttonText}
          </div>
        </div>
      </div>
    </div>
  );
}
