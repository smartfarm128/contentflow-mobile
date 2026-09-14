import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function BlurFadeTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const title = String(values.title ?? "STAGGERED GALLERY");
  const subtitle = String(values.subtitle ?? "Scrub the playhead to watch the staggered blur entry");
  const delayStep = Number(values.delayStep ?? 0.15); // delay between items in seconds
  const duration = Number(values.duration ?? 0.6); // duration per item in seconds
  const yOffsetInput = Number(values.yOffset ?? 30); // pixels
  const blurAmtInput = Number(values.blurAmt ?? 16); // pixels
  const bgOpacity = Number(values.bgOpacity ?? 0.85);

  const images = useMemo(() => [
    { id: "img-1", url: String(values.image1 ?? placeholderImage("ropw400q80")), label: String(values.label1 ?? "Yosemite") },
    { id: "img-2", url: String(values.image2 ?? placeholderImage("ropw400q80")), label: String(values.label2 ?? "Mountain Lake") },
    { id: "img-3", url: String(values.image3 ?? placeholderImage("ropw400q80")), label: String(values.label3 ?? "Forest") },
    { id: "img-4", url: String(values.image4 ?? placeholderImage("ropw400q80")), label: String(values.label4 ?? "Meadow") },
    { id: "img-5", url: String(values.image5 ?? placeholderImage("ropw400q80")), label: String(values.label5 ?? "Hills") },
    { id: "img-6", url: String(values.image6 ?? placeholderImage("ropw400q80")), label: String(values.label6 ?? "Walkway") },
  ], [
    values.image1, values.label1,
    values.image2, values.label2,
    values.image3, values.label3,
    values.image4, values.label4,
    values.image5, values.label5,
    values.image6, values.label6,
  ]);

  // Design scale factor relative to 1080p
  const scale = Math.min(width, height) / 1080;
  const padding = Math.max(16, Math.round(50 * scale));
  const cardWidth = Math.max(100, Math.round(260 * scale));
  const cardHeight = Math.max(120, Math.round(320 * scale));
  const gridGap = Math.max(10, Math.round(30 * scale));
  const titleSize = Math.max(16, Math.round(44 * scale));
  const subtitleSize = Math.max(11, Math.round(22 * scale));
  const textLabelSize = Math.max(10, Math.round(18 * scale));
  const headingSpacing = Math.max(8, Math.round(20 * scale));
  const yOffset = yOffsetInput * scale;
  const blurAmt = blurAmtInput;

  // Stagger calculations
  // Header enters first
  const headerProgress = Math.min(1, Math.max(0, time / 0.5));
  const headerEase = 1 - Math.pow(1 - headerProgress, 3);
  const headerOpacity = headerEase;
  const headerTranslateY = (1 - headerEase) * yOffset;
  const headerBlur = (1 - headerEase) * blurAmt;

  // Grid items enter staggered after header starts
  const animatedItems = useMemo(() => {
    return images.map((item, idx) => {
      const tStart = 0.3 + idx * delayStep;
      const tProgress = Math.min(1, Math.max(0, (time - tStart) / duration));
      const ease = 1 - Math.pow(1 - tProgress, 3);

      const opacity = ease;
      const translateY = (1 - ease) * yOffset;
      const filter = `blur(${(1 - ease) * blurAmt}px)`;

      return {
        ...item,
        opacity,
        translateY,
        filter,
      };
    });
  }, [images, delayStep, duration, time, yOffset, blurAmt]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: `rgba(10, 10, 10, ${bgOpacity})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: `${padding}px`,
      }}
    >
      {/* Heading Block */}
      <div
        style={{
          textAlign: "center",
          marginBottom: `${headingSpacing * 2}px`,
          opacity: headerOpacity,
          transform: `translateY(${headerTranslateY}px)`,
          filter: `blur(${headerBlur}px)`,
          transition: "none",
        }}
      >
        <h1
          style={{
            fontSize: `${titleSize}px`,
            fontWeight: 900,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.04em",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: `${subtitleSize}px`,
            color: "#a3a3a3",
            margin: `${Math.round(6 * scale)}px 0 0 0`,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Grid Block */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: `${gridGap}px`,
          maxWidth: "95%",
        }}
      >
        {animatedItems.map((item) => (
          <div
            key={item.id}
            style={{
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              borderRadius: `${Math.round(16 * scale)}px`,
              overflow: "hidden",
              position: "relative",
              opacity: item.opacity,
              transform: `translateY(${item.translateY}px)`,
              filter: item.filter,
              transition: "none",
              border: `${Math.round(1 * scale)}px solid rgba(255, 255, 255, 0.1)`,
            }}
          >
            <img
              src={item.url}
              alt={item.label}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Soft dark overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 60%)",
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: `${Math.round(14 * scale)}px`,
                left: `${Math.round(14 * scale)}px`,
                fontSize: `${textLabelSize}px`,
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
