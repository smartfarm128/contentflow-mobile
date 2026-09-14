import type { HtmlTemplateProps } from "../types";

export function CircularGalleryTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const radius = Number(values.radius ?? 600);
  const speed = Number(values.speed ?? 30.0); // degrees per second
  const imagesCsv = String(values.images ?? "");

  const scale = Math.min(width, height) / 1080;
  const scaledRadius = radius * scale;
  const cardWidth = 300 * scale;
  const cardHeight = 400 * scale;

  const defaultItems = [
    { common: 'Lion', binomial: 'Panthera leo', photo: { url: 'https://images.unsplash.com/photo-1583499871880-de841d1ace2a?w=900&auto=format&fit=crop&q=80', by: 'Clément Roy' } },
    { common: 'Asiatic elephant', binomial: 'Elephas maximus', photo: { url: 'https://images.unsplash.com/photo-1571406761758-9a3eed5338ef?w=900&auto=format&fit=crop&q=80', by: 'Alex Azabache' } },
    { common: 'Red-tailed black cockatoo', binomial: 'Calyptorhynchus banksii', photo: { url: 'https://images.unsplash.com/photo-1619664208054-41eefeab29e9?w=900&auto=format&fit=crop&q=80', by: 'David Clode' } },
    { common: 'Dromedary', binomial: 'Camelus dromedarius', photo: { url: 'https://images.unsplash.com/photo-1662841238473-f4b137e123cb?w=900&auto=format&fit=crop&q=80', by: 'Moaz Tobok' } },
    { common: 'Polar bear', binomial: 'Ursus maritimus', photo: { url: 'https://images.unsplash.com/photo-1589648751789-c8ecb7a88bd5?w=900&auto=format&fit=crop&q=80', by: 'Hans-Jurgen Mager' } },
    { common: 'Giant panda', binomial: 'Ailuropoda melanoleuca', photo: { url: 'https://images.unsplash.com/photo-1659540181281-1d89d6112832?w=900&auto=format&fit=crop&q=80', by: 'Jiachen Lin' } },
    { common: 'Grévy\'s zebra', binomial: 'Equus grevyi', photo: { url: 'https://images.unsplash.com/photo-1526095179574-86e545346ae6?w=900&auto=format&fit=crop&q=80', by: 'Jeff Griffith' } },
    { common: 'Cheetah', binomial: 'Acinonyx jubatus', photo: { url: 'https://images.unsplash.com/photo-1541707519942-08fd2f6480ba?w=900&auto=format&fit=crop&q=80', by: 'Mike Bird' } }
  ];

  let items = defaultItems;
  if (imagesCsv.trim()) {
    const urls = imagesCsv.split(",").map(u => u.trim()).filter(Boolean);
    if (urls.length > 0) {
      items = urls.map((url, idx) => ({
        common: `Item ${idx + 1}`,
        binomial: `Exotic Specimen`,
        photo: { url, by: "Unsplash" }
      }));
    }
  }

  // Playhead-driven rotation angle
  const rotation = time * speed;
  const anglePerItem = 360 / items.length;

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
        perspective: `${2000 * scale}px`,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* 3D cylindrical gallery ring */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transform: `rotateY(${rotation}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {items.map((item, i) => {
          const itemAngle = i * anglePerItem;
          // Calculate relative angle to active front to determine opacity
          const totalRotation = rotation % 360;
          const relativeAngle = (itemAngle + totalRotation + 360) % 360;
          const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
          // Highlight cards facing the viewer, fade out cards at the back
          const opacity = Math.max(0.2, 1 - (normalizedAngle / 150));

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: cardWidth,
                height: cardHeight,
                transform: `rotateY(${itemAngle}deg) translateZ(${scaledRadius}px)`,
                left: "50%",
                top: "50%",
                marginLeft: -cardWidth / 2,
                marginTop: -cardHeight / 2,
                opacity: opacity,
                // Hide backward facing cards to prevent z-fighting issues
                backfaceVisibility: "hidden",
              }}
            >
              {/* Premium Glass Card Layout */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  borderRadius: `${16 * scale}px`,
                  overflow: "hidden",
                  border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
                  background: "rgba(15, 23, 42, 0.3)",
                  backdropFilter: "blur(12px)",
                  boxShadow: `0 ${10 * scale}px ${25 * scale}px rgba(0, 0, 0, 0.5)`,
                }}
              >
                {/* Main Card Image */}
                <img
                  src={item.photo.url}
                  alt={item.common}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                {/* Info Text Overlay */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: `${20 * scale}px`,
                    background: "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)",
                    display: "flex",
                    flexDirection: "column",
                    gap: `${2 * scale}px`,
                  }}
                >
                  <span
                    style={{
                      fontSize: `${20 * scale}px`,
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    {item.common}
                  </span>
                  <span
                    style={{
                      fontSize: `${14 * scale}px`,
                      fontStyle: "italic",
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    {item.binomial}
                  </span>
                  <span
                    style={{
                      fontSize: `${11 * scale}px`,
                      color: "rgba(255, 255, 255, 0.5)",
                      marginTop: `${6 * scale}px`,
                    }}
                  >
                    Photo by: {item.photo.by}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
