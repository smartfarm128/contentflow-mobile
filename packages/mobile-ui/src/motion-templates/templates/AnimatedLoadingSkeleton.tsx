import type { HtmlTemplateProps } from "../types";
import { motion } from "framer-motion";

export function AnimatedLoadingSkeletonTemplate({ progress, time, width, height }: HtmlTemplateProps) {
  // Fix the coordinate system at a logical layout size, say 800x540
  const layoutWidth = 800;
  const layoutHeight = 540;

  // Static centers of cards in a 3-column layout
  // Column x steps: 40, 290, 540 (width 220)
  // Row y steps: 40, 290 (height 210)
  const cards = [
    { x: 40, y: 40, w: 220, h: 210 },
    { x: 290, y: 40, w: 220, h: 210 },
    { x: 540, y: 40, w: 220, h: 210 },
    { x: 40, y: 290, w: 220, h: 210 },
    { x: 290, y: 290, w: 220, h: 210 },
    { x: 540, y: 290, w: 220, h: 210 },
  ];

  // Predefined deterministic path for the search icon to hover over
  const path = [
    { x: 150, y: 145 }, // Card 0 center
    { x: 400, y: 145 }, // Card 1 center
    { x: 650, y: 395 }, // Card 5 center
    { x: 150, y: 395 }, // Card 3 center
    { x: 150, y: 145 }, // Loop back to start
  ];

  // Interpolate position along the path based on progress (0 to 1)
  const numSegments = path.length - 1;
  const rawIdx = progress * numSegments;
  const idx = Math.min(Math.floor(rawIdx), numSegments - 1);
  const localT = rawIdx - idx;

  const startPoint = path[idx];
  const endPoint = path[idx + 1];

  const searchX = startPoint.x + (endPoint.x - startPoint.x) * localT;
  const searchY = startPoint.y + (endPoint.y - startPoint.y) * localT;

  // Pulsing skeleton opacity based on deterministic time
  const pulseOpacity = 0.4 + 0.3 * Math.sin(time * 3);

  const scale = Math.min(width, height) / 1080;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${layoutWidth}px`,
          height: `${layoutHeight}px`,
          position: "relative",
          transform: `scale(${scale * 1.8})`,
          transformOrigin: "center",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          padding: "32px",
        }}
      >
        {/* Animated Search Icon Overlay */}
        <div
          style={{
            position: "absolute",
            left: `${searchX - 24}px`,
            top: `${searchY - 24}px`,
            zIndex: 10,
            pointerEvents: "none",
            transform: "scale(1.2)",
            transition: "transform 0.1s ease",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              padding: "12px",
              borderRadius: "50%",
              backdropFilter: "blur(4px)",
              boxShadow: `0 0 ${15 + Math.sin(time * 6) * 5}px rgba(59, 130, 246, 0.4)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              style={{ width: "24px", height: "24px", color: "#2563eb" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            height: "100%",
            width: "100%",
          }}
        >
          {cards.map((card, i) => {
            // Check if search glass is currently hovering over this card
            const dx = searchX - (card.x + card.w / 2);
            const dy = searchY - (card.y + card.h / 2);
            const isTarget = Math.sqrt(dx * dx + dy * dy) < 120;

            return (
              <motion.div
                key={i}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #f1f5f9",
                  boxShadow: isTarget ? "0 8px 20px rgba(59, 130, 246, 0.08)" : "0 2px 4px rgba(0,0,0,0.02)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  transform: isTarget ? "scale(1.025)" : "scale(1.0)",
                  borderColor: isTarget ? "#bfdbfe" : "#f1f5f9",
                  transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                {/* Main Card Image Placeholder */}
                <div
                  style={{
                    height: "100px",
                    borderRadius: "8px",
                    backgroundColor: "#f1f5f9",
                    opacity: isTarget ? 0.95 : pulseOpacity,
                    transition: "opacity 0.2s ease",
                  }}
                />

                {/* Text Line 1 */}
                <div
                  style={{
                    height: "12px",
                    width: "75%",
                    borderRadius: "4px",
                    backgroundColor: "#e2e8f0",
                    opacity: isTarget ? 0.95 : pulseOpacity,
                    transition: "opacity 0.2s ease",
                  }}
                />

                {/* Text Line 2 */}
                <div
                  style={{
                    height: "12px",
                    width: "50%",
                    borderRadius: "4px",
                    backgroundColor: "#e2e8f0",
                    opacity: isTarget ? 0.95 : pulseOpacity,
                    transition: "opacity 0.2s ease",
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AnimatedLoadingSkeletonTemplate;
