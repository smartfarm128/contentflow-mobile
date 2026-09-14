import type { HtmlTemplateProps } from "../types";
import { Plus } from "lucide-react";
import { placeholderImage } from "../local-placeholder";

export function ImageZoomTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const imageUrl = String(values.imageUrl ?? placeholderImage("700fitcrop"));
  const authorName = String(values.authorName ?? "Ali Imam");
  const cycleDuration = Number(values.cycleDuration ?? 6.0);
  const accentColor = String(values.accentColor ?? "#fff200");
  const backgroundColor = String(values.backgroundColor ?? "#09090b");

  const t = time % cycleDuration;
  
  // Calculate smooth wave progress (0 -> 1 -> 0)
  const p = 0.5 - 0.5 * Math.cos((t * Math.PI * 2) / cycleDuration);

  const cardScale = 1.0 + 0.02 * p;
  const overlayOpacity = p;
  const overlayImageScale = 0.9 + 0.1 * p;
  
  // Techy plus icons rotation
  const plusRotation = t * 30;

  const scaleFactor = Math.min(width, height) / 500;
  const cardW = 250 * scaleFactor;
  const cardH = 340 * scaleFactor;

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
      {/* Background Card trigger container */}
      <div
        style={{
          width: `${cardW}px`,
          height: `${cardH}px`,
          position: "relative",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: `${16 * scaleFactor}px`,
          backgroundColor: "#161619",
          transform: `scale(${cardScale})`,
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)",
          borderRadius: `${8 * scaleFactor}px`,
        }}
      >
        {/* Plus indicators */}
        <Plus
          style={{
            position: "absolute",
            left: `-${16 * scaleFactor}px`,
            top: `-${16 * scaleFactor}px`,
            width: `${32 * scaleFactor}px`,
            height: `${32 * scaleFactor}px`,
            color: accentColor,
            transform: `rotate(${plusRotation}deg)`,
            opacity: 0.8
          }}
          strokeWidth={0.5}
        />
        <Plus
          style={{
            position: "absolute",
            left: `-${16 * scaleFactor}px`,
            bottom: `-${16 * scaleFactor}px`,
            width: `${32 * scaleFactor}px`,
            height: `${32 * scaleFactor}px`,
            color: accentColor,
            transform: `rotate(${plusRotation}deg)`,
            opacity: 0.8
          }}
          strokeWidth={0.5}
        />
        <Plus
          style={{
            position: "absolute",
            right: `-${16 * scaleFactor}px`,
            top: `-${16 * scaleFactor}px`,
            width: `${32 * scaleFactor}px`,
            height: `${32 * scaleFactor}px`,
            color: accentColor,
            transform: `rotate(${plusRotation}deg)`,
            opacity: 0.8
          }}
          strokeWidth={0.5}
        />
        <Plus
          style={{
            position: "absolute",
            right: `-${16 * scaleFactor}px`,
            bottom: `-${16 * scaleFactor}px`,
            width: `${32 * scaleFactor}px`,
            height: `${32 * scaleFactor}px`,
            color: accentColor,
            transform: `rotate(${plusRotation}deg)`,
            opacity: 0.8
          }}
          strokeWidth={0.5}
        />

        {/* Small thumbnail image inside card */}
        <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: `${4 * scaleFactor}px`, position: "relative" }}>
          <img
            src={imageUrl}
            alt="Small preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
              padding: `${8 * scaleFactor}px`,
              textAlign: "center"
            }}
          >
            <h3 style={{ fontSize: `${20 * scaleFactor}px`, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
              {authorName}
            </h3>
          </div>
        </div>
      </div>

      {/* Simulated Zoomed Overlay */}
      {overlayOpacity > 0.05 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: `rgba(0, 0, 0, ${0.9 * overlayOpacity})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            opacity: overlayOpacity,
          }}
        >
          <img
            src={imageUrl}
            alt="Zoomed preview"
            style={{
              maxWidth: "85%",
              maxHeight: "85%",
              objectFit: "contain",
              transform: `scale(${overlayImageScale})`,
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9)",
              borderRadius: `${12 * scaleFactor}px`,
              border: "1px solid rgba(255,255,255,0.08)"
            }}
          />
        </div>
      )}
    </div>
  );
}
