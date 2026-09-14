import React from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderImage } from "../local-placeholder";

export function FlipGalleryTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const slideDuration = Number(values.slideDuration ?? 3.5);
  const flipDuration = Number(values.flipDuration ?? 0.8);
  const imageCsv = String(values.images ?? "");

  const scale = Math.min(width, height) / 1080;
  const cardWidth = 360 * scale;
  const cardHeight = 560 * scale;

  const defaultImages = [
    { title: "Joshua Hibbert", url: placeholderImage("matfitcrop") },
    { title: "Joshua Earle", url: placeholderImage("matfitcrop") },
    { title: "Antoine Beauvillain", url: placeholderImage("matfitcrop") },
    { title: "Greg Rakozy", url: placeholderImage("matfitcrop") },
    { title: "Ramiro Checchi", url: placeholderImage("matfitcrop") }
  ];

  let images = defaultImages;
  if (imageCsv.trim()) {
    images = imageCsv.split(",").map((url, i) => ({
      title: `Slide ${i + 1}`,
      url: url.trim(),
    }));
  }

  const totalSlides = images.length;
  const cycleTime = slideDuration * totalSlides;
  const localTime = time % slideDuration;
  const currentIndex = Math.floor((time % cycleTime) / slideDuration);
  const nextIndex = (currentIndex + 1) % totalSlides;

  const currentImg = images[currentIndex]?.url;
  const nextImg = images[nextIndex]?.url;
  const currentTitle = images[currentIndex]?.title ?? "";

  // Flip progress state
  const isFlipping = localTime >= slideDuration - flipDuration;
  const p = isFlipping ? (localTime - (slideDuration - flipDuration)) / flipDuration : 0;

  // Render variables
  let topBg = currentImg;
  let bottomBg = currentImg;
  let showFlippingTop = false;
  let showFlippingBottom = false;
  let rotateX = 0;
  let shadowOpacity = 0;

  if (isFlipping) {
    if (p < 0.5) {
      // First half of flip: top half of current flips down
      topBg = nextImg; // next image is waiting underneath on top
      bottomBg = currentImg;
      showFlippingTop = true;
      rotateX = -p * 2 * 90; // rotates 0 -> -90
      shadowOpacity = p * 2 * 0.75;
    } else {
      // Second half of flip: bottom half of next flips down to cover old bottom
      topBg = nextImg;
      bottomBg = currentImg; // current image still shows on bottom base
      showFlippingBottom = true;
      rotateX = (1 - (p - 0.5) * 2) * 90; // rotates 90 -> 0
      shadowOpacity = (1 - (p - 0.5) * 2) * 0.75;
    }
  }

  const halfHeight = cardHeight / 2;

  // Base Top style
  const topBaseStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: halfHeight,
    backgroundImage: `url('${topBg}')`,
    backgroundSize: `${cardWidth}px ${cardHeight}px`,
    backgroundPosition: "top",
    overflow: "hidden",
  };

  // Base Bottom style
  const bottomBaseStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: halfHeight,
    backgroundImage: `url('${bottomBg}')`,
    backgroundSize: `${cardWidth}px ${cardHeight}px`,
    backgroundPosition: "bottom",
    overflow: "hidden",
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
          width: cardWidth + 16 * scale,
          height: cardHeight + 16 * scale,
          background: "rgba(255, 255, 255, 0.05)",
          border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.15)`,
          borderRadius: `${16 * scale}px`,
          padding: `${8 * scale}px`,
          boxSizing: "border-box",
        }}
      >
        {/* Flip container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            perspective: `${1000 * scale}px`,
          }}
        >
          {/* Base Top Half */}
          <div style={topBaseStyle} />

          {/* Base Bottom Half */}
          <div style={bottomBaseStyle} />

          {/* Center Gap line */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: "100%",
              height: `${4 * scale}px`,
              backgroundColor: "#000000",
              transform: "translateY(-50%)",
              zIndex: 15,
            }}
          />

          {/* Flipping Top Panel */}
          {showFlippingTop && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: halfHeight,
                backgroundImage: `url('${currentImg}')`,
                backgroundSize: `${cardWidth}px ${cardHeight}px`,
                backgroundPosition: "top",
                transformOrigin: "bottom",
                transform: `rotateX(${rotateX}deg)`,
                backfaceVisibility: "hidden",
                zIndex: 10,
                overflow: "hidden",
              }}
            >
              {/* Shadow Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "black",
                  opacity: shadowOpacity,
                  pointerEvents: "none",
                }}
              />
            </div>
          )}

          {/* Flipping Bottom Panel */}
          {showFlippingBottom && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: halfHeight,
                backgroundImage: `url('${nextImg}')`,
                backgroundSize: `${cardWidth}px ${cardHeight}px`,
                backgroundPosition: "bottom",
                transformOrigin: "top",
                transform: `rotateX(${rotateX}deg)`,
                backfaceVisibility: "hidden",
                zIndex: 10,
                overflow: "hidden",
              }}
            >
              {/* Shadow Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "black",
                  opacity: shadowOpacity,
                  pointerEvents: "none",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {currentTitle && (
        <div
          style={{
            marginTop: `${24 * scale}px`,
            fontSize: `${20 * scale}px`,
            color: "rgba(255, 255, 255, 0.7)",
            fontWeight: 500,
            letterSpacing: "0.05em",
            fontFamily: "monospace",
          }}
        >
          {currentTitle}
        </div>
      )}
    </div>
  );
}
