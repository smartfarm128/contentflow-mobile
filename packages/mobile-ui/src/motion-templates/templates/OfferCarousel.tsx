import type { HtmlTemplateProps } from "../types";
import { ArrowRight, Tag } from "lucide-react";
import { placeholderImage } from "../local-placeholder";

const defaultOffers = [
  { id: 1, imageSrc: placeholderImage("6f9q80w600"), tag: "Discount", title: "Up to ₹3000 OFF", description: "On International Flights.", brandName: "Ease My Trip", promoCode: "EMTWID" },
  { id: 2, imageSrc: placeholderImage("8cdq80w600"), tag: "Discount", title: "Snack more. Save more.", description: "Get ₹75 OFF on purchases of ₹299+.", brandName: "McD", promoCode: "TWID75" },
  { id: 3, imageSrc: placeholderImage("1d7q80w600"), tag: "Discount", title: "Flat ₹550 OFF", description: "Times Prime Membership offer.", brandName: "Timesprime", promoCode: "TWID550" },
  { id: 4, imageSrc: placeholderImage("eafq80w600"), tag: "Cashback", title: "10% Instant Cashback", description: "On RuPay Credit Cards.", brandName: "Rupay CC", promoCode: "RCC10" }
];

export function OfferCarouselTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Deals of the Day");
  const cycleDuration = Number(values.cycleDuration ?? 8.0);
  const backgroundColor = String(values.backgroundColor ?? "#09090b");
  const cardBg = String(values.cardBg ?? "#18181b");
  
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
        color: "#ffffff"
      }}
    >
      <div
        style={{
          width: "90%",
          opacity: globalOpacity,
          transform: `scale(${scaleFactor})`
        }}
      >
        <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "20px" }}>{title}</h2>

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
            {defaultOffers.map((offer) => {
              // Add a hover effect transition based on loop cycle
              const isActive = (t >= 0 && t < 1.2 && offer.id === 1) ||
                               (t >= 1.6 && t < 2.8 && offer.id === 2) ||
                               (t >= 3.2 && t < 4.4 && offer.id === 3) ||
                               (t >= 4.8 && t < 6.4 && offer.id === 4);

              const cardY = isActive ? -6 : 0;
              const cardScale = isActive ? 1.01 : 1.0;

              return (
                <div
                  key={offer.id}
                  style={{
                    flexShrink: 0,
                    width: `${cardWidth}px`,
                    height: "340px",
                    position: "relative",
                    backgroundColor: cardBg,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
                    transform: `translateY(${cardY}px) scale(${cardScale})`,
                    transition: "transform 0.2s ease-out"
                  }}
                >
                  {/* Top Image */}
                  <div style={{ height: "45%", width: "100%", overflow: "hidden", position: "relative" }}>
                    <img
                      src={offer.imageSrc}
                      alt={offer.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  {/* Content Area */}
                  <div
                    style={{
                      height: "55%",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      {/* Tag */}
                      <div style={{ display: "flex", alignItems: "center", fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", marginBottom: "4px" }}>
                        <Tag style={{ width: "12px", height: "12px", marginRight: "6px", color: "#6366f1" }} />
                        <span>{offer.tag}</span>
                      </div>
                      {/* Title & Description */}
                      <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, lineHeight: 1.2 }}>{offer.title}</h3>
                      <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginTop: "4px", margin: 0 }}>{offer.description}</p>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "12px" }}>
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: "bold", margin: 0 }}>{offer.brandName}</p>
                        <p style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.4)", margin: 0 }}>{offer.promoCode}</p>
                      </div>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: isActive ? "#6366f1" : "rgba(255, 255, 255, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff"
                        }}
                      >
                        <ArrowRight style={{ width: "14px", height: "14px", transform: isActive ? "rotate(-45deg)" : "none", transition: "transform 0.2s" }} />
                      </div>
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
