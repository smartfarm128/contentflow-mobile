import type { HtmlTemplateProps } from "../types";

export function MessageLoadingTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const dotColor = String(values.dotColor ?? "#38bdf8");
  const dotSize = Number(values.dotSize ?? 12);
  const dotGap = Number(values.dotGap ?? 24);
  const bounceHeight = Number(values.bounceHeight ?? 30);
  const speed = Number(values.speed ?? 1.0);

  const scale = Math.min(width, height) / 1080;
  const scaledDotSize = dotSize * scale;
  const scaledDotGap = dotGap * scale;
  const scaledBounceHeight = bounceHeight * scale;

  const cycleTime = 1.05;
  const t = (time * speed) % cycleTime;

  const getDotY = (i: number) => {
    const start = i * 0.1;
    let localT = t - start;
    if (localT < 0) {
      localT += cycleTime;
    }
    if (localT >= 0 && localT <= 0.6) {
      const offset = Math.sin((localT / 0.6) * Math.PI) * scaledBounceHeight;
      return -offset;
    }
    return 0;
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#09090b",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${scaledDotGap}px`,
        }}
      >
        {[0, 1, 2].map((i) => {
          const y = getDotY(i);
          return (
            <div
              key={i}
              style={{
                width: `${scaledDotSize * 2}px`,
                height: `${scaledDotSize * 2}px`,
                borderRadius: "50%",
                backgroundColor: dotColor,
                transform: `translateY(${y}px)`,
                boxShadow: `0 0 ${12 * scale}px ${dotColor}`,
                transition: "transform 0.05s linear",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
