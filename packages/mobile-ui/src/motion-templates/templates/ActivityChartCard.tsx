import type { HtmlTemplateProps } from "../types";
import { ChevronDown, TrendingUp } from "lucide-react";

export function ActivityChartCardTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Activity");
  const totalValue = String(values.totalValue ?? "21h");
  
  const valS = Number(values.valS ?? 8);
  const valM = Number(values.valM ?? 12);
  const valT = Number(values.valT ?? 9);
  const valW = Number(values.valW ?? 4);
  const valTh = Number(values.valTh ?? 7);
  const valF = Number(values.valF ?? 14);
  const valSa = Number(values.valSa ?? 2);

  const primaryColor = String(values.primaryColor ?? "#6366f1"); // Theme accent
  const backgroundColor = String(values.backgroundColor ?? "#09090b");
  const cycleDuration = Number(values.cycleDuration ?? 6);

  const data = [
    { day: "S", value: valS },
    { day: "M", value: valM },
    { day: "T", value: valT },
    { day: "W", value: valW },
    { day: "T", value: valTh },
    { day: "F", value: valF },
    { day: "S", value: valSa },
  ];

  const maxValue = data.reduce((max, item) => (item.value > max ? item.value : max), 1);

  // Staggered bounce calculation based on loop time
  const t = time % cycleDuration;

  const barScaleYs = data.map((_, i) => {
    const delay = i * 0.12;
    if (t < delay) return 0;
    const duration = 0.5;
    const x = Math.min(1, (t - delay) / duration);
    // Ease Out Back curve for organic bouncy feel
    // f(x) = 1 + c3 * (x-1)^3 + c1 * (x-1)^2
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const bounce = 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    return Math.max(0, bounce);
  });

  const compositionHeight = 400;
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
          width: `${380 * scaleFactor}px`,
          backgroundColor: "#161618",
          borderRadius: `${16 * scaleFactor}px`,
          padding: `${24 * scaleFactor}px`,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          color: "#ffffff",
        }}
      >
        {/* Header */}
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "between",
            marginBottom: `${20 * scaleFactor}px`
          }}
          className="justify-between"
        >
          <span style={{ fontSize: `${18 * scaleFactor}px`, fontWeight: 600 }}>{title}</span>
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: `${4 * scaleFactor}px`,
              fontSize: `${12 * scaleFactor}px`,
              color: "#a1a1aa",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              padding: `${4 * scaleFactor}px ${10 * scaleFactor}px`,
              borderRadius: `${8 * scaleFactor}px`
            }}
          >
            <span>Weekly</span>
            <ChevronDown style={{ width: `${14 * scaleFactor}px`, height: `${14 * scaleFactor}px` }} />
          </div>
        </div>

        {/* Content Body */}
        <div 
          style={{
            display: "flex",
            alignItems: "end",
            gap: `${24 * scaleFactor}px`,
            justifyContent: "space-between"
          }}
        >
          {/* Metrics */}
          <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <span style={{ fontSize: `${44 * scaleFactor}px`, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>
              {totalValue}
            </span>
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: `${4 * scaleFactor}px`,
                fontSize: `${12 * scaleFactor}px`,
                color: "#10b981",
                marginTop: `${8 * scaleFactor}px`
              }}
            >
              <TrendingUp style={{ width: `${14 * scaleFactor}px`, height: `${14 * scaleFactor}px` }} />
              <span>+12% vs last week</span>
            </div>
          </div>

          {/* Bar Chart Grid */}
          <div 
            style={{ 
              display: "flex", 
              height: `${120 * scaleFactor}px`, 
              flex: 1, 
              alignItems: "end", 
              justifyContent: "space-between",
              gap: `${6 * scaleFactor}px` 
            }}
          >
            {data.map((item, idx) => {
              const heightPct = (item.value / maxValue) * 100;
              const scaleY = barScaleYs[idx];
              
              return (
                <div 
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "end",
                    height: "100%",
                    flex: 1,
                  }}
                >
                  {/* Bar */}
                  <div
                    style={{
                      width: "100%",
                      height: `${heightPct}%`,
                      backgroundColor: primaryColor,
                      borderRadius: `${4 * scaleFactor}px`,
                      transform: `scaleY(${scaleY})`,
                      transformOrigin: "bottom",
                      boxShadow: `0 0 15px ${primaryColor}22`
                    }}
                  />
                  {/* Label */}
                  <span 
                    style={{ 
                      fontSize: `${10 * scaleFactor}px`, 
                      color: "#71717a", 
                      marginTop: `${8 * scaleFactor}px`,
                      fontWeight: 500
                    }}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
