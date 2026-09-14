import type { HtmlTemplateProps } from "../types";

export function AiLoaderTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "Generating");
  const size = Number(values.size ?? 180);
  const speed = Number(values.speed ?? 1.0);

  const scale = Math.min(width, height) / 1080;
  const scaledSize = size * scale;

  const letters = text.split("");
  const angle = 90 + (time * speed * 360 / 5);
  const pulseProgress = Math.sin((time * speed * Math.PI * 2) / 5) * 0.5 + 0.5;

  const color1 = `rgba(56, 189, 248, ${0.4 + 0.2 * pulseProgress})`;
  const color2 = `rgba(0, 93, 255, ${0.3 + 0.2 * pulseProgress})`;
  
  const shadowStyle = {
    transform: `rotate(${angle}deg)`,
    boxShadow: `
      0 ${6 * scale}px ${12 * scale}px 0 #38bdf8 inset,
      0 ${12 * scale}px ${18 * scale}px 0 #005dff inset,
      0 ${36 * scale}px ${36 * scale}px 0 #1e40af inset,
      0 0 ${3 * scale}px ${1.2 * scale}px ${color1},
      0 0 ${6 * scale}px ${1.8 * scale}px ${color2}
    `,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom, #1a3379 0%, #0f172a 50%, #000000 100%)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          fontSize: `${24 * scale}px`,
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "0.05em",
          width: scaledSize,
          height: scaledSize,
        }}
      >
        {letters.map((letter, index) => {
          const t = time * speed - index * 0.15;
          const cycleProgress = ((t % 3.0) + 3.0) % 3.0;

          let opacity = 0.4;
          let letterScale = 1.0;
          let yOffset = 0;

          if (cycleProgress < 0.6) {
            const ratio = cycleProgress / 0.6;
            opacity = 0.4 + 0.6 * ratio;
            letterScale = 1.0 + 0.15 * ratio;
            yOffset = -15 * scale * Math.sin(ratio * Math.PI);
          } else if (cycleProgress < 1.2) {
            const ratio = (cycleProgress - 0.6) / 0.6;
            opacity = 1.0 - 0.3 * ratio;
            letterScale = 1.15 - 0.15 * ratio;
          } else {
            const ratio = (cycleProgress - 1.2) / 1.8;
            opacity = 0.7 - 0.3 * ratio;
          }

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                transform: `translateY(${yOffset}px) scale(${letterScale})`,
                opacity,
                margin: `0 ${2 * scale}px`,
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          );
        })}

        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            ...shadowStyle,
          }}
        />
      </div>
    </div>
  );
}
