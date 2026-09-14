import type { HtmlTemplateProps } from "../types";

export function ScrollExpansionHeroTemplate({ progress, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const mediaType = String(values.mediaType ?? "video");
  const mediaSrc = String(values.mediaSrc ?? "https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYuZ5R8ahEEZ4aQK56LizRdfBSqeDMsmUIrJN1");
  const posterSrc = String(values.posterSrc ?? "https://images.pexels.com/videos/5752729/space-earth-universe-cosmos-5752729.jpeg");
  const bgImageSrc = String(values.bgImageSrc ?? "https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYMNjMlBUYHaeYpxduXPVNwf8mnFA61L7rkcoS");
  const title = String(values.title ?? "Immersive Video Experience");
  const date = String(values.date ?? "Cosmic Journey");
  const scrollToExpand = String(values.scrollToExpand ?? "Scroll/Scrub to Expand Demo");
  const textBlend = !!values.textBlend;
  const bodyText = String(values.bodyText ?? "This is a demonstration of the ScrollExpandMedia component. As you scrub the playhead, the media expands to fill more of the screen, creating an immersive cinematic transition.");

  const scaleFactor = Math.min(width, height) / 1080;

  // Derive parameters from progress (0 to 1)
  const mediaWidth = (300 + progress * 900) * scaleFactor;
  const mediaHeight = (400 + progress * 400) * scaleFactor;
  const textTranslateX = progress * 150 * scaleFactor;

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  // Show body content in the last 20% of progress
  const contentOpacity = Math.max(0, (progress - 0.8) / 0.2);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background with fading opacity */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - progress,
          zIndex: 0,
          transition: "opacity 0.1s linear",
        }}
      >
        <img
          src={bgImageSrc}
          alt="Background"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        />
      </div>

      {/* Main interactive media box */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: `${mediaWidth}px`,
          height: `${mediaHeight}px`,
          maxWidth: "95vw",
          maxHeight: "85vh",
          boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.5)",
          borderRadius: `${24 * scaleFactor}px`,
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        {mediaType === "video" ? (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <video
              src={mediaSrc}
              poster={posterSrc}
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: `rgba(0, 0, 0, ${0.5 - progress * 0.3})`,
              }}
            />
          </div>
        ) : (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <img
              src={mediaSrc}
              alt="Media content"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: `rgba(0, 0, 0, ${0.7 - progress * 0.3})`,
              }}
            />
          </div>
        )}

        {/* Date and Scroll to Expand Text inside media */}
        <div
          style={{
            position: "absolute",
            bottom: `${20 * scaleFactor}px`,
            left: `${20 * scaleFactor}px`,
            right: `${20 * scaleFactor}px`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          {date && (
            <p
              style={{
                margin: 0,
                fontSize: `${18 * scaleFactor}px`,
                fontWeight: 600,
                color: "#bfdbfe",
                transform: `translateX(-${textTranslateX}px)`,
              }}
            >
              {date}
            </p>
          )}
          {scrollToExpand && (
            <p
              style={{
                margin: 0,
                fontSize: `${14 * scaleFactor}px`,
                fontWeight: 500,
                color: "#bfdbfe",
                transform: `translateX(${textTranslateX}px)`,
              }}
            >
              {scrollToExpand}
            </p>
          )}
        </div>
      </div>

      {/* Main Blending Titles */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: `${16 * scaleFactor}px`,
          zIndex: 15,
          mixBlendMode: textBlend ? "difference" : "normal",
          pointerEvents: "none",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: `${72 * scaleFactor}px`,
            fontWeight: 800,
            color: "#bfdbfe",
            transform: `translateX(-${textTranslateX}px)`,
          }}
        >
          {firstWord}
        </h2>
        <h2
          style={{
            margin: 0,
            fontSize: `${72 * scaleFactor}px`,
            fontWeight: 800,
            textAlign: "center",
            color: "#bfdbfe",
            transform: `translateX(${textTranslateX}px)`,
          }}
        >
          {restOfTitle}
        </h2>
      </div>

      {/* Body content section when expanded */}
      {progress > 0.8 && (
        <div
          style={{
            position: "absolute",
            bottom: `${40 * scaleFactor}px`,
            width: "100%",
            maxWidth: `${800 * scaleFactor}px`,
            padding: `0 ${32 * scaleFactor}px`,
            opacity: contentOpacity,
            zIndex: 25,
            transition: "opacity 0.2s ease-out",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: `${16 * scaleFactor}px`,
              padding: `${24 * scaleFactor}px`,
              backdropFilter: "blur(8px)",
            }}
          >
            <h3
              style={{
                fontSize: `${24 * scaleFactor}px`,
                fontWeight: 700,
                color: "#ffffff",
                margin: `0 0 ${12 * scaleFactor}px 0`,
              }}
            >
              About This Scene
            </h3>
            <p
              style={{
                fontSize: `${16 * scaleFactor}px`,
                color: "rgba(255, 255, 255, 0.8)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {bodyText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
