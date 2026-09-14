import { useMemo } from "react";
import DottedMap from "dotted-map";
import type { HtmlTemplateProps } from "../types";

export function MapTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const lineColor = String(values.lineColor ?? "#0ea5e9");
  const showLabels = values.showLabels !== false;
  const animationDuration = Number(values.animationDuration ?? 2);
  const loop = values.loop !== false;
  const mapColor = String(values.mapColor ?? "rgba(255, 255, 255, 0.25)");
  const mapBgColor = String(values.mapBgColor ?? "#000000");

  // Read connections dynamically
  const startLat1 = Number(values.startLat1 ?? 64.2008);
  const startLng1 = Number(values.startLng1 ?? -149.4937);
  const startLabel1 = String(values.startLabel1 ?? "Fairbanks");
  const endLat1 = Number(values.endLat1 ?? 34.0522);
  const endLng1 = Number(values.endLng1 ?? -118.2437);
  const endLabel1 = String(values.endLabel1 ?? "Los Angeles");

  const startLat2 = Number(values.startLat2 ?? 64.2008);
  const startLng2 = Number(values.startLng2 ?? -149.4937);
  const startLabel2 = String(values.startLabel2 ?? "Fairbanks");
  const endLat2 = Number(values.endLat2 ?? -15.7975);
  const endLng2 = Number(values.endLng2 ?? -47.8919);
  const endLabel2 = String(values.endLabel2 ?? "Brasília");

  const startLat3 = Number(values.startLat3 ?? -15.7975);
  const startLng3 = Number(values.startLng3 ?? -47.8919);
  const startLabel3 = String(values.startLabel3 ?? "Brasília");
  const endLat3 = Number(values.endLat3 ?? 38.7223);
  const endLng3 = Number(values.endLng3 ?? -9.1393);
  const endLabel3 = String(values.endLabel3 ?? "Lisbon");

  const startLat4 = Number(values.startLat4 ?? 51.5074);
  const startLng4 = Number(values.startLng4 ?? -0.1278);
  const startLabel4 = String(values.startLabel4 ?? "London");
  const endLat4 = Number(values.endLat4 ?? 28.6139);
  const endLng4 = Number(values.endLng4 ?? 77.209);
  const endLabel4 = String(values.endLabel4 ?? "New Delhi");

  const startLat5 = Number(values.startLat5 ?? 28.6139);
  const startLng5 = Number(values.startLng5 ?? 77.209);
  const startLabel5 = String(values.startLabel5 ?? "New Delhi");
  const endLat5 = Number(values.endLat5 ?? 43.1332);
  const endLng5 = Number(values.endLng5 ?? 131.9113);
  const endLabel5 = String(values.endLabel5 ?? "Vladivostok");

  // 2. Scale factor based on canvas
  const scaleFactor = Math.min(width, height) / 1080;

  // Build dots list dynamically
  const dots = useMemo(() => {
    const list = [];
    if (startLabel1 || endLabel1) {
      list.push({ start: { lat: startLat1, lng: startLng1, label: startLabel1 }, end: { lat: endLat1, lng: endLng1, label: endLabel1 } });
    }
    if (startLabel2 || endLabel2) {
      list.push({ start: { lat: startLat2, lng: startLng2, label: startLabel2 }, end: { lat: endLat2, lng: endLng2, label: endLabel2 } });
    }
    if (startLabel3 || endLabel3) {
      list.push({ start: { lat: startLat3, lng: startLng3, label: startLabel3 }, end: { lat: endLat3, lng: endLng3, label: endLabel3 } });
    }
    if (startLabel4 || endLabel4) {
      list.push({ start: { lat: startLat4, lng: startLng4, label: startLabel4 }, end: { lat: endLat4, lng: endLng4, label: endLabel4 } });
    }
    if (startLabel5 || endLabel5) {
      list.push({ start: { lat: startLat5, lng: startLng5, label: startLabel5 }, end: { lat: endLat5, lng: endLng5, label: endLabel5 } });
    }
    return list;
  }, [
    startLat1, startLng1, startLabel1, endLat1, endLng1, endLabel1,
    startLat2, startLng2, startLabel2, endLat2, endLng2, endLabel2,
    startLat3, startLng3, startLabel3, endLat3, endLng3, endLabel3,
    startLat4, startLng4, startLabel4, endLat4, endLng4, endLabel4,
    startLat5, startLng5, startLabel5, endLat5, endLng5, endLabel5
  ]);

  // Compute map SVG background texture
  const map = useMemo(() => new DottedMap({ height: 100, grid: "diagonal" }), []);
  const svgMap = useMemo(() => {
    return map.getSVG({
      radius: 0.22,
      color: mapColor,
      shape: "circle",
      backgroundColor: mapBgColor
    });
  }, [map, mapColor, mapBgColor]);

  // Projection math
  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  // Determine algebraic timeline animations
  const staggerDelay = 0.35;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 1.5;
  const fullCycleDuration = totalAnimationTime + pauseTime;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: mapBgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif"
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* Render Map Background SVG Texture */}
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
          alt="World Map Grid"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.85
          }}
        />

        {/* Overlaying Animated Connections */}
        <svg
          viewBox="0 0 800 400"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "auto"
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
              <stop offset="25%" stopColor={lineColor} stopOpacity="1" />
              <stop offset="75%" stopColor={lineColor} stopOpacity="1" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {dots.map((dot, i) => {
            const startPoint = projectPoint(dot.start.lat, dot.start.lng);
            const endPoint = projectPoint(dot.end.lat, dot.end.lng);

            // Compute algebraic path drawing progress
            const startTime = i * staggerDelay;
            const endTime = startTime + animationDuration;

            const t = loop ? (time % fullCycleDuration) : time;

            let pathProgress = 0;
            if (t >= startTime && t <= endTime) {
              pathProgress = (t - startTime) / animationDuration;
            } else if (t > endTime) {
              // Fade or remain drawn
              if (loop && t > totalAnimationTime) {
                // fade out before loop restart
                const fadeProgress = (t - totalAnimationTime) / pauseTime;
                pathProgress = Math.max(0, 1 - fadeProgress);
              } else {
                pathProgress = 1;
              }
            }

            // Path length SVG metrics
            const pathString = createCurvedPath(startPoint, endPoint);

            return (
              <g key={`path-${i}`}>
                {/* Curved connecting line */}
                <path
                  d={pathString}
                  fill="none"
                  stroke="url(#path-gradient)"
                  strokeWidth="1.5"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={1 - pathProgress}
                  opacity={pathProgress > 0 ? 1 : 0}
                  style={{
                    transition: "opacity 0.2s"
                  }}
                />

                {/* Pulsing indicator on start point */}
                {pathProgress > 0.05 && (
                  <g>
                    <circle
                      cx={startPoint.x}
                      cy={startPoint.y}
                      r="4"
                      fill={lineColor}
                      filter="url(#glow)"
                    />
                    <circle
                      cx={startPoint.x}
                      cy={startPoint.y}
                      r="4"
                      fill={lineColor}
                      opacity={0.4}
                    >
                      <animate
                        attributeName="r"
                        from="4"
                        to="16"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.5"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                )}

                {/* Pulsing indicator on end point */}
                {pathProgress > 0.95 && (
                  <g>
                    <circle
                      cx={endPoint.x}
                      cy={endPoint.y}
                      r="4"
                      fill={lineColor}
                      filter="url(#glow)"
                    />
                    <circle
                      cx={endPoint.x}
                      cy={endPoint.y}
                      r="4"
                      fill={lineColor}
                      opacity={0.4}
                    >
                      <animate
                        attributeName="r"
                        from="4"
                        to="16"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.5"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                )}

                {/* Connection point labels */}
                {showLabels && (
                  <g>
                    {/* Start label */}
                    {pathProgress > 0.1 && dot.start.label && (
                      <foreignObject
                        x={startPoint.x - 60}
                        y={startPoint.y - 30}
                        width="120"
                        height="26"
                        style={{
                          pointerEvents: "none",
                          opacity: Math.min(1, (pathProgress - 0.1) * 5),
                          transition: "opacity 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span
                            style={{
                              fontSize: `${11 * scaleFactor}px`,
                              fontWeight: 600,
                              color: "#ffffff",
                              backgroundColor: "rgba(10, 10, 15, 0.85)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {dot.start.label}
                          </span>
                        </div>
                      </foreignObject>
                    )}

                    {/* End label */}
                    {pathProgress > 0.9 && dot.end.label && (
                      <foreignObject
                        x={endPoint.x - 60}
                        y={endPoint.y - 30}
                        width="120"
                        height="26"
                        style={{
                          pointerEvents: "none",
                          opacity: Math.min(1, (pathProgress - 0.9) * 10),
                          transition: "opacity 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span
                            style={{
                              fontSize: `${11 * scaleFactor}px`,
                              fontWeight: 600,
                              color: "#ffffff",
                              backgroundColor: "rgba(10, 10, 15, 0.85)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {dot.end.label}
                          </span>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
