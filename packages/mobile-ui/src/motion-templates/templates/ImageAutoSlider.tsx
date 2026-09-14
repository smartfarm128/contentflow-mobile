import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function ImageAutoSliderTemplate({
  progress,
  width,
  height,
  values,
}: HtmlTemplateProps) {
  const scaleFactor = Math.min(width, height) / 1080;
  const imageSize = 250 * scaleFactor;
  const gap = 24 * scaleFactor;

  const images = [
    String(values.image1 ?? placeholderImage("matfitcrop")),
    String(values.image2 ?? placeholderImage("matfitcrop")),
    String(values.image3 ?? placeholderImage("matfitcrop")),
    String(values.image4 ?? placeholderImage("matfitcrop")),
    String(values.image5 ?? placeholderImage("matfitcrop")),
    String(values.image6 ?? placeholderImage("matfitcrop")),
    String(values.image7 ?? placeholderImage("matfitcrop")),
    String(values.image8 ?? placeholderImage("matfitcrop")),
  ];

  // Repeat for a seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Background radial gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, rgba(16,16,16,1) 0%, rgba(0,0,0,1) 100%)",
          zIndex: 0,
        }}
      />

      {/* Scrolling images container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)",
          maskImage: "linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: `${gap}px`,
            width: "max-content",
            // Translate exactly half the width for the loop
            transform: `translate3d(-${progress * 50}%, 0, 0)`,
            transition: "none",
          }}
        >
          {duplicatedImages.map((image, idx) => (
            <div
              key={idx}
              style={{
                flexShrink: 0,
                width: `${imageSize}px`,
                height: `${imageSize}px`,
                borderRadius: `${16 * scaleFactor}px`,
                overflow: "hidden",
                boxShadow: "0 10px 35px rgba(0, 0, 0, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <img
                src={image}
                alt={`Slide ${idx}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
