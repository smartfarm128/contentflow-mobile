import { useId } from "react";
import type { HtmlTemplateProps } from "../types";

export function AwardBadgeTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const reactId = useId();
  const cleanId = reactId.replace(/:/g, "");
  const badgeMaskId = `badge-mask-${cleanId}`;
  const blurId = `badge-blur-${cleanId}`;

  // Read control values
  const headerText = String(values.headerText ?? "PRODUCT HUNT");
  const type = String(values.type ?? "golden-kitty");
  const place = Number(values.place ?? 1);
  const link = String(values.link ?? "https://www.producthunt.com");
  const animateTilt = values.animateTilt !== false;
  const glowRotationSpeed = Number(values.glowRotationSpeed ?? 15);
  const glowOpacity = Number(values.glowOpacity ?? 0.5);
  const baseBadgeSize = Number(values.badgeSize ?? 400);

  // Background color based on place
  const backgroundColor = ["#f3e3ac", "#ddd", "#f1cfa6"];
  const badgeBgColor = backgroundColor[(place || 2) - 1] || backgroundColor[1];

  const titles: Record<string, string> = {
    "golden-kitty": "Golden Kitty Awards",
    "product-of-the-day": "Product of the Day",
    "product-of-the-month": "Product of the Month",
    "product-of-the-week": "Product of the Week",
  };
  const titleText = titles[type] ?? "Golden Kitty Awards";

  // Dynamic sizing based on template viewport
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  const resolvedWidth = baseBadgeSize * scaleFactor;
  const resolvedHeight = resolvedWidth * (54 / 260);

  // Wobble matrix/tilt variables
  const rotX = animateTilt ? Math.sin(time * 2.0) * 8 : Number(values.tiltX ?? 0);
  const rotY = animateTilt ? Math.cos(time * 1.5) * 8 : Number(values.tiltY ?? 0);
  const cardScale = animateTilt ? 1.0 - 0.015 * (1.0 + Math.sin(time * 3.0)) : 1.0;

  const transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${cardScale})`;

  // Rainbow overlays: 10 layers with deterministic rotation driven by playhead time
  const angleOffset = 5 * (1 - Math.cos((2 * Math.PI * time) / 5));
  const baseAngle = time * glowRotationSpeed;

  const layers = [
    { fill: "hsl(358, 100%, 62%)" },
    { fill: "hsl(30, 100%, 50%)" },
    { fill: "hsl(60, 100%, 50%)" },
    { fill: "hsl(96, 100%, 50%)" },
    { fill: "hsl(233, 85%, 47%)" },
    { fill: "hsl(271, 85%, 47%)" },
    { fill: "hsl(300, 20%, 35%)" },
    { fill: "transparent" },
    { fill: "transparent" },
    { fill: "white" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        backgroundImage: "radial-gradient(circle at center, #0e0e11 0%, #030304 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          textDecoration: "none",
          cursor: "pointer",
          width: `${resolvedWidth}px`,
          height: `${resolvedHeight}px`,
          transform: transform,
          transformOrigin: "center center",
          transition: "transform 100ms ease-out",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 260 54"
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <defs>
            <filter id={blurId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <mask id={badgeMaskId}>
              <rect width="260" height="54" fill="white" rx="10" />
            </mask>
          </defs>

          {/* Badge Background */}
          <rect width="260" height="54" rx="10" fill={badgeBgColor} />
          <rect x="4" y="4" width="252" height="46" rx="8" fill="transparent" stroke="#bbb" strokeWidth="1" />

          {/* Texts */}
          <text fontFamily="Helvetica-Bold, Helvetica, sans-serif" fontSize="9" fontWeight="bold" fill="#666" x="53" y="20">
            {headerText}
          </text>
          <text fontFamily="Helvetica-Bold, Helvetica, sans-serif" fontSize="16" fontWeight="bold" fill="#666" x="52" y="40">
            {titleText}{place && ` #${place}`}
          </text>

          {/* Left Leaf Logo */}
          <g transform="translate(8, 9)">
            <path fill="#666"
                  d="M14.963 9.075c.787-3-.188-5.887-.188-5.887S12.488 5.175 11.7 8.175c-.787 3 .188 5.887.188 5.887s2.25-1.987 3.075-4.987m-4.5 1.987c.787 3-.188 5.888-.188 5.888S7.988 14.962 7.2 11.962c-.787-3 .188-5.887.188-5.887s2.287 1.987 3.075 4.987m.862 10.388s-.6-2.962-2.775-5.175C6.337 14.1 3.375 13.5 3.375 13.5s.6 2.962 2.775 5.175c2.213 2.175 5.175 2.775 5.175 2.775m3.3 3.413s-1.988-2.288-4.988-3.075-5.887.187-5.887.187 1.987 2.287 4.988 3.075c3 .787 5.887-.188 5.887-.188Zm6.75 0s1.988-2.288 4.988-3.075c3-.826 5.887.187 5.887.187s-1.988 2.287-4.988 3.075c-3 .787-5.887-.188-5.887-.188ZM32.625 13.5s-2.963.6-5.175 2.775c-2.213 2.213-2.775 5.175-2.775 5.175s2.962-.6 5.175-2.775c2.175-2.213 2.775-5.175 2.775-5.175M28.65 6.075s.975 2.887.188 5.887c-.826 3-3.076 4.988-3.076 4.988s-.974-2.888-.187-5.888c.788-3 3.075-4.987 3.075-4.987m-4.5 7.987s.975-2.887.188-5.887c-.788-3-3.076-4.988-3.076-4.988s-.974 2.888-.187 5.888c.788 3 3.075 4.988 3.075 4.988ZM18 26.1c.975-.225 3.113-.6 5.325 0 3 .788 5.063 3.038 5.063 3.038s-2.888.975-5.888.187a13 13 0 0 1-1.425-.525c.563.788 1.125 1.425 2.288 1.913l-.863 2.062c-2.063-.862-2.925-2.137-3.675-3.262-.262-.375-.525-.713-.787-1.05-.26.293-.465.586-.686.903l-.102.147-.048.068c-.775 1.108-1.643 2.35-3.627 3.194l-.862-2.062c1.162-.488 1.725-1.125 2.287-1.913-.45.225-.938.375-1.425.525-3 .788-5.887-.187-5.887-.187s1.987-2.288 4.987-3.075c2.212-.563 4.35-.188 5.325.037" />
          </g>

          {/* Holographic Glowing Rainbow Overlay */}
          <g style={{ mixBlendMode: "overlay" }} mask={`url(#${badgeMaskId})`}>
            {layers.map((layer, idx) => {
              const rotationAngle = baseAngle + idx * 10 + angleOffset;
              return (
                <g
                  key={idx}
                  style={{
                    transform: `rotate(${rotationAngle}deg)`,
                    transformOrigin: "center center",
                    willChange: "transform",
                  }}
                >
                  <polygon
                    points="0,0 260,54 260,0 0,54"
                    fill={layer.fill}
                    filter={`url(#${blurId})`}
                    opacity={glowOpacity}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </a>
    </div>
  );
}
