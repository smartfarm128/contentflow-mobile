import { useMemo } from "react";
import * as LucideIcons from "lucide-react";
import type { HtmlTemplateProps } from "../types";

export function ExpandableTabsTemplate({ time, width, values }: HtmlTemplateProps) {
  const tabsString = String(values.tabs ?? "Home:Home, Bell:Notifications, Settings:Settings, HelpCircle:Support, Shield:Security");
  const cycleDuration = Number(values.cycleDuration ?? 8); // Duration for one full sequence cycle
  const activeColor = String(values.activeColor ?? "#06b6d4"); // Cyan
  const backgroundColor = String(values.backgroundColor ?? "rgba(255, 255, 255, 0.03)");

  const scale = width / 1920;
  const padding = 8 * scale;
  const gap = 8 * scale;
  const iconSize = 20 * scale;
  const fontSize = Math.max(12, 14 * scale);

  // Parse tabs config
  const tabItems = useMemo(() => {
    return tabsString.split(",").map((item) => {
      const parts = item.trim().split(":");
      const iconName = (parts[0] || "Home").trim();
      const title = (parts[1] || iconName).trim();

      // Resolve Icon dynamically
      const IconComp = (LucideIcons as any)[iconName] || LucideIcons.Home;
      return { title, Icon: IconComp };
    });
  }, [tabsString]);

  const n = tabItems.length || 1;
  const activeIndex = Math.floor((time / (cycleDuration / n)) % n);
  const localTime = time % (cycleDuration / n);


  // Render tabs mapping width and layout changes mathematically
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b", // zinc-950
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${24 * scale}px`,
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${gap}px`,
          backgroundColor: backgroundColor,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: `${16 * scale}px`,
          padding: `${padding}px`,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
        }}
      >
        {tabItems.map((tab, index) => {
          const isActive = index === activeIndex;
          const Icon = tab.Icon;

          // Compute transition variables (e.g. spring interpolation)
          let t = 0;
          if (isActive) {
            // Animate opening
            t = Math.min(1, localTime / 0.3); // open in 300ms
          } else {
            // Check if we just closed
            const prevIndex = (activeIndex - 1 + n) % n;
            if (index === prevIndex) {
              t = Math.max(0, 1 - localTime / 0.3); // close in 300ms
            }
          }

          // Ease-out transition curve
          const easeOut = 1 - Math.pow(1 - t, 3);

          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: `${12 * scale}px`,
                padding: `${10 * scale}px ${12 * scale + (6 * scale * easeOut)}px`,
                backgroundColor: isActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
                color: isActive ? activeColor : "rgba(255, 255, 255, 0.5)",
                fontSize: `${fontSize}px`,
                fontWeight: 500,
                cursor: "pointer",
                gap: `${6 * scale * easeOut}px`,
                transition: "background-color 0.2s ease, color 0.2s ease",
              }}
            >
              <Icon size={iconSize} style={{ flexShrink: 0 }} />

              {/* Label reveal container */}
              <div
                style={{
                  width: `${120 * scale * easeOut}px`,
                  opacity: easeOut,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  transition: "width 0.15s ease-out, opacity 0.15s ease-out",
                }}
              >
                {tab.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
