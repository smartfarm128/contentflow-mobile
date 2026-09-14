import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

const defaultImages = [
  placeholderImage("matfitcrop"),
  placeholderImage("matfitcrop"),
  placeholderImage("matfitcrop"),
  placeholderImage("matfitcrop"),
];

export function ImagePlayerTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const imagesVal = String(values.images ?? "");
  const interval = Number(values.interval ?? 300);
  const backgroundColor = String(values.backgroundColor ?? "#000000");

  const images = imagesVal
    ? imagesVal.split(",").map(img => img.trim()).filter(Boolean)
    : defaultImages;

  const imgCount = images.length;
  const currentIndex = imgCount > 0 
    ? Math.floor((time * 1000) / interval) % imgCount
    : 0;

  const currentImage = images[currentIndex] || "";

  const scaleFactor = Math.min(width, height) / 400;

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
      }}
    >
      {currentImage ? (
        <img
          src={currentImage}
          alt={`Slide ${currentIndex}`}
          style={{
            width: `${340 * scaleFactor}px`,
            height: `${260 * scaleFactor}px`,
            objectFit: "cover",
            borderRadius: `${16 * scaleFactor}px`,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.6)"
          }}
        />
      ) : (
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
          No images configured
        </div>
      )}
    </div>
  );
}
