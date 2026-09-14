import type { HtmlTemplateProps } from "../types";

export function BlurTextAnimationTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const text = String(values.text ?? "Elegant blur animation that brings your words to life with cinematic transitions.");
  const fontSize = String(values.fontSize ?? "36px");
  const fontFamily = String(values.fontFamily ?? "Avenir Next, system-ui, sans-serif");
  const textColor = String(values.textColor ?? "#ffffff");
  const cycleDuration = Number(values.cycleDuration ?? 6.0);

  const splitWords = text.split(" ");
  const totalWords = splitWords.length;

  const activeDuration = cycleDuration - 1.0; // 1s stay/fade out at the end of loop
  const t = time % cycleDuration;

  const scaleFactor = Math.min(width, height) / 600;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "40px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "900px" }}>
        <p
          style={{
            color: textColor,
            fontSize: `${Number(fontSize.replace("px", "")) * scaleFactor}px`,
            fontFamily: fontFamily,
            fontWeight: 300,
            lineHeight: 1.6,
            letterSpacing: "0.02em",
          }}
        >
          {splitWords.map((word, index) => {
            const progressRatio = index / totalWords;
            
            // Deterministic delays and durations
            const wordDelay = index * 0.08 + Math.pow(progressRatio, 0.8) * 0.5;
            const wordDuration = 1.2 + Math.cos(index * 0.3) * 0.2;
            const wordBlur = 12 + (index % 5) * 2;
            const wordScale = 0.9 + Math.sin(index * 0.2) * 0.05;

            // Entrance progress
            let p = 0;
            if (t > wordDelay) {
              p = Math.min(1, (t - wordDelay) / wordDuration);
            }

            // Exit fade out at loop end
            let fadeOut = 0;
            if (t > activeDuration) {
              fadeOut = Math.min(1, (t - activeDuration) / 0.8);
            }

            const opacity = (1 - fadeOut) * p;
            const blurVal = (1 - p) * wordBlur + fadeOut * 15;
            const scaleVal = wordScale + (1 - wordScale) * p - fadeOut * 0.1;
            const yVal = (1 - p) * 20 + fadeOut * 10;
            const rotateXVal = (1 - p) * -15 + fadeOut * 10;

            return (
              <span
                key={index}
                style={{
                  display: "inline-block",
                  opacity: opacity,
                  filter: `blur(${blurVal}px) brightness(${0.6 + 0.4 * p})`,
                  transform: `translateY(${yVal}px) scale(${scaleVal}) rotateX(${rotateXVal}deg)`,
                  marginRight: "0.35em",
                  willChange: "filter, transform, opacity",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                  textShadow: p > 0.8 ? "0 2px 8px rgba(255,255,255,0.1)" : "none",
                }}
              >
                {word}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
