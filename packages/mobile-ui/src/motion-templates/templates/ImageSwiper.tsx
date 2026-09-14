import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function ImageSwiperTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const img1 = String(values.image1 ?? "https://img.freepik.com/premium-photo/3d-cartoon_975306-1.jpg?w=2000");
  const img2 = String(values.image2 ?? "https://img.freepik.com/premium-photo/3d-cartoon-boy-avatar_113255-5540.jpg");
  const img3 = String(values.image3 ?? "https://th.bing.com/th/id/OIP.OmBLyKbo8iixJ2SeS12xxwHaE7?w=626&h=417&rs=1&pid=ImgDetMain");
  const img4 = String(values.image4 ?? "https://thumbs.dreamstime.com/b/animated-academic-cheerful-cartoon-scholar-301088562.jpg");
  const img5 = String(values.image5 ?? "https://img.freepik.com/premium-psd/3d-cute-young-business-man-character-generative-ai_43614-1027.jpg");
  const img6 = String(values.image6 ?? "https://img.freepik.com/premium-photo/arafed-cartoon-man-suit-tie-standing-with-his-hands-his-hips_988987-15581.jpg");

  const baseCardWidth = Number(values.cardWidth ?? 256);
  const baseCardHeight = Number(values.cardHeight ?? 352);
  const cycleDuration = Number(values.cycleDuration ?? 3);
  const zOffset = Number(values.zOffset ?? 12);
  const yOffset = Number(values.yOffset ?? 7);
  const swipeDirection = String(values.swipeDirection ?? "right");

  // 2. Scale factor based on canvas height (e.g. 1080p reference)
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  const cardWidth = baseCardWidth * scaleFactor * 1.5;
  const cardHeight = baseCardHeight * scaleFactor * 1.5;

  const imageList = useMemo(() => {
    return [img1, img2, img3, img4, img5, img6].filter(img => img && img.trim() !== "");
  }, [img1, img2, img3, img4, img5, img6]);

  // If no images, render fallback
  if (imageList.length === 0) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#0d0d11",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: "20px"
        }}
      >
        No Images Provided
      </div>
    );
  }

  // 3. Playhead-driven deterministic card indexing
  const swapCount = Math.floor(time / cycleDuration);
  const activeIndex = swapCount % imageList.length;

  const cardOrder = [];
  for (let i = 0; i < imageList.length; i++) {
    cardOrder.push((activeIndex + i) % imageList.length);
  }

  // Transition phase (last 0.5s of cycleDuration)
  const t = time % cycleDuration;
  const isTransitioning = t > cycleDuration - 0.5;
  const transitionProgress = isTransitioning ? (t - (cycleDuration - 0.5)) / 0.5 : 0;

  // Swipe transformations
  const dirMultiplier = swipeDirection === "left" ? -1 : 1;
  const swipeX = isTransitioning ? transitionProgress * 450 * scaleFactor * dirMultiplier : 0;
  const swipeRotate = isTransitioning ? transitionProgress * 30 * dirMultiplier : 0;
  const swipeOpacity = isTransitioning ? 1 - transitionProgress * 0.85 : 1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#080710",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        perspective: "1000px"
      }}
    >
      <div
        style={{
          position: "relative",
          width: `${cardWidth + 40}px`,
          height: `${cardHeight + 40}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transformStyle: "preserve-3d"
        }}
      >
        {cardOrder.map((originalIndex, displayIndex) => {
          const isTopCard = displayIndex === 0;

          return (
            <div
              key={`${originalIndex}-${displayIndex}`}
              style={{
                position: "absolute",
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: `${16 * scaleFactor}px`,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                overflow: "hidden",
                transition: isTransitioning ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out",
                zIndex: imageList.length - displayIndex,
                transform: `
                  translate3d(0, ${displayIndex * yOffset * scaleFactor * 2}px, ${-displayIndex * zOffset * scaleFactor * 2}px)
                  translate3d(${isTopCard ? swipeX : 0}px, 0, 0)
                  rotateZ(${isTopCard ? swipeRotate : 0}deg)
                `,
                opacity: isTopCard ? swipeOpacity : 1,
                transformOrigin: "bottom center"
              }}
            >
              <img
                src={imageList[originalIndex]}
                alt={`Image Swiper ${originalIndex + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none"
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
