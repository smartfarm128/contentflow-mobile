import type { HtmlTemplateProps } from "../types";

export function GradientSelectorCardTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 6.0);
  const speed = Number(values.speed ?? 1.0);
  const titleText = String(values.title ?? "FUNDING STAGE");

  const scale = Math.min(width, height) / 1080;
  const cardWidth = 720 * scale;
  const cardHeight = 360 * scale;
  const bubbleSize = 36 * scale;
  const lineLength = 110 * scale;

  const options = [
    { label: "$100K", color: "#3b82f6" },
    { label: "$1M", color: "#6366f1" },
    { label: "$5M", color: "#8b5cf6" },
    { label: "$10M+", color: "#a855f7" }
  ];

  // Continuous floating selection index (0.0 to 3.0)
  const selectProgress = ((time * speed) / cycleDuration) % 1.0;
  const floatIndex = selectProgress * options.length;
  const activeIndex = Math.min(options.length - 1, Math.floor(floatIndex));

  // Orbital dots around selected bubble
  const orbitDotsCount = 12;
  const orbitRadius = 24 * scale;

  // Let's compute exact horizontal center coordinates for bubbles
  // Total width of row is: 4 * bubbleSize + 3 * lineLength
  const rowWidth = options.length * bubbleSize + (options.length - 1) * lineLength;
  const startX = (cardWidth - rowWidth) / 2;

  // Active bubble coordinates
  const activeBubbleX = startX + activeIndex * (bubbleSize + lineLength) + bubbleSize / 2;
  const activeBubbleY = 160 * scale; // row y-center

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
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          width: cardWidth,
          height: cardHeight,
          background: "rgba(15, 23, 42, 0.6)",
          border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.08)`,
          borderRadius: `${24 * scale}px`,
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Radial Ambient Glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at ${activeBubbleX}px ${activeBubbleY}px, ${options[activeIndex].color}1a 0%, ${options[activeIndex].color}05 40%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {titleText && (
          <div
            style={{
              position: "absolute",
              top: `${40 * scale}px`,
              fontSize: `${16 * scale}px`,
              fontWeight: 800,
              color: "#64748b",
              letterSpacing: "0.2em",
              zIndex: 5,
            }}
          >
            {titleText}
          </div>
        )}

        {/* Orbiting Dots Container */}
        <div
          style={{
            position: "absolute",
            top: activeBubbleY,
            left: activeBubbleX,
            width: 0,
            height: 0,
            zIndex: 10,
          }}
        >
          {Array.from({ length: orbitDotsCount }).map((_, i) => {
            const angle = (i / orbitDotsCount) * 2 * Math.PI + time * 2.5;
            const x = Math.cos(angle) * orbitRadius;
            const y = Math.sin(angle) * orbitRadius;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: `${6 * scale}px`,
                  height: `${6 * scale}px`,
                  backgroundColor: options[activeIndex].color,
                  borderRadius: "50%",
                  transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                  boxShadow: `0 0 ${8 * scale}px ${options[activeIndex].color}`,
                }}
              />
            );
          })}
        </div>

        {/* Option Bubbles and Lines Row */}
        <div
          style={{
            position: "relative",
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            width: rowWidth,
            justifyContent: "space-between",
          }}
        >
          {options.map((option, idx) => {
            const isActive = idx === activeIndex;
            const isPassedOrActive = idx <= activeIndex;

            // Connective line to next bubble
            const nextOption = options[idx + 1];
            // Continuous reveal for line idx
            const lineProgress = Math.max(0, Math.min(1, floatIndex - idx));
            const bgGrad = nextOption
              ? `linear-gradient(to right, ${option.color} 0%, ${option.color} ${lineProgress * 100}%, #475569 ${lineProgress * 100}%, #475569 100%)`
              : "#475569";

            return (
              <div key={idx} style={{ display: "flex", alignItems: "center" }}>
                {/* Bubble */}
                <div
                  style={{
                    width: bubbleSize,
                    height: bubbleSize,
                    borderRadius: "50%",
                    backgroundColor: isPassedOrActive ? option.color : "#475569",
                    border: `${2.5 * scale}px solid #09090b`,
                    boxShadow: isPassedOrActive
                      ? `0 0 ${20 * scale}px ${option.color}66`
                      : "none",
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                    transition: "background-color 0.2s, transform 0.2s, box-shadow 0.2s",
                  }}
                />

                {/* Line */}
                {idx < options.length - 1 && (
                  <div
                    style={{
                      width: lineLength,
                      height: `${4 * scale}px`,
                      borderRadius: `${2 * scale}px`,
                      background: bgGrad,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Labels Row */}
        <div
          style={{
            position: "absolute",
            bottom: `${60 * scale}px`,
            display: "flex",
            justifyContent: "space-between",
            width: rowWidth,
            zIndex: 5,
          }}
        >
          {options.map((option, idx) => {
            const isPassedOrActive = idx <= activeIndex;
            return (
              <div
                key={idx}
                style={{
                  width: bubbleSize,
                  textAlign: "center",
                  fontSize: `${16 * scale}px`,
                  fontWeight: 600,
                  color: isPassedOrActive ? option.color : "#64748b",
                  textShadow: isPassedOrActive
                    ? `0 0 ${10 * scale}px ${option.color}22`
                    : "none",
                  transition: "color 0.2s",
                  whiteSpace: "nowrap",
                  transform: "translateX(-25%)",
                }}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
