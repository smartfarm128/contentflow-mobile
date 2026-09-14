import type { HtmlTemplateProps } from "../types";

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
    String(values.image1 ?? "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=640&auto=format&fit=crop"),
    String(values.image2 ?? "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=640&auto=format&fit=crop"),
    String(values.image3 ?? "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=640&auto=format&fit=crop"),
    String(values.image4 ?? "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?q=80&w=640&auto=format&fit=crop"),
    String(values.image5 ?? "https://plus.unsplash.com/premium_photo-1673264933212-d78737f38e48?q=80&w=640&auto=format&fit=crop"),
    String(values.image6 ?? "https://plus.unsplash.com/premium_photo-1711434824963-ca894373272e?q=80&w=640&auto=format&fit=crop"),
    String(values.image7 ?? "https://plus.unsplash.com/premium_photo-1675705721263-0bbeec261c49?q=80&w=640&auto=format&fit=crop"),
    String(values.image8 ?? "https://images.unsplash.com/photo-1524799526615-766a9833dec0?q=80&w=640&auto=format&fit=crop"),
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
