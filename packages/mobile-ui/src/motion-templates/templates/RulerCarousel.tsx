import type { HtmlTemplateProps } from "../types";

export function RulerCarouselTemplate({ time, width, values }: HtmlTemplateProps) {
  const itemsStr = String(values.items ?? "NIKE, ALO, CONVERSE, UNIQLO, ON CLOUD, ADIDAS, PUMA, REEBOK");
  const slideDuration = Number(values.slideDuration ?? 2.5);
  const accentColor = String(values.accentColor ?? "#ffffff");
  const mutedColor = String(values.mutedColor ?? "#6b7280");

  const originalItems = itemsStr.split(",").map((s, idx) => ({
    id: idx,
    title: s.trim(),
  })).filter(item => item.title.length > 0);

  const totalItems = originalItems.length;
  if (totalItems === 0) return null;

  const scale = width / 1920;
  const itemWidth = 500 * scale;

  // 1. Double the array size or triplicate to simulate looping
  const duplicatedItems = [...originalItems, ...originalItems, ...originalItems];
  const itemsPerSet = totalItems;
  const middleSetOffset = itemsPerSet; // Start indexing from the middle copy

  // 2. Playhead-driven active index math (loops continuously)
  const totalDuration = totalItems * slideDuration;
  const timelineProgress = (time % totalDuration) / totalDuration; // 0 to 1
  const itemProgress = timelineProgress * totalItems; // 0 to totalItems
  const index = Math.floor(itemProgress);
  const frac = itemProgress - index;

  // Easing function for quick snapping slide transitions
  const transitionPct = 0.25; // 25% of slide time spent transitioning
  let easedFrac = 0;
  if (frac > (1 - transitionPct)) {
    const t = (frac - (1 - transitionPct)) / transitionPct;
    easedFrac = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Active index maps to the middle set
  const activeIndexFloat = middleSetOffset + index + easedFrac;

  // Horizontal offset to center the active item (middle is at translateX = 0)
  // When activeIndexFloat = middleSetOffset, translateX is 0
  const trackX = -(activeIndexFloat - middleSetOffset) * itemWidth;

  // Helper component to render Ruler tick lines
  const renderRuler = (top: boolean) => {
    const totalLines = 101;
    const lineSpacing = 100 / (totalLines - 1);
    const lines = [];

    for (let i = 0; i < totalLines; i++) {
      const isFifth = i % 5 === 0;
      const isCenter = i === Math.floor(totalLines / 2);

      let lineHeight = 12 * scale;
      let color = mutedColor;

      if (isCenter) {
        lineHeight = 32 * scale;
        color = accentColor;
      } else if (isFifth) {
        lineHeight = 18 * scale;
        color = accentColor;
      }

      lines.push(
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${2 * scale}px`,
            height: `${lineHeight}px`,
            backgroundColor: color,
            left: `${i * lineSpacing}%`,
            top: top ? 0 : "auto",
            bottom: top ? "auto" : 0,
            transform: "translateX(-50%)",
            opacity: isCenter ? 1.0 : 0.4,
          }}
        />
      );
    }
    return (
      <div style={{ position: "relative", width: "100%", height: `${32 * scale}px` }}>
        {lines}
      </div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Outer wrapper with fixed bounds */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: `${40 * scale}px`,
        }}
      >
        {/* Top Ruler Row */}
        {renderRuler(true)}

        {/* Sliding Items Container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: `${140 * scale}px`,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Track sliding via direct layout coordinate */}
          <div
            style={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              transform: `translateX(${trackX}px)`,
              height: "100%",
            }}
          >
            {duplicatedItems.map((item, idx) => {
              const distance = Math.abs(idx - activeIndexFloat);
              // Scaling and opacity falloff based on proximity to center
              const itemScale = Math.max(0.65, 1 - Math.min(1.2, distance) * 0.35);
              const opacity = Math.max(0.25, 1 - Math.min(1.2, distance) * 0.7);
              const isCenter = distance < 0.5;

              return (
                <div
                  key={idx}
                  style={{
                    width: itemWidth,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: opacity,
                    transform: `scale(${itemScale})`,
                  }}
                >
                  <span
                    style={{
                      fontSize: `${64 * scale}px`,
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      whiteSpace: "nowrap",
                      color: isCenter ? accentColor : "#4b5563",
                      textShadow: isCenter ? `0 0 ${20 * scale}px ${accentColor}20` : "none",
                    }}
                  >
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Ruler Row */}
        {renderRuler(false)}
      </div>

      {/* Center indicator dot */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: `${8 * scale}px`,
          height: `${8 * scale}px`,
          borderRadius: "50%",
          backgroundColor: accentColor,
          boxShadow: `0 0 ${16 * scale}px ${accentColor}`,
          pointerEvents: "none",
          zIndex: 20,
        }}
      />
    </div>
  );
}
