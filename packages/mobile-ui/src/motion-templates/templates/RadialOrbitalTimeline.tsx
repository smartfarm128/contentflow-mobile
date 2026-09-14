import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { Calendar, Code, FileText, User, Clock, Zap } from "lucide-react";

export function RadialOrbitalTimelineTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const cycleDuration = Number(values.cycleDuration ?? 20);

  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // Build timeline items from values
  const timelineData = useMemo(() => {
    return [
      {
        id: 1,
        title: String(values.node1Title ?? "Planning"),
        date: String(values.node1Date ?? "Jan 2024"),
        content: String(values.node1Content ?? "Project planning and requirements gathering phase."),
        icon: Calendar,
        relatedIds: [2],
        status: "completed" as const,
        energy: Number(values.node1Energy ?? 100),
      },
      {
        id: 2,
        title: String(values.node2Title ?? "Design"),
        date: String(values.node2Date ?? "Feb 2024"),
        content: String(values.node2Content ?? "UI/UX design and system architecture."),
        icon: FileText,
        relatedIds: [1, 3],
        status: "completed" as const,
        energy: Number(values.node2Energy ?? 90),
      },
      {
        id: 3,
        title: String(values.node3Title ?? "Development"),
        date: String(values.node3Date ?? "Mar 2024"),
        content: String(values.node3Content ?? "Core features implementation and testing."),
        icon: Code,
        relatedIds: [2, 4],
        status: "in-progress" as const,
        energy: Number(values.node3Energy ?? 60),
      },
      {
        id: 4,
        title: String(values.node4Title ?? "Testing"),
        date: String(values.node4Date ?? "Apr 2024"),
        content: String(values.node4Content ?? "User testing and bug fixes."),
        icon: User,
        relatedIds: [3, 5],
        status: "pending" as const,
        energy: Number(values.node4Energy ?? 30),
      },
      {
        id: 5,
        title: String(values.node5Title ?? "Release"),
        date: String(values.node5Date ?? "May 2024"),
        content: String(values.node5Content ?? "Final deployment and release."),
        icon: Clock,
        relatedIds: [4],
        status: "pending" as const,
        energy: Number(values.node5Energy ?? 10),
      },
    ];
  }, [values]);

  // Compute rotation angle and active node based on time
  const rotationAngle = (time * (360 / cycleDuration)) % 360;
  
  // Cycle active node
  const activeIndex = Math.floor((time / (cycleDuration / timelineData.length)) % timelineData.length);
  const activeNodeId = timelineData[activeIndex]?.id ?? null;

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200 * scaleFactor;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.4,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
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
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: `${900 * scaleFactor}px`,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            perspective: "1000px",
          }}
        >
          {/* Center core */}
          <div
            style={{
              position: "absolute",
              width: `${64 * scaleFactor}px`,
              height: `${64 * scaleFactor}px`,
              borderRadius: "50%",
              background: "linear-gradient(to bottom right, #a855f7, #3b82f6, #14b8a6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: `${32 * scaleFactor}px`,
                height: `${32 * scaleFactor}px`,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(4px)",
              }}
            />
          </div>

          {/* Orbit line */}
          <div
            style={{
              position: "absolute",
              width: `${400 * scaleFactor}px`,
              height: `${400 * scaleFactor}px`,
              borderRadius: "50%",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          />

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = item.id === activeNodeId;
            const isRelated = isRelatedToActive(item.id);
            const Icon = item.icon;

            const nodeStyle: React.CSSProperties = {
              position: "absolute",
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
              transition: "transform 0.5s ease-out, opacity 0.5s ease-out",
            };

            return (
              <div key={item.id} style={nodeStyle}>
                {/* Pulse halo */}
                <div
                  style={{
                    position: "absolute",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
                    width: `${(item.energy * 0.5 + 40) * scaleFactor}px`,
                    height: `${(item.energy * 0.5 + 40) * scaleFactor}px`,
                    left: `-${(((item.energy * 0.5 + 40) - 40) / 2) * scaleFactor}px`,
                    top: `-${(((item.energy * 0.5 + 40) - 40) / 2) * scaleFactor}px`,
                    opacity: isRelated ? 1 : 0.4,
                  }}
                />

                {/* Node icon circle */}
                <div
                  className={`
                    flex items-center justify-center border-2 transition-all duration-300
                  `}
                  style={{
                    width: `${40 * scaleFactor}px`,
                    height: `${40 * scaleFactor}px`,
                    borderRadius: "50%",
                    backgroundColor: isExpanded ? "#ffffff" : isRelated ? "rgba(255, 255, 255, 0.5)" : "#000000",
                    color: isExpanded || isRelated ? "#000000" : "#ffffff",
                    borderColor: isExpanded || isRelated ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                    transform: isExpanded ? "scale(1.5)" : "scale(1)",
                  }}
                >
                  <Icon size={16 * scaleFactor} />
                </div>

                {/* Label */}
                <div
                  style={{
                    position: "absolute",
                    top: `${48 * scaleFactor}px`,
                    left: "50%",
                    transform: `translateX(-50%) ${isExpanded ? "scale(1.2)" : "scale(1)"}`,
                    whiteSpace: "nowrap",
                    fontSize: `${12 * scaleFactor}px`,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    color: isExpanded ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                    transition: "color 0.3s, transform 0.3s",
                  }}
                >
                  {item.title}
                </div>

                {/* Expand card */}
                {isExpanded && (
                  <div
                    style={{
                      position: "absolute",
                      top: `${80 * scaleFactor}px`,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: `${256 * scaleFactor}px`,
                      backgroundColor: "rgba(0, 0, 0, 0.9)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: `${8 * scaleFactor}px`,
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
                      padding: `${16 * scaleFactor}px`,
                      zIndex: 300,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: `-${12 * scaleFactor}px`,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "1px",
                        height: `${12 * scaleFactor}px`,
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: `${8 * scaleFactor}px`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: `${10 * scaleFactor}px`,
                          fontWeight: 700,
                          padding: `${2 * scaleFactor}px ${6 * scaleFactor}px`,
                          borderRadius: `${4 * scaleFactor}px`,
                          border: "1px solid #ffffff",
                          textTransform: "uppercase",
                          backgroundColor: item.status === "completed" ? "#ffffff" : "transparent",
                          color: item.status === "completed" ? "#000000" : "#ffffff",
                        }}
                      >
                        {item.status}
                      </span>
                      <span
                        style={{
                          fontSize: `${10 * scaleFactor}px`,
                          fontFamily: "monospace",
                          color: "rgba(255, 255, 255, 0.5)",
                        }}
                      >
                        {item.date}
                      </span>
                    </div>

                    <h4
                      style={{
                        fontSize: `${14 * scaleFactor}px`,
                        fontWeight: 700,
                        color: "#ffffff",
                        margin: `0 0 ${8 * scaleFactor}px 0`,
                      }}
                    >
                      {item.title}
                    </h4>

                    <p
                      style={{
                        fontSize: `${11 * scaleFactor}px`,
                        color: "rgba(255, 255, 255, 0.8)",
                        margin: `0 0 ${16 * scaleFactor}px 0`,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.content}
                    </p>

                    <div
                      style={{
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                        paddingTop: `${12 * scaleFactor}px`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: `${10 * scaleFactor}px`,
                          color: "rgba(255, 255, 255, 0.8)",
                          marginBottom: `${4 * scaleFactor}px`,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <Zap size={10 * scaleFactor} style={{ marginRight: `${4 * scaleFactor}px` }} />
                          Energy Level
                        </span>
                        <span>{item.energy}%</span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: `${4 * scaleFactor}px`,
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${item.energy}%`,
                            background: "linear-gradient(to right, #3b82f6, #a855f7)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
