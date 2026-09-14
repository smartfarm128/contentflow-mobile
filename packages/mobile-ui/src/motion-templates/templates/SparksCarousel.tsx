import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

const defaultSparks = [
  { id: 1, imageSrc: placeholderImage("160fitcrop"), title: "Gen 2: Crypto is here to stay", count: 19, countLabel: "NO. OF SYMBOLS" },
  { id: 2, imageSrc: placeholderImage("160fitcrop"), title: "Proof of Work: Embracing the crunch", count: 27, countLabel: "NO. OF SYMBOLS" },
  { id: 3, imageSrc: placeholderImage("160fitcrop"), title: "Smart contracts: Make the smart move", count: 36, countLabel: "NO. OF SYMBOLS" },
  { id: 4, imageSrc: placeholderImage("160fitcrop"), title: "Web3 Infrastructure: The frontier", count: 42, countLabel: "NO. OF SYMBOLS" }
];

export function SparksCarouselTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Sparks");
  const subtitle = String(values.subtitle ?? "Curated watchlists where ETHUSD is featured.");
  const cycleDuration = Number(values.cycleDuration ?? 8.0);
  const backgroundColor = String(values.backgroundColor ?? "#09090b");
  const cardBg = String(values.cardBg ?? "#18181b");
  const textColor = String(values.textColor ?? "#ffffff");

  const t = time % cycleDuration;
  const cardWidth = 280;
  const gap = 16;
  const step = cardWidth + gap;

  // Timed scroll positions
  let scrollX = 0;
  const transitions = [
    { startT: 1.2, endT: 1.6, startX: 0, endX: step },
    { startT: 2.8, endT: 3.2, startX: step, endX: step * 2 },
    { startT: 4.4, endT: 4.8, startX: step * 2, endX: step * 3 }
  ];

  for (const trans of transitions) {
    if (t >= trans.startT && t < trans.endT) {
      const f = (t - trans.startT) / (trans.endT - trans.startT);
      scrollX = trans.startX + (trans.endX - trans.startX) * f;
    } else if (t >= trans.endT) {
      scrollX = trans.endX;
    }
  }

  let globalOpacity = 1.0;
  if (t > cycleDuration - 0.6) {
    globalOpacity = Math.max(0, 1 - (t - (cycleDuration - 0.6)) / 0.6);
  }

  const scaleFactor = Math.min(width, height) / 500;

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
        color: textColor
      }}
    >
      <div
        style={{
          width: "90%",
          opacity: globalOpacity,
          transform: `scale(${scaleFactor})`
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{title}</h2>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "4px", margin: 0 }}>{subtitle}</p>
        </div>

        {/* Carousel Frame */}
        <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
          <div
            style={{
              display: "flex",
              gap: `${gap}px`,
              transform: `translateX(-${scrollX}px)`,
              transition: "transform 0s",
              willChange: "transform"
            }}
          >
            {defaultSparks.map((item) => {
              const isActive = (t >= 0 && t < 1.2 && item.id === 1) ||
                               (t >= 1.6 && t < 2.8 && item.id === 2) ||
                               (t >= 3.2 && t < 4.4 && item.id === 3) ||
                               (t >= 4.8 && t < 6.4 && item.id === 4);

              const cardY = isActive ? -6 : 0;
              const cardScale = isActive ? 1.01 : 1.0;

              return (
                <div
                  key={item.id}
                  style={{
                    flexShrink: 0,
                    width: `${cardWidth}px`,
                    backgroundColor: cardBg,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
                    transform: `translateY(${cardY}px) scale(${cardScale})`,
                    transition: "transform 0.2s ease-out"
                  }}
                >
                  <img
                    src={item.imageSrc}
                    alt={item.title}
                    style={{ width: "100%", height: "140px", objectFit: "cover" }}
                  />
                  <div style={{ padding: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "semibold", lineHeight: 1.3, margin: 0, height: "36px", overflow: "hidden" }}>
                      {item.title}
                    </h3>
                    <div style={{ marginTop: "16px" }}>
                      <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>{item.count}</p>
                      <p style={{ fontSize: "10px", fontWeight: "medium", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                        {item.countLabel}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
