import { useMemo } from "react";
import {
  FileText,
  CircleDollarSign,
  ClipboardList,
  FileSpreadsheet,
  FileUp,
  FileBarChart,
  FileCode,
} from "lucide-react";
import type { HtmlTemplateProps } from "../types";

export function RadarEffectTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const radarColor = String(values.radarColor ?? "#0284c7"); // Default sky-600/500
  const title = String(values.title ?? "Infrastructure Status");
  const subtitle = String(values.subtitle ?? "Real-time scanning and service state visualization");

  // 2. Scale factor calculation
  const scaleFactor = Math.min(width, height) / 1080;

  // Radar sweep center
  const centerX = width / 2;
  const centerY = height - 120 * scaleFactor;

  // 3. Sweep rotation angle
  // Sweep rotates 3 times over the progress of the clip
  const sweepAngle = (progress * 360 * 3) % 360;

  // Icon database
  const iconsData = useMemo(() => [
    { id: 1, label: "Web Development", x: -280, y: -240, Icon: FileText },
    { id: 2, label: "Mobile Apps", x: 0, y: -340, Icon: CircleDollarSign },
    { id: 3, label: "Designing", x: 280, y: -240, Icon: ClipboardList },
    { id: 4, label: "Maintenance", x: -160, y: -160, Icon: FileSpreadsheet },
    { id: 5, label: "Server Management", x: 160, y: -160, Icon: FileUp },
    { id: 6, label: "GitHub Integration", x: -220, y: -40, Icon: FileBarChart },
    { id: 7, label: "CMS Integration", x: 220, y: -40, Icon: FileCode },
  ], []);

  // Compute standard concentric circle radii
  const circles = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#080b11",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        padding: `${60 * scaleFactor}px ${24 * scaleFactor}px`,
        boxSizing: "border-box",
      }}
    >
      {/* Subtle grid pattern background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: `${40 * scaleFactor}px ${40 * scaleFactor}px`,
          pointerEvents: "none",
          opacity: 0.8,
        }}
      />

      {/* Header Info */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: `${12 * scaleFactor}px`,
          marginBottom: `${40 * scaleFactor}px`,
        }}
      >
        <h1
          style={{
            fontSize: `${48 * scaleFactor}px`,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1.2,
            background: "linear-gradient(to bottom, #ffffff, #94a3b8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: `${18 * scaleFactor}px`,
            color: "#64748b",
            margin: 0,
            maxWidth: `${600 * scaleFactor}px`,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Main Radar Screen Layout */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {/* Radar Concentric Rings */}
        {circles.map((multiplier, idx) => {
          const radius = multiplier * 90 * scaleFactor;
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: `${centerX - radius}px`,
                top: `${centerY - radius}px`,
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                borderRadius: "50%",
                border: `1px solid rgba(14, 165, 233, ${0.15 - idx * 0.015})`,
                boxSizing: "border-box",
              }}
            />
          );
        })}

        {/* Crosshair grid lines */}
        <div
          style={{
            position: "absolute",
            left: `${centerX - 720 * scaleFactor}px`,
            top: `${centerY}px`,
            width: `${1440 * scaleFactor}px`,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.15), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${centerX}px`,
            top: `${centerY - 720 * scaleFactor}px`,
            width: "1px",
            height: `${1440 * scaleFactor}px`,
            background: "linear-gradient(180deg, transparent, rgba(14, 165, 233, 0.15), transparent)",
          }}
        />

        {/* Radar Sweep Line (with trail wedge) */}
        <div
          style={{
            position: "absolute",
            left: `${centerX}px`,
            top: `${centerY}px`,
            width: `${600 * scaleFactor}px`,
            height: `${600 * scaleFactor}px`,
            transform: `translate(-50%, -50%) rotate(${sweepAngle}deg)`,
            transformOrigin: "center center",
          }}
        >
          {/* Main sweep line */}
          <div
            style={{
              position: "absolute",
              right: "50%",
              top: "50%",
              width: `${400 * scaleFactor}px`,
              height: `${2 * scaleFactor}px`,
              background: `linear-gradient(90deg, transparent, ${radarColor})`,
              transformOrigin: "right center",
              boxShadow: `0 0 12px ${radarColor}`,
            }}
          />
          {/* Wedge Trail - SVG gradient slice */}
          <svg
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              transform: "rotate(-45deg)", // offset so it trails behind the sweep line
            }}
            viewBox="0 0 100 100"
          >
            <defs>
              <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={radarColor} stopOpacity="0" />
                <stop offset="90%" stopColor={radarColor} stopOpacity="0.08" />
                <stop offset="100%" stopColor={radarColor} stopOpacity="0.15" />
              </radialGradient>
            </defs>
            {/* Draw a slice/wedge representing the sweeping beam */}
            <path
              d="M50,50 L85,15 A50,50 0 0,1 85,85 Z"
              fill="url(#radar-glow)"
            />
          </svg>
        </div>

        {/* Nodes / Targets positioned relative to radar center */}
        {iconsData.map((item) => {
          const iconX = centerX + item.x * scaleFactor;
          const iconY = centerY + item.y * scaleFactor;

          // Polar conversion for sweep highlighting
          // atan2 returns values in [-PI, PI]. Convert to [0, 360] degrees.
          const alpha = (Math.atan2(item.y, item.x) * 180) / Math.PI;
          const normalizedAlpha = (alpha + 360) % 360;

          // Determine angle difference from sweep
          const diff = (sweepAngle - normalizedAlpha + 360) % 360;

          // Flash intensity decays as the sweep line moves past the node
          // Flash range is 45 degrees
          const isFlashed = diff < 45;
          const flashIntensity = isFlashed ? 1 - diff / 45 : 0;

          const IconComponent = item.Icon;

          return (
            <div
              key={item.id}
              style={{
                position: "absolute",
                left: `${iconX}px`,
                top: `${iconY}px`,
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: `${10 * scaleFactor}px`,
                zIndex: 50,
              }}
            >
              {/* Outer Pulsing Glow */}
              <div
                style={{
                  position: "relative",
                  width: `${64 * scaleFactor}px`,
                  height: `${64 * scaleFactor}px`,
                  borderRadius: `${16 * scaleFactor}px`,
                  backgroundColor: isFlashed ? "rgba(14, 165, 233, 0.1)" : "rgba(30, 41, 59, 0.5)",
                  border: `1.5px solid rgba(14, 165, 233, ${0.15 + flashIntensity * 0.65})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isFlashed
                    ? `0 0 ${20 * flashIntensity * scaleFactor}px rgba(14, 165, 233, ${0.4 * flashIntensity})`
                    : "none",
                  boxSizing: "border-box",
                }}
              >
                <IconComponent
                  style={{
                    width: `${28 * scaleFactor}px`,
                    height: `${28 * scaleFactor}px`,
                    color: isFlashed ? "#38bdf8" : "#475569",
                  }}
                />

                {/* Target cursor indicator */}
                {isFlashed && (
                  <div
                    style={{
                      position: "absolute",
                      inset: `-${4 * scaleFactor}px`,
                      border: `1px solid rgba(56, 189, 248, ${flashIntensity})`,
                      borderRadius: `${20 * scaleFactor}px`,
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                )}
              </div>

              {/* Text label */}
              <span
                style={{
                  fontSize: `${12 * scaleFactor}px`,
                  fontWeight: 600,
                  color: isFlashed ? "#f8fafc" : "#64748b",
                  textShadow: isFlashed ? "0 0 8px rgba(255, 255, 255, 0.3)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
