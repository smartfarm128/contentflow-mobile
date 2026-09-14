import { useId, useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

function mapRange(
  value: number,
  fromLow: number,
  fromHigh: number,
  toLow: number,
  toHigh: number
): number {
  if (fromLow === fromHigh) {
    return toLow;
  }
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

export function EtherealShadowTemplate({ time, width, values }: HtmlTemplateProps) {
  const reactId = useId();
  const cleanId = reactId.replace(/:/g, "");
  const filterId = `shadowoverlay-${cleanId}`;

  // Read control values
  const color = String(values.color ?? "rgba(128, 128, 128, 1)");
  const animationScale = Number(values.animationScale ?? 100);
  const animationSpeed = Number(values.animationSpeed ?? 90);
  const noiseOpacity = Number(values.noiseOpacity ?? 1);
  const noiseScale = Number(values.noiseScale ?? 1.2);

  const text = String(values.text ?? "Ethereal Shadows");
  const textColor = String(values.textColor ?? "#ffffff");
  const maskImage = "https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png";

  const animationEnabled = animationScale > 0;
  
  // Calculate scaled displacement relative to design size (1920w)
  const baseDisplacement = animationEnabled ? mapRange(animationScale, 1, 100, 20, 100) : 0;
  const scaleFactor = width / 1920;
  const displacementScale = baseDisplacement * Math.max(0.2, scaleFactor);

  const animationDuration = mapRange(animationSpeed, 1, 100, 1000, 50);
  
  // hueRotate animation loop logic calculated deterministically based on time
  const loopDuration = (animationDuration / 25) / 1000; // in seconds
  const angle = loopDuration > 0 ? ((time / loopDuration) * 360) % 360 : 180;

  // Font size responsive scaling
  const resolvedFontSize = useMemo(() => {
    return Math.round(Math.max(16, width * 0.08));
  }, [width]);

  // SVG Base Frequencies
  const baseFreqX = mapRange(animationScale, 0, 100, 0.001, 0.0005);
  const baseFreqY = mapRange(animationScale, 0, 100, 0.004, 0.002);

  return (
    <div
      style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#000000",
      }}
    >
      {/* Background shape with motion filter */}
      <div
        style={{
          position: "absolute",
          inset: -displacementScale,
          filter: animationEnabled ? `url(#${filterId}) blur(4px)` : "none",
        }}
      >
        {animationEnabled && (
          <svg
            style={{
              position: "absolute",
              width: 0,
              height: 0,
            }}
          >
            <defs>
              <filter id={filterId}>
                <feTurbulence
                  result="undulation"
                  numOctaves="2"
                  baseFrequency={`${baseFreqX},${baseFreqY}`}
                  seed="0"
                  type="turbulence"
                />
                <feColorMatrix
                  in="undulation"
                  type="hueRotate"
                  values={String(angle)}
                />
                <feColorMatrix
                  in="dist"
                  result="circulation"
                  type="matrix"
                  values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="circulation"
                  scale={displacementScale}
                  result="dist"
                />
                <feDisplacementMap
                  in="dist"
                  in2="undulation"
                  scale={displacementScale}
                  result="output"
                />
              </filter>
            </defs>
          </svg>
        )}
        <div
          style={{
            backgroundColor: color,
            maskImage: `url('${maskImage}')`,
            WebkitMaskImage: `url('${maskImage}')`,
            maskSize: "cover",
            WebkitMaskSize: "cover",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {/* Styled text overlay */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          width: "90%",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            fontSize: `${resolvedFontSize}px`,
            fontWeight: "bold",
            color: textColor,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            textShadow: "0 10px 30px rgba(0,0,0,0.5)",
            fontFamily: "Inter, sans-serif",
            margin: 0,
          }}
        >
          {text}
        </h1>
      </div>

      {/* Noise background overlay */}
      {noiseOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
            backgroundSize: `${noiseScale * 200 * Math.max(0.5, scaleFactor)}px`,
            backgroundRepeat: "repeat",
            opacity: noiseOpacity / 2,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
