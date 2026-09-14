import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

// Easing cubic-bezier solver
function solveCubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
  if (t === 0 || t === 1) return t;
  let x = t;
  for (let i = 0; i < 8; i++) {
    const currentX = 3 * Math.pow(1 - x, 2) * x * x1 + 3 * (1 - x) * x * x * x2 + x * x * x - t;
    if (Math.abs(currentX) < 1e-5) break;
    const derivative = 3 * Math.pow(1 - x, 2) * x1 + 6 * (1 - x) * x * (x2 - x1) + 3 * x * x * (1 - x2);
    x -= currentX / (derivative || 1);
  }
  return 3 * Math.pow(1 - x, 2) * x * y1 + 3 * (1 - x) * x * x * y2 + x * x * x;
}

interface Point {
  x: number;
  y: number;
}

function getQuadPoint(t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): Point {
  const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2;
  const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
  return { x, y };
}

// 8 Piecewise Path Evaluators mirroring the CSS motion path vectors:
// 1. M 10 20 h 79.5 q 5 0 5 5 v 30
function getPath1Point(p: number): Point {
  const l1 = 79.5, l2 = 7.0, l3 = 30.0;
  const tot = l1 + l2 + l3;
  const d = p * tot;
  if (d <= l1) return { x: 10 + d, y: 20 };
  if (d <= l1 + l2) return getQuadPoint((d - l1) / l2, 89.5, 20, 94.5, 20, 94.5, 25);
  return { x: 94.5, y: 25 + ((d - l1 - l2) / l3) * 30 };
}

// 2. M 180 10 h -69.7 q -5 0 -5 5 v 40
function getPath2Point(p: number): Point {
  const l1 = 69.7, l2 = 7.0, l3 = 40.0;
  const tot = l1 + l2 + l3;
  const d = p * tot;
  if (d <= l1) return { x: 180 - d, y: 10 };
  if (d <= l1 + l2) return getQuadPoint((d - l1) / l2, 110.3, 10, 105.3, 10, 105.3, 15);
  return { x: 105.3, y: 15 + ((d - l1 - l2) / l3) * 40 };
}

// 3. M 130 20 v 21.8 q 0 5 -5 5 h -25
function getPath3Point(p: number): Point {
  const l1 = 21.8, l2 = 7.0, l3 = 25.0;
  const tot = l1 + l2 + l3;
  const d = p * tot;
  if (d <= l1) return { x: 130, y: 20 + d };
  if (d <= l1 + l2) return getQuadPoint((d - l1) / l2, 130, 41.8, 130, 46.8, 125, 46.8);
  return { x: 125 - ((d - l1 - l2) / l3) * 25, y: 46.8 };
}

// 4. M 170 80 v -21.8 q 0 -5 -5 -5 h -65
function getPath4Point(p: number): Point {
  const l1 = 21.8, l2 = 7.0, l3 = 65.0;
  const tot = l1 + l2 + l3;
  const d = p * tot;
  if (d <= l1) return { x: 170, y: 80 - d };
  if (d <= l1 + l2) return getQuadPoint((d - l1) / l2, 170, 58.2, 170, 53.2, 165, 53.2);
  return { x: 165 - ((d - l1 - l2) / l3) * 65, y: 53.2 };
}

// 5. M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -35
function getPath5Point(p: number): Point {
  const l1 = 15.0, l2 = 7.0, l3 = 10.0, l4 = 7.0, l5 = 39.8, l6 = 7.0, l7 = 35.0;
  const tot = l1 + l2 + l3 + l4 + l5 + l6 + l7;
  const d = p * tot;
  if (d <= l1) return { x: 135 + d, y: 65 };
  if (d <= l1 + l2) return getQuadPoint((d - l1) / l2, 150, 65, 155, 65, 155, 70);
  if (d <= l1 + l2 + l3) return { x: 155, y: 70 + (d - l1 - l2) };
  if (d <= l1 + l2 + l3 + l4) return getQuadPoint((d - l1 - l2 - l3) / l4, 155, 80, 155, 85, 150, 85);
  if (d <= l1 + l2 + l3 + l4 + l5) return { x: 150 - (d - l1 - l2 - l3 - l4), y: 85 };
  if (d <= l1 + l2 + l3 + l4 + l5 + l6) {
    return getQuadPoint((d - l1 - l2 - l3 - l4 - l5) / l6, 110.2, 85, 105.2, 85, 105.2, 80);
  }
  return { x: 105.2, y: 80 - ((d - l1 - l2 - l3 - l4 - l5 - l6) / l7) * 35 };
}

// 6. M 94.8 95 v -46
function getPath6Point(p: number): Point {
  const l1 = 46.0;
  return { x: 94.8, y: 95 - p * l1 };
}

// 7. M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 28
function getPath7Point(p: number): Point {
  const l1 = 15.0, l2 = 7.0, l3 = 10.0, l4 = 7.0, l5 = 5.0, l6 = 7.0, l7 = 28.0;
  const tot = l1 + l2 + l3 + l4 + l5 + l6 + l7;
  const d = p * tot;
  if (d <= l1) return { x: 88, y: 88 - d };
  if (d <= l1 + l2) return getQuadPoint((d - l1) / l2, 88, 73, 88, 68, 83, 68);
  if (d <= l1 + l2 + l3) return { x: 83 - (d - l1 - l2), y: 68 };
  if (d <= l1 + l2 + l3 + l4) return getQuadPoint((d - l1 - l2 - l3) / l4, 73, 68, 68, 68, 68, 63);
  if (d <= l1 + l2 + l3 + l4 + l5) return { x: 68, y: 63 - (d - l1 - l2 - l3 - l4) };
  if (d <= l1 + l2 + l3 + l4 + l5 + l6) {
    return getQuadPoint((d - l1 - l2 - l3 - l4 - l5) / l6, 68, 58, 68, 53, 73, 53);
  }
  return { x: 73 + ((d - l1 - l2 - l3 - l4 - l5 - l6) / l7) * 28, y: 53 };
}

// 8. M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 35
function getPath8Point(p: number): Point {
  const l1 = 25.0, l2 = 7.0, l3 = 6.5, l4 = 7.0, l5 = 35.0;
  const tot = l1 + l2 + l3 + l4 + l5;
  const d = p * tot;
  if (d <= l1) return { x: 30 + d, y: 30 };
  if (d <= l1 + l2) return getQuadPoint((d - l1) / l2, 55, 30, 60, 30, 60, 35);
  if (d <= l1 + l2 + l3) return { x: 60, y: 35 + (d - l1 - l2) };
  if (d <= l1 + l2 + l3 + l4) return getQuadPoint((d - l1 - l2 - l3) / l4, 60, 41.5, 60, 46.5, 65, 46.5);
  return { x: 65 + ((d - l1 - l2 - l3 - l4) / l5) * 35, y: 46.5 };
}

export function CpuArchitectureTemplate({ time, width, values }: HtmlTemplateProps) {
  // Read customized parameters
  const text = String(values.text ?? "CPU");
  const textColor = String(values.textColor ?? "#ffffff");
  const accentColor = String(values.accentColor ?? "#00e8ed");
  const showCpuConnections = !!(values.showCpuConnections ?? true);
  const lineMarkerSize = Number(values.lineMarkerSize ?? 18);
  const animateText = !!(values.animateText ?? true);

  const scaleFactor = width / 200; // grid size is 200x100

  // Line properties configurations: { duration, delay }
  const lineConfigs = useMemo(() => [
    { duration: 5, delay: 1 },
    { duration: 2, delay: 6 },
    { duration: 6, delay: 4 },
    { duration: 3, delay: 3 },
    { duration: 4, delay: 9 },
    { duration: 7, delay: 3 },
    { duration: 4, delay: 4 },
    { duration: 3, delay: 3 },
  ], []);

  // Compute position of all 8 light particles deterministically based on time
  const points = useMemo(() => {
    return lineConfigs.map((cfg, idx) => {
      const t = time - cfg.delay;
      if (t < 0) return { x: 0, y: 0, active: false };
      const tInCycle = t % cfg.duration;
      const pInCycle = tInCycle / cfg.duration;
      // Apply the cubic-bezier(0.75, -0.01, 0, 0.99) easing curve
      const easedP = solveCubicBezier(pInCycle, 0.75, -0.01, 0.0, 0.99);

      let pt: Point;
      switch (idx) {
        case 0: pt = getPath1Point(easedP); break;
        case 1: pt = getPath2Point(easedP); break;
        case 2: pt = getPath3Point(easedP); break;
        case 3: pt = getPath4Point(easedP); break;
        case 4: pt = getPath5Point(easedP); break;
        case 5: pt = getPath6Point(easedP); break;
        case 6: pt = getPath7Point(easedP); break;
        default: pt = getPath8Point(easedP); break;
      }
      return { ...pt, active: true };
    });
  }, [time, lineConfigs]);

  // CPU Connection Rectangles list
  const cpuConnections = [
    { x: 93, y: 37, w: 2.5, h: 5, r: 0.7, rot: 0, cx: 0, cy: 0 },
    { x: 104, y: 37, w: 2.5, h: 5, r: 0.7, rot: 0, cx: 0, cy: 0 },
    { x: 116.3, y: 44, w: 2.5, h: 5, r: 0.7, rot: 90, cx: 116.25, cy: 45.5 },
    { x: 122.8, y: 44, w: 2.5, h: 5, r: 0.7, rot: 90, cx: 116.25, cy: 45.5 },
    { x: 104, y: 16, w: 2.5, h: 5, r: 0.7, rot: 180, cx: 105.25, cy: 39.5 },
    { x: 114.5, y: 16, w: 2.5, h: 5, r: 0.7, rot: 180, cx: 105.25, cy: 39.5 },
    { x: 80, y: -13.6, w: 2.5, h: 5, r: 0.7, rot: 270, cx: 115.25, cy: 19.5 },
    { x: 87, y: -13.6, w: 2.5, h: 5, r: 0.7, rot: 270, cx: 115.25, cy: 19.5 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 200 100"
        style={{
          width: `${200 * scaleFactor}px`,
          height: `${100 * scaleFactor}px`,
          color: "rgba(255,255,255,0.15)", // text-muted stroke color
        }}
      >
        {/* SVG Defs for markers and gradients */}
        <defs>
          <radialGradient id="cpu-blue-grad" fx="1">
            <stop offset="0%" stopColor="#00E8ED" />
            <stop offset="50%" stopColor={accentColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="cpu-yellow-grad" fx="1">
            <stop offset="0%" stopColor="#FFD800" />
            <stop offset="50%" stopColor="#FFD800" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="cpu-pinkish-grad" fx="1">
            <stop offset="0%" stopColor="#830CD1" />
            <stop offset="50%" stopColor="#FF008B" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="cpu-white-grad" fx="1">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="cpu-green-grad" fx="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="cpu-orange-grad" fx="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="cpu-cyan-grad" fx="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="cpu-rose-grad" fx="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="cpu-light-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="1.5" dy="1.5" stdDeviation="1" floodColor="black" floodOpacity="0.3" />
          </filter>
          <marker
            id="cpu-circle-marker"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth={lineMarkerSize}
            markerHeight={lineMarkerSize}
          >
            {/* Draw static marker circle without raw SVG layout updates */}
            <circle cx="5" cy="5" r="2.2" fill="black" stroke="#2b2b2b" strokeWidth="0.6" />
          </marker>
          <linearGradient id="cpu-connection-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#666666" />
            <stop offset="60%" stopColor="#1e1e20" />
          </linearGradient>
          <linearGradient id="cpu-text-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#888888" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#888888" />
          </linearGradient>
        </defs>

        {/* Paths representation */}
        <g
          stroke="currentColor"
          fill="none"
          strokeWidth="0.3"
          markerStart="url(#cpu-circle-marker)"
        >
          <path d="M 10 20 h 79.5 q 5 0 5 5 v 30" />
          <path d="M 180 10 h -69.7 q -5 0 -5 5 v 30" />
          <path d="M 130 20 v 21.8 q 0 5 -5 5 h -10" />
          <path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50" />
          <path d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20" />
          <path d="M 94.8 95 v -36" />
          <path d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14" />
          <path d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20" />
        </g>

        {/* 8 Deterministic playhead-driven light particles */}
        {points[0].active && <circle cx={points[0].x} cy={points[0].y} r="3.2" fill="url(#cpu-blue-grad)" />}
        {points[1].active && <circle cx={points[1].x} cy={points[1].y} r="3.2" fill="url(#cpu-yellow-grad)" />}
        {points[2].active && <circle cx={points[2].x} cy={points[2].y} r="3.2" fill="url(#cpu-pinkish-grad)" />}
        {points[3].active && <circle cx={points[3].x} cy={points[3].y} r="3.2" fill="url(#cpu-white-grad)" />}
        {points[4].active && <circle cx={points[4].x} cy={points[4].y} r="3.2" fill="url(#cpu-green-grad)" />}
        {points[5].active && <circle cx={points[5].x} cy={points[5].y} r="3.2" fill="url(#cpu-orange-grad)" />}
        {points[6].active && <circle cx={points[6].x} cy={points[6].y} r="3.2" fill="url(#cpu-cyan-grad)" />}
        {points[7].active && <circle cx={points[7].x} cy={points[7].y} r="3.2" fill="url(#cpu-rose-grad)" />}

        {/* CPU Box Group */}
        <g>
          {showCpuConnections && (
            <g fill="url(#cpu-connection-gradient)">
              {cpuConnections.map((conn, idx) => (
                <rect
                  key={idx}
                  x={conn.x}
                  y={conn.y}
                  width={conn.w}
                  height={conn.h}
                  rx={conn.r}
                  transform={conn.rot ? `rotate(${conn.rot} ${conn.cx} ${conn.cy})` : undefined}
                />
              ))}
            </g>
          )}
          {/* Main CPU Box */}
          <rect
            x="85"
            y="40"
            width="30"
            height="20"
            rx="2"
            fill="#121214"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.3"
            filter="url(#cpu-light-shadow)"
          />
          {/* CPU Text */}
          <text
            x="100"
            y="52"
            textAnchor="middle"
            fontSize="6.8"
            fill={animateText ? "url(#cpu-text-gradient)" : textColor}
            fontWeight="600"
            letterSpacing="0.04em"
            style={{
              fontFamily: "Inter, sans-serif",
            }}
          >
            {text}
          </text>
        </g>
      </svg>
    </div>
  );
}
