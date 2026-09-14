import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { MacOSDock } from "../ui/mac-os-dock";
import { placeholderImage, placeholderLogo } from "../local-placeholder";

const DEFAULT_APPS = [
  { 
    id: 'finder', 
    name: 'Finder', 
    icon: placeholderLogo("0pngrf1024") 
  },
  { 
    id: 'calculator', 
    name: 'Calculator', 
    icon: placeholderLogo("9pngrf1024") 
  },
  { 
    id: 'terminal', 
    name: 'Terminal', 
    icon: placeholderLogo("3pngrf1024") 
  },
  { 
    id: 'mail', 
    name: 'Mail', 
    icon: placeholderLogo("5pngrf1024") 
  },
  { 
    id: 'notes', 
    name: 'Notes', 
    icon: placeholderLogo("5pngrf1024") 
  },
  { 
    id: 'safari', 
    name: 'Safari', 
    icon: placeholderLogo("2pngrf1024") 
  },
  { 
    id: 'photos', 
    name: 'Photos', 
    icon: placeholderLogo("8pngrf1024") 
  },
  { 
    id: 'music', 
    name: 'Music', 
    icon: placeholderLogo("5pngrf1024") 
  },
  { 
    id: 'calendar', 
    name: 'Calendar', 
    icon: placeholderLogo("9pngrf1024") 
  },
];

export function MacOSDockTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const activeAppsList = String(values.activeApps ?? "finder,safari,terminal");
  const bgImage = String(values.bgImage ?? placeholderImage("09q80w1200"));
  const desktopTitle = String(values.desktopTitle ?? "Creative Workspace");

  const openApps = useMemo(() => {
    return activeAppsList.split(",").map(s => s.trim());
  }, [activeAppsList]);

  // Design scale factors
  const scale = Math.min(width, height) / 1080;
  const baseIconSize = Math.max(32, Math.min(80, 64 * scale));
  const baseSpacing = Math.max(4, baseIconSize * 0.08);

  // Sweep virtual cursor horizontally across the dock's width as progress ranges 0..1
  const totalAppsWidth = DEFAULT_APPS.length * (baseIconSize + baseSpacing) - baseSpacing;
  
  // Sweep mouse position from -50px to totalAppsWidth + 50px so it enters and exits cleanly
  const virtualMouseX = -50 + progress * (totalAppsWidth + 100);

  const titleSize = Math.max(18, Math.round(44 * scale));
  const descSize = Math.max(11, Math.round(20 * scale));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Premium Desktop Wallpaper */}
      <div style={{ position: "absolute", inset: 0, zIndex: -1 }}>
        <img
          src={bgImage}
          alt="Desktop Background"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.25)" }} />
      </div>

      {/* Desktop Header Info */}
      <div
        style={{
          width: "100%",
          padding: `${Math.round(40 * scale)}px`,
          display: "flex",
          justifyContent: "space-between",
          color: "white",
          zIndex: 10,
        }}
      >
        <div>
          <h1 style={{ fontSize: `${titleSize}px`, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            {desktopTitle}
          </h1>
          <p style={{ fontSize: `${descSize}px`, opacity: 0.8, margin: `${Math.round(4 * scale)}px 0 0 0` }}>
            Scrub playhead to see magnification sweep
          </p>
        </div>
        <div style={{ fontSize: `${descSize}px`, fontWeight: 600, opacity: 0.9 }}>
          10:43 AM
        </div>
      </div>

      {/* MacOS Dock centered at bottom */}
      <div
        style={{
          marginBottom: `${Math.round(40 * scale)}px`,
          zIndex: 10,
        }}
      >
        <MacOSDock
          apps={DEFAULT_APPS}
          onAppClick={() => {}}
          openApps={openApps}
          mouseXOverride={virtualMouseX}
        />
      </div>
    </div>
  );
}
export default MacOSDockTemplate;
