import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage, placeholderLogo } from "../local-placeholder";

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".ogg") ||
    cleanUrl.endsWith(".mov") ||
    url.includes("data:video/")
  );
}

interface FrameComponentProps {
  mediaUrl: string;
  className?: string;
  mediaSize: number;
  borderThickness: number;
  borderSize: number;
  showFrame: boolean;
  isHovered: boolean;
  scaleFactor: number;
}

function FrameComponent({
  mediaUrl,
  className = "",
  mediaSize = 1.0,
  borderThickness = 4,
  borderSize = 92,
  showFrame = true,
  isHovered,
  scaleFactor,
}: FrameComponentProps) {
  const isVideo = isVideoUrl(mediaUrl);

  // Border thickness scaled
  const paddedThickness = borderThickness * scaleFactor;

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-lg ${className}`}
      style={{
        border: showFrame ? `${Math.max(1, paddedThickness)}px solid rgba(255, 255, 255, ${isHovered ? 0.4 : 0.1})` : "none",
        transition: "border-color 0.4s ease",
        backgroundColor: "#0d0f14",
      }}
    >
      <div
        className="w-full h-full overflow-hidden relative"
        style={{
          padding: showFrame ? `${(100 - borderSize) / 2}%` : "0",
          width: "100%",
          height: "100%",
        }}
      >
        <div
          className="w-full h-full overflow-hidden"
          style={{
            transform: `scale(${mediaSize * (isHovered ? 1.05 : 1.0)})`,
            transformOrigin: "center",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            width: "100%",
            height: "100%",
          }}
        >
          {isVideo ? (
            <video
              className="w-full h-full object-cover animate-none"
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              className="w-full h-full object-cover"
              src={mediaUrl}
              alt=""
              loading="lazy"
            />
          )}
        </div>
      </div>

      {/* Cyber/HUD Corner Accents */}
      {showFrame && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* Top Left Accent */}
          <div
            className="absolute top-2 left-2 border-t border-l"
            style={{
              borderColor: isHovered ? "#38bdf8" : "rgba(255, 255, 255, 0.3)",
              borderWidth: `${Math.max(1, 2 * scaleFactor)}px`,
              width: `${12 * scaleFactor}px`,
              height: `${12 * scaleFactor}px`,
              transition: "border-color 0.4s ease",
            }}
          />
          {/* Top Right Accent */}
          <div
            className="absolute top-2 right-2 border-t border-r"
            style={{
              borderColor: isHovered ? "#38bdf8" : "rgba(255, 255, 255, 0.3)",
              borderWidth: `${Math.max(1, 2 * scaleFactor)}px`,
              width: `${12 * scaleFactor}px`,
              height: `${12 * scaleFactor}px`,
              transition: "border-color 0.4s ease",
            }}
          />
          {/* Bottom Left Accent */}
          <div
            className="absolute bottom-2 left-2 border-b border-l"
            style={{
              borderColor: isHovered ? "#38bdf8" : "rgba(255, 255, 255, 0.3)",
              borderWidth: `${Math.max(1, 2 * scaleFactor)}px`,
              width: `${12 * scaleFactor}px`,
              height: `${12 * scaleFactor}px`,
              transition: "border-color 0.4s ease",
            }}
          />
          {/* Bottom Right Accent */}
          <div
            className="absolute bottom-2 right-2 border-b border-r"
            style={{
              borderColor: isHovered ? "#38bdf8" : "rgba(255, 255, 255, 0.3)",
              borderWidth: `${Math.max(1, 2 * scaleFactor)}px`,
              width: `${12 * scaleFactor}px`,
              height: `${12 * scaleFactor}px`,
              transition: "border-color 0.4s ease",
            }}
          />
        </div>
      )}

      {/* Active Glowing Overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isHovered ? 0.15 : 0,
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

export function DynamicFrameLayoutTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read Controls
  const cycleDuration = Math.max(0.5, Number(values.cycleDuration ?? 2.5));
  const hoverSize = Math.min(10, Math.max(4, Number(values.hoverSize ?? 6.0)));
  const gapSize = Math.max(0, Number(values.gapSize ?? 12.0));
  const showFrames = values.showFrames !== false;
  const borderThickness = Number(values.borderThickness ?? 2.0);
  const borderSize = Math.min(100, Math.max(50, Number(values.borderSize ?? 92.0)));
  const mediaSize = Number(values.mediaSize ?? 1.0);

  const media1 = String(values.media1 ?? placeholderImage("xportedmp4"));
  const media2 = String(values.media2 ?? placeholderImage("matfitcrop"));
  const media3 = String(values.media3 ?? placeholderImage("0Postermp4"));
  const media4 = String(values.media4 ?? placeholderImage("matfitcrop"));
  const media5 = String(values.media5 ?? placeholderLogo("xportedmp4"));
  const media6 = String(values.media6 ?? placeholderImage("matfitcrop"));
  const media7 = String(values.media7 ?? placeholderImage("matfitcrop"));
  const media8 = String(values.media8 ?? placeholderImage("xportedmp4"));
  const media9 = String(values.media9 ?? placeholderImage("matfitcrop"));

  const mediaList = useMemo(() => {
    return [media1, media2, media3, media4, media5, media6, media7, media8, media9];
  }, [media1, media2, media3, media4, media5, media6, media7, media8, media9]);

  // Compute active item index from time
  const totalDuration = 9 * cycleDuration;
  const activeTime = time % totalDuration;
  const activeIndex = Math.floor(activeTime / cycleDuration);

  const activeRow = Math.floor(activeIndex / 3);
  const activeCol = activeIndex % 3;

  // Grid sizing calculations
  const getRowSizes = () => {
    const nonHoveredSize = (12 - hoverSize) / 2;
    return [0, 1, 2].map((r) => (r === activeRow ? `${hoverSize}fr` : `${nonHoveredSize}fr`)).join(" ");
  };

  const getColSizes = () => {
    const nonHoveredSize = (12 - hoverSize) / 2;
    return [0, 1, 2].map((c) => (c === activeCol ? `${hoverSize}fr` : `${nonHoveredSize}fr`)).join(" ");
  };

  // Scaling Factor
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#06070a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateRows: getRowSizes(),
          gridTemplateColumns: getColSizes(),
          gap: `${gapSize * scaleFactor}px`,
          padding: `${24 * scaleFactor}px`,
          transition: "grid-template-rows 0.6s cubic-bezier(0.16, 1, 0.3, 1), grid-template-columns 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          boxSizing: "border-box",
        }}
      >
        {mediaList.map((url, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          const isHovered = row === activeRow && col === activeCol;

          return (
            <div key={index} className="relative w-full h-full">
              <FrameComponent
                mediaUrl={url}
                mediaSize={mediaSize}
                borderThickness={borderThickness}
                borderSize={borderSize}
                showFrame={showFrames}
                isHovered={isHovered}
                scaleFactor={scaleFactor}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DynamicFrameLayoutTemplate;
