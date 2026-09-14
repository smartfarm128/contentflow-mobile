import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { Plane, Wifi, Bluetooth, Settings2 } from "lucide-react";

export function InterfacesSwitchTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const panelTitle = String(values.panelTitle ?? "System Connections");
  const activeColor = String(values.activeColor ?? "#3b82f6");
  const panelBg = String(values.panelBg ?? "#0f172a");

  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Calculate toggling states for 3 switches over a 6s loop
  const loopDuration = 6;
  const progress = (time % loopDuration) / loopDuration;

  // Switch 1: Airplane Mode toggles at 0.25 (checked) and toggles back at 0.75 (unchecked)
  const isSwitch1Checked = progress >= 0.25 && progress < 0.75;
  // Switch 2: Wi-Fi toggles at 0.4 (checked) and back at 0.85 (unchecked)
  const isSwitch2Checked = progress >= 0.4 && progress < 0.85;
  // Switch 3: Bluetooth toggles at 0.55 (checked) and back at 0.95 (unchecked)
  const isSwitch3Checked = progress >= 0.55 && progress < 0.95;

  const switches = useMemo(() => [
    {
      id: "airplane",
      label: "Airplane Mode",
      icon: Plane,
      checked: isSwitch1Checked,
    },
    {
      id: "wifi",
      label: "Wireless Wi-Fi",
      icon: Wifi,
      checked: isSwitch2Checked,
    },
    {
      id: "bluetooth",
      label: "Bluetooth Connectivity",
      icon: Bluetooth,
      checked: isSwitch3Checked,
    },
  ], [isSwitch1Checked, isSwitch2Checked, isSwitch3Checked]);

  // Scaled dimensions
  const cardWidth = 460 * scaleFactor;
  const cardPadding = 32 * scaleFactor;
  const fontSizeTitle = 22 * scaleFactor;
  const fontSizeLabel = 16 * scaleFactor;
  const iconSize = 20 * scaleFactor;
  const spacing = 20 * scaleFactor;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#020617",
        backgroundImage: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Decorative background grid line overlay */}
      <div
        style={{
          position: "absolute",
          width: "120%",
          height: "120%",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: `${40 * scaleFactor}px ${40 * scaleFactor}px`,
          transform: "rotate(3deg)",
          pointerEvents: "none",
        }}
      />

      {/* Control Panel Card */}
      <div
        style={{
          width: `${cardWidth}px`,
          backgroundColor: panelBg,
          borderRadius: `${16 * scaleFactor}px`,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: `${cardPadding}px`,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          display: "flex",
          flexDirection: "column",
          gap: `${spacing}px`,
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Settings2 size={iconSize * 1.2} style={{ color: activeColor }} />
          <h2 style={{ fontSize: `${fontSizeTitle}px`, fontWeight: 700, color: "#ffffff", margin: 0 }}>
            {panelTitle}
          </h2>
        </div>

        {/* Switch Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: `${16 * scaleFactor}px` }}>
          {switches.map((sw) => {
            const Icon = sw.icon;
            
            return (
              <div
                key={sw.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `${12 * scaleFactor}px ${16 * scaleFactor}px`,
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  borderRadius: `${10 * scaleFactor}px`,
                  border: "1px solid rgba(255,255,255,0.04)",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: `${12 * scaleFactor}px` }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: `${36 * scaleFactor}px`,
                      height: `${36 * scaleFactor}px`,
                      borderRadius: `${8 * scaleFactor}px`,
                      backgroundColor: sw.checked ? `${activeColor}15` : "rgba(255,255,255,0.05)",
                      color: sw.checked ? activeColor : "#94a3b8",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Icon size={iconSize} />
                  </div>
                  <span style={{ fontSize: `${fontSizeLabel}px`, fontWeight: 500, color: sw.checked ? "#ffffff" : "#94a3b8" }}>
                    {sw.label}
                  </span>
                </div>

                {/* Custom Deterministic Switch Widget */}
                <div
                  style={{
                    position: "relative",
                    width: `${44 * scaleFactor}px`,
                    height: `${24 * scaleFactor}px`,
                    borderRadius: `${12 * scaleFactor}px`,
                    backgroundColor: sw.checked ? activeColor : "rgba(255, 255, 255, 0.12)",
                    transition: "background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: `${2 * scaleFactor}px`,
                      left: `${2 * scaleFactor}px`,
                      width: `${20 * scaleFactor}px`,
                      height: `${20 * scaleFactor}px`,
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      transform: sw.checked ? `translateX(${20 * scaleFactor}px)` : "translateX(0)",
                      transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
