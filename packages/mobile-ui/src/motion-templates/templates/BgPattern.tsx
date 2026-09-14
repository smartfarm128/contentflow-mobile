import type { HtmlTemplateProps } from "../types";

type BGVariantType = 'dots' | 'diagonal-stripes' | 'grid' | 'horizontal-lines' | 'vertical-lines' | 'checkerboard';
type BGMaskType =
	| 'fade-center'
	| 'fade-edges'
	| 'fade-top'
	| 'fade-bottom'
	| 'fade-left'
	| 'fade-right'
	| 'fade-x'
	| 'fade-y'
	| 'none';

const maskGradients: Record<BGMaskType, string> = {
	'fade-edges': 'radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
	'fade-center': 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 70%)',
	'fade-top': 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)',
	'fade-bottom': 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
	'fade-left': 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)',
	'fade-right': 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
	'fade-x': 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
	'fade-y': 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
	none: 'none',
};

function getBgImage(variant: BGVariantType, fill: string, size: number) {
	switch (variant) {
		case 'dots':
			return `radial-gradient(${fill} 1px, transparent 1px)`;
		case 'grid':
			return `linear-gradient(to right, ${fill} 1px, transparent 1px), linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
		case 'diagonal-stripes':
			return `repeating-linear-gradient(45deg, ${fill}, ${fill} 1px, transparent 1px, transparent ${size}px)`;
		case 'horizontal-lines':
			return `linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
		case 'vertical-lines':
			return `linear-gradient(to right, ${fill} 1px, transparent 1px)`;
		case 'checkerboard':
			return `linear-gradient(45deg, ${fill} 25%, transparent 25%), linear-gradient(-45deg, ${fill} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${fill} 75%), linear-gradient(-45deg, transparent 75%, ${fill} 75%)`;
		default:
			return undefined;
	}
}

export function BgPatternTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const variant = String(values.variant ?? "grid") as BGVariantType;
  const mask = String(values.mask ?? "fade-edges") as BGMaskType;
  const size = Number(values.size ?? 24);
  const fill = String(values.fill ?? "#3b82f6");
  const speedX = Number(values.speedX ?? 15); // px per second scrolling
  const speedY = Number(values.speedY ?? 15);
  const textTitle = String(values.title ?? "BACKGROUND PATTERN");

  const scaleFactor = Math.min(width, height) / 1080;
  const scaledSize = size * scaleFactor;
  const bgSize = `${scaledSize}px ${scaledSize}px`;
  const backgroundImage = getBgImage(variant, fill, scaledSize);

  // Playhead-driven scrolling offset
  const offsetX = (time * speedX * scaleFactor) % scaledSize;
  const offsetY = (time * speedY * scaleFactor) % scaledSize;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030014",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage,
          backgroundSize: bgSize,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
          WebkitMaskImage: maskGradients[mask],
          maskImage: maskGradients[mask],
          opacity: 0.8,
        }}
      />

      {textTitle && (
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <h1
            style={{
              fontSize: `${Math.max(24, 48 * scaleFactor)}px`,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              margin: 0,
              textShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
              opacity: 0.85 + 0.15 * Math.sin(time * 3.5),
            }}
          >
            {textTitle}
          </h1>
        </div>
      )}
    </div>
  );
}
