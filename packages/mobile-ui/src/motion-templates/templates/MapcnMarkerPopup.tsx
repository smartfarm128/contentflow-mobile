import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { Clock, Star } from "lucide-react";

export function MapcnMarkerPopupTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read inputs from values (or fallback to defaults)
  const mapTheme = String(values.theme ?? "dark");
  const zoom = Number(values.zoom ?? 11);
  const ratingColor = String(values.ratingColor ?? "#fbbf24");
  const markerBg = String(values.markerBg ?? "#f43f5e");
  
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  
  // Manhattan coordinates projection
  const projectPoint = (lat: number, lng: number) => {
    const centerLng = -73.98;
    const centerLat = 40.74;
    // Adjust scale based on zoom input
    const scale = 18000 * (zoom / 11);
    const x = 400 + (lng - centerLng) * scale * Math.cos((centerLat * Math.PI) / 180);
    const y = 250 - (lat - centerLat) * scale;
    return { x, y };
  };

  const places = useMemo(() => [
    {
      id: 1,
      name: "The Metropolitan Museum of Art",
      label: "Museum",
      category: "Museum",
      rating: 4.8,
      reviews: "12,453",
      hours: "10:00 AM - 5:00 PM",
      image: "https://images.unsplash.com/photo-1575223970966-76ae61ee7838?w=300&h=200&fit=crop",
      lng: -73.9632,
      lat: 40.7794,
      showStart: 0.1,
      popupStart: 0.18,
      popupEnd: 0.42,
    },
    {
      id: 2,
      name: "Brooklyn Bridge",
      label: "Landmark",
      category: "Landmark",
      rating: 4.9,
      reviews: "8,234",
      hours: "Open 24 hours",
      image: "https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=300&h=200&fit=crop",
      lng: -73.9969,
      lat: 40.7061,
      showStart: 0.38,
      popupStart: 0.46,
      popupEnd: 0.7,
    },
    {
      id: 3,
      name: "Grand Central Terminal",
      label: "Transit",
      category: "Transit",
      rating: 4.7,
      reviews: "5,621",
      hours: "5:15 AM - 2:00 AM",
      image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=300&h=200&fit=crop",
      lng: -73.9772,
      lat: 40.7527,
      showStart: 0.66,
      popupStart: 0.74,
      popupEnd: 0.95,
    },
  ], [zoom]);

  // Total template duration cycle (default 10s loop)
  const duration = 10;
  const progress = (time % duration) / duration;

  // Dark/Light themes
  const bgColor = mapTheme === "dark" ? "#0f172a" : "#f8fafc";
  const gridColor = mapTheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
  const labelTextColor = mapTheme === "dark" ? "#f1f5f9" : "#0f172a";
  const cardBgColor = mapTheme === "dark" ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.85)";
  const cardTextColor = mapTheme === "dark" ? "#f1f5f9" : "#0f172a";
  const cardMutedColor = mapTheme === "dark" ? "#94a3b8" : "#64748b";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* SVG Canvas Map */}
      <svg
        viewBox="0 0 800 500"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
        }}
      >
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={gridColor} strokeWidth="1" />
          </pattern>
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid Background */}
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* Places Markers & Popups */}
        {places.map((place) => {
          const pt = projectPoint(place.lat, place.lng);
          
          // Marker fade-in calculation
          const markerOpacity = progress >= place.showStart ? Math.min(1, (progress - place.showStart) * 12) : 0;
          const markerScale = progress >= place.showStart ? Math.min(1.1, 0.4 + (progress - place.showStart) * 10) : 0;
          
          // Pulse scale driven by time
          const pulseScale = markerOpacity > 0.9 ? 1 + 0.15 * Math.sin(time * 6 + place.id) : 1;

          // Popup card animation calculation
          const popupVisible = progress >= place.popupStart && progress <= place.popupEnd;
          let popupOpacity = 0;
          let popupScale = 0.8;
          let popupYOffset = 10;
          
          if (progress >= place.popupStart && progress < place.popupStart + 0.05) {
            // Animating open
            const t = (progress - place.popupStart) / 0.05;
            popupOpacity = t;
            popupScale = 0.8 + 0.2 * t;
            popupYOffset = 10 - 10 * t;
          } else if (progress >= place.popupStart + 0.05 && progress <= place.popupEnd - 0.05) {
            // Fully open
            popupOpacity = 1;
            popupScale = 1.0;
            popupYOffset = 0;
          } else if (progress > place.popupEnd - 0.05 && progress <= place.popupEnd) {
            // Animating close
            const t = (place.popupEnd - progress) / 0.05;
            popupOpacity = t;
            popupScale = 0.8 + 0.2 * t;
            popupYOffset = 10 - 10 * t;
          }

          return (
            <g key={place.id} style={{ opacity: markerOpacity }}>
              {/* Pulse Circle Background */}
              {markerOpacity > 0.9 && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill={markerBg}
                  opacity={0.25 * (1 - (time * 1.5 % 1))}
                  transform={`translate(${pt.x}, ${pt.y}) scale(${1 + 1.2 * (time * 1.5 % 1)}) translate(${-pt.x}, ${-pt.y})`}
                />
              )}

              {/* Marker pin */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="7"
                fill="#ffffff"
                stroke={markerBg}
                strokeWidth="3.5"
                filter="url(#glow-filter)"
                transform={`translate(${pt.x}, ${pt.y}) scale(${markerScale * pulseScale}) translate(${-pt.x}, ${-pt.y})`}
                style={{ cursor: "pointer" }}
              />

              {/* Marker Category Label */}
              {markerOpacity > 0.9 && !popupVisible && (
                <text
                  x={pt.x}
                  y={pt.y + 20}
                  textAnchor="middle"
                  fill={labelTextColor}
                  fontSize={`${11 * scaleFactor}px`}
                  fontWeight="600"
                  opacity={0.8}
                >
                  {place.label}
                </text>
              )}

              {/* Popup card foreignObject */}
              {popupOpacity > 0 && (
                <foreignObject
                  x={pt.x - 120}
                  y={pt.y - 250 - popupYOffset}
                  width="240"
                  height="230"
                  style={{
                    overflow: "visible",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: cardBgColor,
                      color: cardTextColor,
                      borderRadius: `${12 * scaleFactor}px`,
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                      backdropFilter: "blur(12px)",
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      height: "100%",
                      transform: `scale(${popupScale})`,
                      transformOrigin: "bottom center",
                      opacity: popupOpacity,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ height: "90px", position: "relative" }}>
                      <img
                        src={place.image}
                        alt={place.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ padding: `${10 * scaleFactor}px`, display: "flex", flexDirection: "column", gap: `${4 * scaleFactor}px` }}>
                      <div style={{ fontSize: `${10 * scaleFactor}px`, textTransform: "uppercase", color: cardMutedColor, fontWeight: 600 }}>
                        {place.category}
                      </div>
                      <div style={{ fontSize: `${13 * scaleFactor}px`, fontWeight: 700, lineHeight: 1.2 }}>
                        {place.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: `${11 * scaleFactor}px` }}>
                        <Star size={12} fill={ratingColor} stroke={ratingColor} />
                        <span style={{ fontWeight: 600 }}>{place.rating}</span>
                        <span style={{ color: cardMutedColor }}>({place.reviews})</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: `${11 * scaleFactor}px`, color: cardMutedColor }}>
                        <Clock size={12} />
                        <span>{place.hours}</span>
                      </div>
                    </div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
