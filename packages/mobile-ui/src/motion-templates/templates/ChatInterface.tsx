import type { HtmlTemplateProps } from "../types";
import { Link2 } from "lucide-react";
import { placeholderAvatar, placeholderImage } from "../local-placeholder";

const defaultMessages = [
  { id: 1, sender: "left" as const, type: "text" as const, content: "Hey Sarah! Have you checked out the new ContentFlow editor?" },
  { id: 2, sender: "right" as const, type: "text" as const, content: "Yes! The real-time playback and overlay motion graphics are stunning." },
  { id: 3, sender: "left" as const, type: "image" as const, content: placeholderImage("300fitcrop") },
  { id: 4, sender: "right" as const, type: "text-with-links" as const, content: "Wow, that looks amazing. Where can I try it?", links: [{ text: "contentflow.dev" }, { text: "Docs" }] }
];

export function ChatInterfaceTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const leftName = String(values.leftName ?? "Ali Imam");
  const leftAvatar = String(values.leftAvatar ?? placeholderAvatar("100fitcrop"));
  const rightName = String(values.rightName ?? "Sarah Chen");
  const rightAvatar = String(values.rightAvatar ?? placeholderAvatar("100fitcrop"));

  const cycleDuration = Number(values.cycleDuration ?? 8.0);
  const accentColor = String(values.accentColor ?? "#6366f1");
  const backgroundColor = String(values.backgroundColor ?? "#09090b");

  const t = time % cycleDuration;

  // Timestamps for message progression
  // Each message has a phase: 
  // - Unborn (t < loaderStart)
  // - Loading (loaderStart <= t < revealTime)
  // - Visible (t >= revealTime)
  const timeline = [
    { id: 1, loaderStart: 0.2, revealTime: 1.2, height: 70 },
    { id: 2, loaderStart: 1.5, revealTime: 2.3, height: 70 },
    { id: 3, loaderStart: 2.6, revealTime: 4.1, height: 160 },
    { id: 4, loaderStart: 4.4, revealTime: 5.4, height: 100 }
  ];

  // Calculate scrolled position (simulate scrollToBottom)
  let scrollY = 0;
  const scrollTransitions = [
    { startT: 1.2, endT: 1.6, startY: 0, endY: 40 },
    { startT: 2.3, endT: 2.7, startY: 40, endY: 100 },
    { startT: 4.1, endT: 4.5, startY: 100, endY: 260 },
    { startT: 5.4, endT: 5.8, startY: 260, endY: 340 }
  ];

  for (const trans of scrollTransitions) {
    if (t >= trans.startT && t < trans.endT) {
      const f = (t - trans.startT) / (trans.endT - trans.startT);
      scrollY = trans.startY + (trans.endY - trans.startY) * f;
    } else if (t >= trans.endT) {
      scrollY = trans.endY;
    }
  }

  // Calculate global fadeout at the end of the loop
  let globalOpacity = 1.0;
  if (t > cycleDuration - 0.8) {
    globalOpacity = Math.max(0, 1 - (t - (cycleDuration - 0.8)) / 0.8);
  }

  const scaleFactor = Math.min(width, height) / 500;
  const containerW = 400 * scaleFactor;
  const containerH = 460 * scaleFactor;

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
      }}
    >
      <div
        style={{
          width: `${containerW}px`,
          height: `${containerH}px`,
          position: "relative",
          borderRadius: `${12 * scaleFactor}px`,
          backgroundColor: "#111113",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          opacity: globalOpacity,
          overflow: "hidden"
        }}
      >
        {/* Scrollable Area */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: `${24 * scaleFactor}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            transform: `translateY(-${scrollY * scaleFactor}px)`,
          }}
        >
          {defaultMessages.map((msg, idx) => {
            const phase = timeline[idx];
            const isLeft = msg.sender === "left";
            const avatar = isLeft ? leftAvatar : rightAvatar;
            const name = isLeft ? leftName : rightName;

            if (t < phase.loaderStart) return null;

            const isLoading = t < phase.revealTime;

            // Animate message bubble scale on entrance
            let scale = 1.0;
            let bubbleOpacity = 1.0;
            if (isLoading) {
              const ratio = (t - phase.loaderStart) / (phase.revealTime - phase.loaderStart);
              scale = 0.95 + 0.05 * ratio;
              bubbleOpacity = ratio;
            } else {
              const ratio = Math.min(1, (t - phase.revealTime) / 0.35);
              scale = 0.98 + 0.02 * ratio;
            }

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  alignItems: "end",
                  gap: `${10 * scaleFactor}px`,
                  flexDirection: isLeft ? "row" : "row-reverse",
                  marginTop: `${16 * scaleFactor}px`,
                  opacity: bubbleOpacity,
                  transform: `scale(${scale})`,
                  transformOrigin: isLeft ? "bottom left" : "bottom right",
                }}
              >
                {/* Avatar */}
                <img
                  src={avatar}
                  alt={name}
                  style={{
                    width: `${32 * scaleFactor}px`,
                    height: `${32 * scaleFactor}px`,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid rgba(255, 255, 255, 0.15)"
                  }}
                />

                {/* Message Bubble content */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: isLeft ? "flex-start" : "flex-end" }}>
                  {/* Name */}
                  <span style={{ fontSize: `${10 * scaleFactor}px`, color: isLeft ? "#818cf8" : "#c084fc", marginBottom: "4px" }}>
                    {name}
                  </span>

                  {/* Bubble */}
                  <div
                    style={{
                      padding: msg.type === "image" ? `${4 * scaleFactor}px` : `${12 * scaleFactor}px`,
                      borderRadius: isLeft 
                        ? `${12 * scaleFactor}px ${12 * scaleFactor}px ${12 * scaleFactor}px 0`
                        : `${12 * scaleFactor}px ${12 * scaleFactor}px 0 ${12 * scaleFactor}px`,
                      backgroundColor: isLeft ? "#1f1f23" : "#2e1b4e",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      color: "#f4f4f5",
                      maxWidth: `${250 * scaleFactor}px`,
                      fontSize: `${13 * scaleFactor}px`,
                      lineHeight: 1.5,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  >
                    {isLoading ? (
                      /* Animated bouncing dots using sine wave function of absolute time */
                      <div style={{ display: "flex", gap: "3px", padding: "4px 8px" }}>
                        {[0, 1, 2].map((i) => {
                          const dotY = -3 - 3 * Math.sin(time * 10 - i * 1.5);
                          return (
                            <div
                              key={i}
                              style={{
                                width: `${5 * scaleFactor}px`,
                                height: `${5 * scaleFactor}px`,
                                borderRadius: "50%",
                                backgroundColor: accentColor,
                                transform: `translateY(${dotY}px)`
                              }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <>
                        {msg.type === "text" && <span>{msg.content}</span>}
                        {msg.type === "image" && (
                          <img
                            src={msg.content}
                            alt="Chat attachment"
                            style={{
                              maxWidth: `${220 * scaleFactor}px`,
                              borderRadius: `${8 * scaleFactor}px`,
                              display: "block"
                            }}
                          />
                        )}
                        {msg.type === "text-with-links" && (
                          <div>
                            <div>{msg.content}</div>
                            <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                              {msg.links?.map((lnk, lIdx) => (
                                <div
                                  key={lIdx}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                                    padding: "3px 8px",
                                    borderRadius: "100px",
                                    fontSize: `${10 * scaleFactor}px`,
                                    color: accentColor,
                                    border: "1px solid rgba(255,255,255,0.05)"
                                  }}
                                >
                                  <Link2 style={{ width: "10px", height: "10px" }} />
                                  <span>{lnk.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
