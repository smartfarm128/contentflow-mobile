import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function ContainerScrollTemplate({ progress, width, values }: HtmlTemplateProps) {
  const title = String(values.title ?? "Unleash the power of\nScroll Animations");
  const imageSrc = String(values.imageSrc ?? placeholderImage("matfitcrop"));
  const accentColor = String(values.accentColor ?? "#6c6c6c");

  const scale = width / 1920;
  const cardWidth = 1000 * scale;
  const cardHeight = 600 * scale;
  const paddingY = 80 * scale;
  const titleSize = Math.max(20, 64 * scale);

  // Compute scroll transformations mathematically from progress (0 to 1)
  const animProgress = Math.max(0, Math.min(1, progress));
  
  // rotateX from 20deg to 0deg
  const rotateX = 20 - 20 * animProgress;
  // scale from 1.05 to 1.0
  const cardScale = 1.05 - 0.05 * animProgress;
  // translateY from 0 to -80px
  const translateCardY = -80 * animProgress * scale;
  // title translate from 0 to -100px
  const translateTitleY = -120 * animProgress * scale;
  const titleOpacity = 1 - 0.5 * animProgress;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b", // zinc-950
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: `${32 * scale}px`,
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          perspective: `${1000 * scale}px`,
          padding: `${paddingY}px 0`,
        }}
      >
        {/* Header Title */}
        <div
          style={{
            transform: `translateY(${translateTitleY}px)`,
            opacity: titleOpacity,
            textAlign: "center",
            maxWidth: "900px",
            marginBottom: `${40 * scale}px`,
            transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
          }}
        >
          <h1
            style={{
              fontSize: `${titleSize}px`,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              lineHeight: 1.1,
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Card Mockup */}
        <div
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            border: `${4 * scale}px solid ${accentColor}`,
            padding: `${16 * scale}px`,
            backgroundColor: "#222222",
            borderRadius: `${30 * scale}px`,
            transform: `rotateX(${rotateX}deg) scale(${cardScale}) translateY(${translateCardY}px)`,
            transformStyle: "preserve-3d",
            boxShadow:
              "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026",
            transition: "transform 0.1s ease-out",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              borderRadius: `${16 * scale}px`,
              backgroundColor: "#18181b", // zinc-900
            }}
          >
            <img
              src={imageSrc}
              alt="mockup screen"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "left top",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
