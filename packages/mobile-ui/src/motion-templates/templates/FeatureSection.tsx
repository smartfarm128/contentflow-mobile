import type { HtmlTemplateProps } from "../types";

export function FeatureSectionTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const speed = Number(values.speed ?? 40.0);
  const titleText = String(values.title ?? "Automate repetitive tasks");
  const badgeText = String(values.badgeText ?? "Workflow Automation");
  const descText = String(values.description ?? "we help you streamline operations with AI-driven automation — from payroll and reporting to employee tracking and smart notifications. Our solutions reduce human error, save time, and scale effortlessly with your business needs.");

  const scale = Math.min(width, height) / 1080;
  const sectionWidth = 920 * scale;
  const cardWidth = 360 * scale;
  const cardHeight = 320 * scale;
  const itemHeight = 72 * scale;

  const tasks = [
    { title: "AI-powered notifications", subtitle: "Smart alerts for critical events", color: "#3b82f6" },
    { title: "Automated payroll", subtitle: "Error-free salary processing", color: "#10b981" },
    { title: "Employee insights", subtitle: "Track productivity in real-time", color: "#8b5cf6" },
    { title: "Social campaigns", subtitle: "AI-curated content suggestions", color: "#ec4899" },
    { title: "AI-driven reports", subtitle: "Weekly insights & performance", color: "#f59e0b" },
  ];

  // Set height is height of 5 items
  const setHeight = tasks.length * itemHeight;
  const scrollOffset = -(time * speed * scale) % setHeight;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        padding: `${32 * scale}px`,
      }}
    >
      <div
        style={{
          width: sectionWidth,
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          alignItems: "center",
          gap: `${48 * scale}px`,
        }}
      >
        {/* LEFT SIDE - Task Marquee Card */}
        <div
          style={{
            position: "relative",
            width: cardWidth,
            height: cardHeight,
            borderRadius: `${16 * scale}px`,
            border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
            background: "rgba(15, 23, 42, 0.25)",
            backdropFilter: "blur(12px)",
            boxShadow: `0 ${12 * scale}px ${30 * scale}px rgba(0, 0, 0, 0.5)`,
            overflow: "hidden",
          }}
        >
          {/* Scrollable track list */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              transform: `translateY(${scrollOffset}px)`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {[...tasks, ...tasks, ...tasks].map((task, i) => (
              <div
                key={i}
                style={{
                  height: itemHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `0 ${20 * scale}px`,
                  borderBottom: `${1 * scale}px solid rgba(255, 255, 255, 0.06)`,
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: `${12 * scale}px` }}>
                  <div
                    style={{
                      width: `${40 * scale}px`,
                      height: `${40 * scale}px`,
                      borderRadius: `${10 * scale}px`,
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: `${1 * scale}px solid rgba(255, 255, 255, 0.1)`,
                      boxShadow: "0 4px 6px rgba(0,0,0,0.15)",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: `${14 * scale}px`, fontWeight: 600, color: "#ffffff" }}>{task.title}</span>
                    <span style={{ fontSize: `${11 * scale}px`, color: "#94a3b8" }}>{task.subtitle}</span>
                  </div>
                </div>

                {/* Simulated task status dot */}
                <div
                  style={{
                    width: `${8 * scale}px`,
                    height: `${8 * scale}px`,
                    borderRadius: "50%",
                    backgroundColor: task.color,
                    boxShadow: `0 0 ${8 * scale}px ${task.color}`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Atmospheric gradient overlay inside card */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: `${40 * scale}px`,
              background: "linear-gradient(to bottom, #09090b, transparent)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${40 * scale}px`,
              background: "linear-gradient(to top, #09090b, transparent)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
        </div>

        {/* RIGHT SIDE - Content Box */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: `${20 * scale}px` }}>
          {/* Badge */}
          <div
            style={{
              borderRadius: `${30 * scale}px`,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: `${1 * scale}px solid rgba(255, 255, 255, 0.1)`,
              padding: `${6 * scale}px ${16 * scale}px`,
              fontSize: `${13 * scale}px`,
              fontWeight: 600,
              color: "#94a3b8",
            }}
          >
            {badgeText}
          </div>

          {/* Title */}
          <span
            style={{
              fontSize: `${32 * scale}px`,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.25,
            }}
          >
            {titleText}
          </span>

          {/* Description */}
          <p
            style={{
              fontSize: `${16 * scale}px`,
              color: "#94a3b8",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {descText}
          </p>

          {/* Feature Badges */}
          <div style={{ display: "flex", gap: `${8 * scale}px`, flexWrap: "wrap", marginTop: `${8 * scale}px` }}>
            <span
              style={{
                borderRadius: `${6 * scale}px`,
                backgroundColor: "#2563eb1f",
                border: `${1 * scale}px solid rgba(37, 99, 235, 0.3)`,
                color: "#60a5fa",
                padding: `${6 * scale}px ${12 * scale}px`,
                fontSize: `${12 * scale}px`,
                fontWeight: 600,
              }}
            >
              AI Task Bots
            </span>
            <span
              style={{
                borderRadius: `${6 * scale}px`,
                backgroundColor: "#0596691f",
                border: `${1 * scale}px solid rgba(5, 150, 105, 0.3)`,
                color: "#34d399",
                padding: `${6 * scale}px ${12 * scale}px`,
                fontSize: `${12 * scale}px`,
                fontWeight: 600,
              }}
            >
              100+ Automations
            </span>
            <span
              style={{
                borderRadius: `${6 * scale}px`,
                backgroundColor: "#7c3aed1f",
                border: `${1 * scale}px solid rgba(124, 58, 237, 0.3)`,
                color: "#a78bfa",
                padding: `${6 * scale}px ${12 * scale}px`,
                fontSize: `${12 * scale}px`,
                fontWeight: 600,
              }}
            >
              Enterprise Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
