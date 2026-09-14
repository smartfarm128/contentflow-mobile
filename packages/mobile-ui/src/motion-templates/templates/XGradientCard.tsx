import type { HtmlTemplateProps } from "../types";

export function XGradientCardTemplate({ progress, time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const authorName = String(values.authorName ?? "Dorian");
  const authorHandle = String(values.authorHandle ?? "dorian_baffier");
  const authorImage = String(values.authorImage ?? "https://pbs.twimg.com/profile_images/1854916060807675904/KtBJsyWr_400x400.jpg");
  const line1 = String(values.line1 ?? "All components from KokonutUI can now be open in @v0 🎉");
  const line2 = String(values.line2 ?? "1. Click on 'Open in V0'");
  const line3 = String(values.line3 ?? "2. Customize with prompts");
  const line4 = String(values.line4 ?? "3. Deploy to your app");
  const replyName = String(values.replyName ?? "shadcn");
  const replyHandle = String(values.replyHandle ?? "shadcn");
  const replyImage = String(values.replyImage ?? "https://pbs.twimg.com/profile_images/1593304942210478080/TUYae5z7_400x400.jpg");
  const replyContent = String(values.replyContent ?? "Awesome.");
  const glowColor1 = String(values.glowColor1 ?? "#3b82f6");
  const glowColor2 = String(values.glowColor2 ?? "#ec4899");
  const bgOpacity = Number(values.bgOpacity ?? 0.85);

  // Design scale factor relative to 1080p
  const scale = Math.min(width, height) / 1080;
  const padding = Math.max(12, Math.round(40 * scale));
  const innerPadding = Math.max(10, Math.round(30 * scale));
  const cardWidth = Math.max(300, Math.round(750 * scale));
  const avatarSize = Math.max(24, Math.round(60 * scale));
  const textTitleSize = Math.max(12, Math.round(26 * scale));
  const textHandleSize = Math.max(10, Math.round(20 * scale));
  const textBodySize = Math.max(11, Math.round(24 * scale));
  const replyBodySize = Math.max(10, Math.round(21 * scale));
  const gap = Math.max(6, Math.round(18 * scale));
  const textSpacing = Math.max(4, Math.round(12 * scale));

  // Algebraic Entry Sequence (0 -> 1 progress)
  // 1. Outer card reveal (scale + fade): progress 0.0 -> 0.15
  const cardProgress = Math.min(1, progress / 0.15);
  const cardOpacity = cardProgress;
  const cardScale = 0.9 + 0.1 * cardProgress;

  // 2. Lines entry: progress 0.15 -> 0.60
  const contentLines = [line1, line2, line3, line4].filter(Boolean);
  const lineProgresses = contentLines.map((_, idx) => {
    const lineStart = 0.15 + idx * 0.1;
    const lineEnd = lineStart + 0.15;
    return Math.min(1, Math.max(0, (progress - lineStart) / (lineEnd - lineStart)));
  });

  // 3. Reply box reveal: progress 0.60 -> 0.80
  const replyProgress = Math.min(1, Math.max(0, (progress - 0.6) / 0.2));
  const replyOpacity = replyProgress;
  const replyTranslateY = (1 - replyProgress) * 20;

  // Moving glow background coordinates based on time
  const angle = (time * 45) % 360; // 45 degrees per second

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        backgroundColor: `rgba(10, 10, 10, ${bgOpacity})`,
        overflow: "hidden",
        padding: `${padding}px`,
      }}
    >
      {/* Outer Card with Dynamic Animated Gradient border */}
      <div
        style={{
          width: `${cardWidth}px`,
          position: "relative",
          borderRadius: `${Math.round(24 * scale)}px`,
          padding: `${Math.round(4 * scale)}px`,
          opacity: cardOpacity,
          transform: `scale(${cardScale})`,
          transition: "none",
          boxShadow: `0 ${Math.round(20 * scale)}px ${Math.round(50 * scale)}px rgba(0, 0, 0, 0.5)`,
          backgroundImage: `conic-gradient(from ${angle}deg, ${glowColor1}, ${glowColor2}, ${glowColor1})`,
        }}
      >
        {/* Inner Card Background */}
        <div
          style={{
            backgroundColor: "rgba(20, 20, 20, 0.92)",
            borderRadius: `${Math.round(20 * scale)}px`,
            padding: `${innerPadding}px`,
            color: "#ffffff",
          }}
        >
          {/* Header block (Author profile details) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: `${gap}px`,
              marginBottom: `${innerPadding}px`,
            }}
          >
            <div
              style={{
                width: `${avatarSize}px`,
                height: `${avatarSize}px`,
                borderRadius: "50%",
                overflow: "hidden",
                border: `${Math.round(2 * scale)}px solid rgba(255, 255, 255, 0.1)`,
                flexShrink: 0,
              }}
            >
              <img
                src={authorImage}
                alt={authorName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span
                  style={{
                    fontSize: `${textTitleSize}px`,
                    fontWeight: 700,
                  }}
                >
                  {authorName}
                </span>
                {/* Verified SVG */}
                <svg
                  viewBox="0 0 24 24"
                  style={{
                    width: `${Math.round(18 * scale)}px`,
                    height: `${Math.round(18 * scale)}px`,
                    fill: "#3b82f6",
                  }}
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: `${textHandleSize}px`,
                  color: "#a3a3a3",
                }}
              >
                @{authorHandle}
              </span>
            </div>
            {/* Logo SVG (representing X) */}
            <svg
              viewBox="0 0 1200 1227"
              style={{
                width: `${Math.round(24 * scale)}px`,
                height: `${Math.round(24 * scale)}px`,
                fill: "#ffffff",
              }}
            >
              <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z" />
            </svg>
          </div>

          {/* Main X Tweet Text Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: `${textSpacing}px`,
              marginBottom: `${innerPadding}px`,
            }}
          >
            {contentLines.map((line, idx) => (
              <p
                key={idx}
                style={{
                  fontSize: `${textBodySize}px`,
                  lineHeight: 1.4,
                  margin: 0,
                  color: "#ffffff",
                  opacity: lineProgresses[idx],
                  transform: `translateY(${(1 - lineProgresses[idx]) * 10}px)`,
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Optional Reply block */}
          {replyContent && (
            <div
              style={{
                borderTop: `${Math.round(1 * scale)}px solid rgba(255, 255, 255, 0.1)`,
                paddingTop: `${innerPadding}px`,
                opacity: replyOpacity,
                transform: `translateY(${replyTranslateY}px)`,
                display: "flex",
                gap: `${gap}px`,
              }}
            >
              <div
                style={{
                  width: `${Math.max(20, Math.round(50 * scale))}px`,
                  height: `${Math.max(20, Math.round(50 * scale))}px`,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `${Math.round(1.5 * scale)}px solid rgba(255, 255, 255, 0.1)`,
                  flexShrink: 0,
                }}
              >
                <img
                  src={replyImage}
                  alt={replyName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: `${textHandleSize}px`,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{replyName}</span>
                  <span style={{ color: "#737373" }}>@{replyHandle}</span>
                </div>
                <p
                  style={{
                    fontSize: `${replyBodySize}px`,
                    lineHeight: 1.3,
                    margin: `${Math.round(4 * scale)}px 0 0 0`,
                    color: "#d4d4d4",
                  }}
                >
                  {replyContent}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
