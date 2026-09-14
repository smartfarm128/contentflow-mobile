import type { HtmlTemplateProps } from "../types";

const previewData = {
  midjourney: {
    image: "https://images.unsplash.com/photo-1695144244472-a4543101ef35?w=560&h=320&fit=crop",
    title: "Midjourney",
    subtitle: "Create stunning AI-generated artwork",
  },
  stable: {
    image: "https://images.unsplash.com/photo-1712002641088-9d76f9080889?w=560&h=320&fit=crop",
    title: "Stable Diffusion",
    subtitle: "Open-source generative AI model",
  },
  leonardo: {
    image: "https://images.unsplash.com/photo-1718241905696-cb34c2c07bed?w=560&h=320&fit=crop",
    title: "Leonardo AI",
    subtitle: "Production-ready creative assets",
  },
};

export function HoverPreviewTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 8.0);
  const accentColor = String(values.accentColor ?? "#ff6b6b");
  const backgroundColor = String(values.backgroundColor ?? "#0a0a0a");

  // Previews custom image overrides from values
  const imageMidjourney = String(values.imageMidjourney ?? previewData.midjourney.image);
  const imageStable = String(values.imageStable ?? previewData.stable.image);
  const imageLeonardo = String(values.imageLeonardo ?? previewData.leonardo.image);

  const localPreviewData = {
    midjourney: { ...previewData.midjourney, image: imageMidjourney },
    stable: { ...previewData.stable, image: imageStable },
    leonardo: { ...previewData.leonardo, image: imageLeonardo },
  };

  // Determine active preview & opacity based on time
  const t = time % cycleDuration;
  let activeKey: "midjourney" | "stable" | "leonardo" | null = null;
  let opacity = 0;

  if (t >= 1.0 && t < 3.0) {
    activeKey = "midjourney";
    opacity = t < 1.3 ? (t - 1.0) / 0.3 : t > 2.7 ? (3.0 - t) / 0.3 : 1.0;
  } else if (t >= 3.5 && t < 5.5) {
    activeKey = "stable";
    opacity = t < 3.8 ? (t - 3.5) / 0.3 : t > 5.2 ? (5.5 - t) / 0.3 : 1.0;
  } else if (t >= 6.0 && t < 8.0) {
    activeKey = "leonardo";
    opacity = t < 6.3 ? (t - 6.0) / 0.3 : t > 7.7 ? (8.0 - t) / 0.3 : 1.0;
  }

  // Calculate animated cursor position (drawn as a glowing pointer dot)
  // We make it move smoothly between the links
  const centerLinkX = width / 2;
  const linkY = height / 2;
  
  let targetCursorX = centerLinkX;
  let targetCursorY = linkY;

  // Let the cursor move in a organic path
  if (t < 1.0) {
    // Moves towards midjourney
    const ratio = t / 1.0;
    targetCursorX = width * 0.35 + (centerLinkX - width * 0.35) * (1 - ratio);
    targetCursorY = linkY - 20 + 20 * ratio;
  } else if (t >= 1.0 && t < 3.0) {
    // hovers on midjourney
    targetCursorX = width * 0.35 + Math.sin(t * 5) * 8;
    targetCursorY = linkY + Math.cos(t * 4) * 4;
  } else if (t >= 3.0 && t < 3.5) {
    // moves towards stable diffusion
    const ratio = (t - 3.0) / 0.5;
    targetCursorX = width * 0.35 + (width * 0.65 - width * 0.35) * ratio;
    targetCursorY = linkY;
  } else if (t >= 3.5 && t < 5.5) {
    // hovers on stable diffusion
    targetCursorX = width * 0.65 + Math.sin(t * 5) * 8;
    targetCursorY = linkY + Math.cos(t * 4) * 4;
  } else if (t >= 5.5 && t < 6.0) {
    // moves towards leonardo
    const ratio = (t - 5.5) / 0.5;
    targetCursorX = width * 0.65 + (width * 0.5 - width * 0.65) * ratio;
    targetCursorY = linkY + (linkY + 60 - linkY) * ratio;
  } else {
    // hovers on leonardo
    targetCursorX = width * 0.5 + Math.sin(t * 5) * 8;
    targetCursorY = linkY + 60 + Math.cos(t * 4) * 4;
  }

  const cardWidth = 280;
  const cardHeight = 240;
  const offsetY = 20;

  // Set card position above the pointer
  let cardX = targetCursorX - cardWidth / 2;
  let cardY = targetCursorY - cardHeight - offsetY;

  // Screen constraints
  if (cardX + cardWidth > width - 20) cardX = width - cardWidth - 20;
  if (cardX < 20) cardX = 20;
  if (cardY < 20) cardY = targetCursorY + offsetY;

  const scaleFactor = Math.min(width, height) / 600;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: backgroundColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {/* Ambient background pulse */}
      <div
        style={{
          position: "absolute",
          width: `${500 * scaleFactor}px`,
          height: `${500 * scaleFactor}px`,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}12 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.5 + 0.3 * Math.sin(time * 0.8),
        }}
      />

      {/* Main Text Content */}
      <div 
        style={{ 
          maxWidth: `${800 * scaleFactor}px`, 
          textAlign: "center", 
          fontSize: `${28 * scaleFactor}px`,
          lineHeight: 1.6,
          color: "#888888",
          zIndex: 5
        }}
      >
        <p style={{ marginBottom: "1.5em" }}>
          Explore{" "}
          <span 
            style={{ 
              color: activeKey === "midjourney" ? "#ffffff" : "#a3a3a3",
              fontWeight: 700,
              borderBottom: `2px solid ${activeKey === "midjourney" ? accentColor : "transparent"}`,
              paddingBottom: "2px",
              transition: "color 0.2s ease"
            }}
          >
            Midjourney
          </span>{" "}
          for breathtaking AI artwork.
        </p>

        <p>
          For open-source freedom try{" "}
          <span 
            style={{ 
              color: activeKey === "stable" ? "#ffffff" : "#a3a3a3",
              fontWeight: 700,
              borderBottom: `2px solid ${activeKey === "stable" ? accentColor : "transparent"}`,
              paddingBottom: "2px",
              transition: "color 0.2s ease"
            }}
          >
            Stable Diffusion
          </span>{" "}
          or generate creative assets with{" "}
          <span 
            style={{ 
              color: activeKey === "leonardo" ? "#ffffff" : "#a3a3a3",
              fontWeight: 700,
              borderBottom: `2px solid ${activeKey === "leonardo" ? accentColor : "transparent"}`,
              paddingBottom: "2px",
              transition: "color 0.2s ease"
            }}
          >
            Leonardo AI
          </span>
          .
        </p>
      </div>

      {/* Simulated Preview Card */}
      {activeKey && (
        <div
          style={{
            position: "absolute",
            left: `${cardX}px`,
            top: `${cardY}px`,
            width: `${cardWidth}px`,
            opacity: opacity,
            transform: `scale(${0.95 + 0.05 * opacity})`,
            zIndex: 10,
            pointerEvents: "none",
            backgroundColor: "#1a1a1a",
            borderRadius: "16px",
            padding: "8px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          }}
        >
          <img
            src={localPreviewData[activeKey].image}
            alt={localPreviewData[activeKey].title}
            style={{
              width: "100%",
              height: `${150}px`,
              objectFit: "cover",
              borderRadius: "10px",
            }}
          />
          <div style={{ padding: "12px 8px 4px", fontSize: "14px", color: "#ffffff", fontWeight: 700 }}>
            {localPreviewData[activeKey].title}
          </div>
          <div style={{ padding: "0 8px 8px", fontSize: "11px", color: "#888888" }}>
            {localPreviewData[activeKey].subtitle}
          </div>
        </div>
      )}

      {/* Simulated Glow Cursor */}
      <div
        style={{
          position: "absolute",
          left: `${targetCursorX - 6}px`,
          top: `${targetCursorY - 6}px`,
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          boxShadow: `0 0 15px ${accentColor}`,
          zIndex: 20,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
