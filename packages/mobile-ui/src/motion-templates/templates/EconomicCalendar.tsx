import type { HtmlTemplateProps } from "../types";

const defaultEvents = [
  { countryCode: "US", time: "21:30", eventName: "15-Year Mortgage", actual: "10.59", forecast: null, prior: "5.49%", impact: "medium" },
  { countryCode: "US", time: "21:30", eventName: "30-Year Mortgage", actual: "10.59", forecast: null, prior: "6.30%", impact: "high" },
  { countryCode: "FR", time: "22:30", eventName: "ECB Guindos Speech", actual: null, forecast: null, prior: null, impact: "low" },
  { countryCode: "CA", time: "23:10", eventName: "BoC Mendes Speech", actual: null, forecast: null, prior: null, impact: "low" },
  { countryCode: "JP", time: "23:50", eventName: "BoJ Core CPI y/y", actual: "2.8%", forecast: "2.9%", prior: "3.10%", impact: "high" },
  { countryCode: "AU", time: "01:00", eventName: "RBA Stability Review", actual: null, forecast: null, prior: null, impact: "medium" }
];

export function EconomicCalendarTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Economic Calendar");
  const cycleDuration = Number(values.cycleDuration ?? 8.0);
  const backgroundColor = String(values.backgroundColor ?? "#09090b");
  const cardBg = String(values.cardBg ?? "#161619");
  
  const t = time % cycleDuration;

  // Timed scroll positions
  let scrollX = 0;
  const cardWidth = 300;
  const transitions = [
    { startT: 1.0, endT: 1.4, startX: 0, endX: cardWidth },
    { startT: 2.2, endT: 2.6, startX: cardWidth, endX: cardWidth * 2 },
    { startT: 3.4, endT: 3.8, startX: cardWidth * 2, endX: cardWidth * 3 },
    { startT: 4.6, endT: 5.0, startX: cardWidth * 3, endX: cardWidth * 4 },
    { startT: 5.8, endT: 6.2, startX: cardWidth * 4, endX: cardWidth * 5 }
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
          maxWidth: `${900 * scaleFactor}px`,
          opacity: globalOpacity,
          transform: `scale(${scaleFactor})`
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>{title}</h2>
        </div>

        {/* Scroll Frame */}
        <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
          <div
            style={{
              display: "flex",
              gap: "16px",
              transform: `translateX(-${scrollX}px)`,
              transition: "transform 0s",
              willChange: "transform"
            }}
          >
            {defaultEvents.map((evt, idx) => (
              <div
                key={idx}
                style={{
                  flexShrink: 0,
                  width: `${cardWidth - 16}px`,
                  backgroundColor: cardBg,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "16px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Today</span>
                    <span style={{ fontSize: "12px", fontWeight: "semibold", color: "#f87171", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                      {evt.time}
                    </span>
                  </div>
                  {/* Volatility Indicator */}
                  <div style={{ display: "flex", gap: "2px", alignItems: "end" }}>
                    {[1, 2, 3].map((bar) => {
                      const isActive = evt.impact === "high" || (evt.impact === "medium" && bar <= 2) || (evt.impact === "low" && bar === 1);
                      return (
                        <div
                          key={bar}
                          style={{
                            width: "3px",
                            height: `${bar * 4 + 4}px`,
                            borderRadius: "99px",
                            backgroundColor: isActive ? "#ffffff" : "rgba(255,255,255,0.15)"
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <img
                    src={`https://flagcdn.com/w40/${evt.countryCode.toLowerCase()}.png`}
                    alt="flag"
                    style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <h3 style={{ fontSize: "14px", fontWeight: "semibold", margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {evt.eventName}
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", fontSize: "12px" }}>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.4)" }}>Actual</div>
                    <div style={{ fontWeight: "medium", marginTop: "4px" }}>{evt.actual ?? "—"}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.4)" }}>Forecast</div>
                    <div style={{ fontWeight: "medium", marginTop: "4px" }}>{evt.forecast ?? "—"}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.4)" }}>Prior</div>
                    <div style={{ fontWeight: "medium", marginTop: "4px" }}>{evt.prior ?? "—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
