import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

interface MediaItemType {
  id: number;
  type: "image" | "video";
  title: string;
  desc: string;
  url: string;
  gridStyle: {
    gridColumn: string;
    gridRow: string;
  };
}

export function InteractiveBentoGalleryTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const title = String(values.title ?? "Gallery Shots Collection");
  const description = String(values.description ?? "Explore our curated collection of stunning visual moments");
  const cyclePeriod = Math.max(1, Number(values.cyclePeriod ?? 3.5)); // Seconds per card showcase

  // Determine scaling factor relative to 1080p composition height
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Stagger grid intro (0 to 1 seconds)
  const introProgress = Math.min(1, time / 1.0);

  // Compute active showcase item based on time
  const activeTime = time - 1.0;
  const mediaItems = useMemo<MediaItemType[]>(() => [
    {
      id: 1,
      type: "image",
      title: String(values.title1 ?? "Vibrant Forest Path"),
      desc: String(values.desc1 ?? "Mystical forest trail under golden morning sunlight."),
      url: String(values.image1 ?? placeholderImage("matfitcrop")),
      gridStyle: { gridColumn: "span 1", gridRow: "span 3" },
    },
    {
      id: 2,
      type: "image",
      title: String(values.title2 ?? "Mountain Lake"),
      desc: String(values.desc2 ?? "Crystal clear water reflecting snow capped alpine peaks."),
      url: String(values.image2 ?? placeholderImage("matfitcrop")),
      gridStyle: { gridColumn: "span 2", gridRow: "span 2" },
    },
    {
      id: 3,
      type: "image",
      title: String(values.title3 ?? "Ocean Breeze"),
      desc: String(values.desc3 ?? "Soft turquoise waves crashing gently on a sandy tropical beach."),
      url: String(values.image3 ?? placeholderImage("matfitcrop")),
      gridStyle: { gridColumn: "span 1", gridRow: "span 3" },
    },
    {
      id: 4,
      type: "image",
      title: String(values.title4 ?? "Golden Desert"),
      desc: String(values.desc4 ?? "Rolling sand dunes glowing orange under the setting sun."),
      url: String(values.image4 ?? placeholderImage("matfitcrop")),
      gridStyle: { gridColumn: "span 2", gridRow: "span 2" },
    },
    {
      id: 5,
      type: "image",
      title: String(values.title5 ?? "Neon Tokyo"),
      desc: String(values.desc5 ?? "Bustling city streets illuminated by colorful neon advertisements."),
      url: String(values.image5 ?? placeholderImage("matfitcrop")),
      gridStyle: { gridColumn: "span 1", gridRow: "span 3" },
    },
    {
      id: 6,
      type: "image",
      title: String(values.title6 ?? "Starlit Sky"),
      desc: String(values.desc6 ?? "The Milky Way galaxy shining bright over a quiet pine forest."),
      url: String(values.image6 ?? placeholderImage("matfitcrop")),
      gridStyle: { gridColumn: "span 2", gridRow: "span 2" },
    },
  ], [
    values.image1, values.title1, values.desc1,
    values.image2, values.title2, values.desc2,
    values.image3, values.title3, values.desc3,
    values.image4, values.title4, values.desc4,
    values.image5, values.title5, values.desc5,
    values.image6, values.title6, values.desc6,
  ]);

  let selectedItem: MediaItemType | null = null;
  let modalProgress = 0; // 0 to 1

  if (activeTime >= 0 && time < 22.0) {
    const itemIndex = Math.floor(activeTime / cyclePeriod);
    const timeInCycle = activeTime % cyclePeriod;

    if (itemIndex >= 0 && itemIndex < mediaItems.length) {
      selectedItem = mediaItems[itemIndex];
      // Define entry/exit transitions for the modal
      if (timeInCycle < 0.4) {
        modalProgress = timeInCycle / 0.4;
      } else if (timeInCycle > cyclePeriod - 0.4) {
        modalProgress = (cyclePeriod - timeInCycle) / 0.4;
      } else {
        modalProgress = 1;
      }
    }
  }

  // Layout calculations
  const gap = Math.max(4, 16 * scaleFactor * 1.5);
  const rowHeight = Math.max(15, 75 * scaleFactor * 1.5);

  const containerPadding = Math.max(12, 32 * scaleFactor * 1.5);
  const titleFontSize = Math.max(16, 44 * scaleFactor * 2.2);
  const descFontSize = Math.max(12, 20 * scaleFactor * 2.2);

  // Grid styling when modal is open
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridAutoRows: `${rowHeight}px`,
    gap: `${gap}px`,
    width: "100%",
    maxWidth: `${900 * scaleFactor * 1.5}px`,
    transition: "opacity 0.3s, filter 0.3s, transform 0.3s",
    opacity: introProgress * (1 - 0.85 * modalProgress),
    filter: `blur(${modalProgress * 6}px)`,
    transform: `scale(${1 - 0.05 * modalProgress})`,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: `${containerPadding}px`,
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header section (fades out when modal is open) */}
      <div
        style={{
          textAlign: "center",
          marginBottom: `${Math.max(10, 32 * scaleFactor * 1.5)}px`,
          opacity: 1 - modalProgress,
          transition: "opacity 0.3s",
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            fontSize: `${titleFontSize}px`,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: `${descFontSize}px`,
            color: "rgba(255, 255, 255, 0.6)",
            marginTop: `${8 * scaleFactor}px`,
            marginRight: 0,
            marginLeft: 0,
            marginBottom: 0,
          }}
        >
          {description}
        </p>
      </div>

      {/* Bento Grid */}
      <div style={gridStyle}>
        {mediaItems.map((item: MediaItemType, index: number) => {
          // Stagger card pop-in during first second
          const staggerDelay = index * 0.05;
          const cardProgress = Math.max(0, Math.min(1, (time - staggerDelay) / 0.6));
          const cardScale = 0.9 + 0.1 * cardProgress;
          const cardOpacity = cardProgress;

          return (
            <div
              key={item.id}
              style={{
                position: "relative",
                borderRadius: `${12 * scaleFactor * 1.5}px`,
                overflow: "hidden",
                cursor: "pointer",
                gridColumn: item.gridStyle.gridColumn,
                gridRow: item.gridStyle.gridRow,
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                transform: `scale(${cardScale})`,
                opacity: cardOpacity,
              }}
            >
              <img
                src={item.url}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {/* Fade gradient overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Modal View Detail */}
      {selectedItem && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: modalProgress,
            transform: `scale(${0.95 + 0.05 * modalProgress})`,
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          {/* Modal Container */}
          <div
            style={{
              position: "relative",
              width: "85%",
              maxWidth: `${800 * scaleFactor * 1.5}px`,
              aspectRatio: "16 / 9",
              borderRadius: `${16 * scaleFactor * 1.5}px`,
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              backgroundColor: "rgba(20, 20, 20, 0.95)",
            }}
          >
            <img
              src={selectedItem.url}
              alt={selectedItem.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Dark gradient text cover */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: `${24 * scaleFactor * 1.5}px`,
                background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 100%)",
              }}
            >
              <h3
                style={{
                  color: "#ffffff",
                  fontSize: `${Math.max(14, 32 * scaleFactor * 1.5)}px`,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {selectedItem.title}
              </h3>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: `${Math.max(10, 18 * scaleFactor * 1.5)}px`,
                  marginTop: `${6 * scaleFactor}px`,
                  marginBottom: 0,
                  lineHeight: 1.4,
                }}
              >
                {selectedItem.desc}
              </p>
            </div>
          </div>

          {/* Draggable Dock Mockup */}
          <div
            style={{
              marginTop: `${Math.max(10, 32 * scaleFactor * 1.5)}px`,
              display: "flex",
              alignItems: "center",
              gap: `${8 * scaleFactor}px`,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: `${16 * scaleFactor * 1.5}px`,
              padding: `${10 * scaleFactor}px ${16 * scaleFactor}px`,
              backdropFilter: "blur(12px)",
            }}
          >
            {mediaItems.map((dockItem: MediaItemType) => {
              const isActive = selectedItem?.id === dockItem.id;
              return (
                <div
                  key={dockItem.id}
                  style={{
                    width: `${Math.max(15, 42 * scaleFactor * 1.5)}px`,
                    height: `${Math.max(15, 42 * scaleFactor * 1.5)}px`,
                    borderRadius: `${8 * scaleFactor * 1.5}px`,
                    overflow: "hidden",
                    border: isActive ? "2px solid #ffffff" : "1px solid rgba(255,255,255,0.2)",
                    transform: isActive ? "translateY(-4px)" : "none",
                    transition: "transform 0.2s, border-color 0.2s",
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  <img
                    src={dockItem.url}
                    alt={dockItem.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export default InteractiveBentoGalleryTemplate;
