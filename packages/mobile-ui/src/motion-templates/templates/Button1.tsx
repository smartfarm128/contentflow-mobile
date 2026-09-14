import type { HtmlTemplateProps } from "../types";
import { Star } from "lucide-react";

const COLORS = {
  color1: '#FFFFFF',
  color2: '#1E10C5',
  color3: '#9089E2',
  color4: '#FCFCFE',
  color5: '#F9F9FD',
  color6: '#B2B8E7',
  color7: '#0E2DCB',
  color8: '#0017E9',
  color9: '#4743EF',
  color10: '#7D7BF4',
  color11: '#0B06FC',
  color12: '#C5C1EA',
  color13: '#1403DE',
  color14: '#B6BAF6',
  color15: '#C1BEEB',
  color16: '#290ECB',
  color17: '#3F4CC0',
};

const states = [
  { tx: 287.5, ty: 280, r: -29.0546, sx: 689.807, sy: 1000 }, // svg1
  { tx: 126.5, ty: 418.5, r: -64.756, sx: 533.444, sy: 773.324 }, // svg2
  { tx: 264.5, ty: 339.5, r: -42.3022, sx: 946.451, sy: 1372.05 }, // svg3
  { tx: 860.5, ty: 420, r: -153.984, sx: 957.528, sy: 1388.11 }, // svg4
  { tx: 264.5, ty: 339.5, r: -42.3022, sx: 946.451, sy: 1372.05 }, // svg3
  { tx: 126.5, ty: 418.5, r: -64.756, sx: 533.444, sy: 773.324 }, // svg2
  { tx: 287.5, ty: 280, r: -29.0546, sx: 689.807, sy: 1000 }, // svg1
];

export function Button1Template({ time, width, height, values }: HtmlTemplateProps) {
  const label = String(values.label ?? "Github");
  const cycleDuration = Number(values.cycleDuration ?? 10.0);
  const backgroundColor = String(values.backgroundColor ?? "#09090b");

  // Interpolate state parameters for playhead determinism
  const t = time % cycleDuration;
  const segment = (t / cycleDuration) * 6;
  const idx1 = Math.floor(segment) % 7;
  const idx2 = (idx1 + 1) % 7;
  const f = segment - Math.floor(segment);

  const tx = states[idx1].tx + (states[idx2].tx - states[idx1].tx) * f;
  const ty = states[idx1].ty + (states[idx2].ty - states[idx1].ty) * f;
  const r = states[idx1].r + (states[idx2].r - states[idx1].r) * f;
  const sx = states[idx1].sx + (states[idx2].sx - states[idx1].sx) * f;
  const sy = states[idx1].sy + (states[idx2].sy - states[idx1].sy) * f;

  const gradientTransform = `translate(${tx} ${ty}) rotate(${r}) scale(${sx} ${sy})`;

  const compositionHeight = 250;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div 
        style={{ 
          position: "relative",
          width: `${300 * scaleFactor}px`,
          height: `${80 * scaleFactor}px`,
        }}
      >
        {/* Glow Shadow backing */}
        <div 
          style={{
            position: "absolute",
            width: "112.81%",
            height: "128.57%",
            top: "8.57%",
            left: "50%",
            transform: "translateX(-50%)",
            filter: "blur(19px)",
            opacity: 0.7,
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "12px" }}>
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  inset: 0,
                  mixBlendMode: "difference",
                  transform: `rotate(${index * 50}deg)`,
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 1030 280" fill="none">
                  <rect width="1030" height="280" rx="140" fill={`url(#paintShadow_${index})`} />
                  <defs>
                    <radialGradient
                      id={`paintShadow_${index}`}
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform={gradientTransform}
                    >
                      {states[idx1].sx > 0 && (
                        <>
                          <stop offset="0" stopColor={COLORS.color1} />
                          <stop offset="0.188" stopColor={COLORS.color2} />
                          <stop offset="0.328" stopColor={COLORS.color4} />
                          <stop offset="0.442" stopColor={COLORS.color6} />
                          <stop offset="0.631" stopColor={COLORS.color1} />
                          <stop offset="0.843" stopColor={COLORS.color10} />
                          <stop offset="1" stopColor={COLORS.color11} />
                        </>
                      )}
                    </radialGradient>
                  </defs>
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Button Wrapper */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: `${12 * scaleFactor}px`,
            border: "2px solid #ffffff",
            backgroundColor: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
          }}
        >
          {/* Animated liquid background layers */}
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                inset: 0,
                mixBlendMode: index === 6 ? "hard-light" : "difference",
                transform: `rotate(${index * 50}deg)`,
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 1030 280" fill="none">
                <rect width="1030" height="280" rx="140" fill={`url(#paint_${index})`} />
                <defs>
                  <radialGradient
                    id={`paint_${index}`}
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform={gradientTransform}
                  >
                    <stop offset="0" stopColor={COLORS.color1} />
                    <stop offset="0.188" stopColor={COLORS.color2} />
                    <stop offset="0.328" stopColor={COLORS.color4} />
                    <stop offset="0.442" stopColor={COLORS.color6} />
                    <stop offset="0.631" stopColor={COLORS.color1} />
                    <stop offset="0.843" stopColor={COLORS.color10} />
                    <stop offset="1" stopColor={COLORS.color11} />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          ))}

          {/* Button Text & Icon overlay */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: `${10 * scaleFactor}px`,
              color: "#ffffff",
              fontWeight: 700,
              fontSize: `${18 * scaleFactor}px`,
              letterSpacing: "0.05em"
            }}
          >
            <Star className="fill-white" style={{ width: `${20 * scaleFactor}px`, height: `${20 * scaleFactor}px` }} />
            <span>{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
