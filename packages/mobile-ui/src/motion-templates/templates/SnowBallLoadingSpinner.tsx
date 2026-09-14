"use client";

import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function SnowBallLoadingSpinnerTemplate({ time }: HtmlTemplateProps) {
  const cycleDuration = 3.0;
  const progress = (time % cycleDuration) / cycleDuration;

  // Ball trajectory rotation and translate
  const { ballAngle, ballTranslateY } = useMemo(() => {
    const angle = progress * 360;
    const translateY = progress <= 0.5 
      ? -6.5 + (progress / 0.5) * 0.5 
      : -6.0 - ((progress - 0.5) / 0.5) * 0.5;
    return { ballAngle: angle, ballTranslateY: translateY };
  }, [progress]);

  // Rotations for shadows
  const innerShadowAngle = -progress * 360;
  const outerShadowAngle = 20 - progress * 360;

  // Horizontal texture scroll
  const textureTranslateX = ((time % 0.25) / 0.25) * 50;

  // Track cover rotation
  const trackCoverAngle = progress * 360;

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="pl">
        <style dangerouslySetInnerHTML={{ __html: `
          .pl, 
          .pl__ball, 
          .pl__ball-inner-shadow, 
          .pl__ball-side-shadows, 
          .pl__ball-texture, 
          .pl__inner-ring, 
          .pl__outer-ring, 
          .pl__track-cover {
            border-radius: 50%;
          }
          .pl {
            position: relative;
            width: 16em;
            height: 16em;
          }
          .pl__ball, 
          .pl__ball-inner-shadow, 
          .pl__ball-outer-shadow, 
          .pl__ball-texture, 
          .pl__inner-ring, 
          .pl__outer-ring, 
          .pl__track-cover {
            position: absolute;
          }
          .pl__outer-ring {
            box-shadow: 0 -0.45em 0.375em hsla(0, 0%, 0%, 0.15), 
                        0 0.5em 0.75em hsla(0, 0%, 0%, 0.15) inset, 
                        0 0.25em 0.5em hsla(0, 0%, 100%, 0.4), 
                        0 -0.5em 0.75em hsla(0, 0%, 100%, 0.4) inset;
            top: 0.75em;
            left: 0.75em;
            width: calc(100% - 1.5em);
            height: calc(100% - 1.5em);
          }
          .pl__inner-ring {
            box-shadow: 0 -0.25em 0.5em hsla(0, 0%, 100%, 0.4), 
                        0 0.5em 0.75em hsla(0, 0%, 100%, 0.4) inset, 
                        0 0.5em 0.375em hsla(0, 0%, 0%, 0.15), 
                        0 -0.5em 0.75em hsla(0, 0%, 0%, 0.15) inset;
            top: 2.375em;
            left: 2.375em;
            width: calc(100% - 4.75em);
            height: calc(100% - 4.75em);
          }
          .pl__ball {
            top: calc(50% - 1.25em);
            left: calc(50% - 1.25em);
            width: 2.5em;
            height: 2.5em;
          }
          .pl__track-cover {
            background: conic-gradient(hsla(223, 90%, 95%, 1) 210deg, hsla(223, 90%, 95%, 0) 270deg);
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
          .pl__ball-texture {
            overflow: hidden;
            width: 100%;
            height: 100%;
            position: relative;
          }
          .pl__ball-texture-inner {
            background: linear-gradient(90deg, #fff 0%, #e5e7eb 25%, #fff 50%, #e5e7eb 75%, #fff 100%);
            background-size: 200% 100%;
            filter: brightness(1.05);
            top: 0;
            right: 0;
            width: 200%;
            height: 100%;
            position: absolute;
          }
          .pl__ball-outer-shadow {
            background-image: linear-gradient(hsla(0, 0%, 0%, 0.15), hsla(0, 0%, 0%, 0));
            border-radius: 0 0 50% 50% / 0 0 100% 100%;
            filter: blur(2px);
            top: 50%;
            left: 0;
            width: 100%;
            height: 250%;
            transform-origin: 50% 0;
            z-index: -2;
          }
          .pl__ball-inner-shadow {
            box-shadow: 0 0.1em 0.2em hsla(0, 0%, 0%, 0.3), 
                        0 0 0.2em hsla(0, 0%, 0%, 0.1) inset, 
                        0 -1em 0.5em hsla(0, 0%, 0%, 0.15) inset;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
          }
          .pl__ball-side-shadows {
            background-color: hsla(0, 0%, 0%, 0.1);
            filter: blur(2px);
            width: 100%;
            height: 100%;
            transform: scale(0.75, 1.1);
            z-index: -1;
            top: 0;
            left: 0;
          }
        `}} />
        <div className="pl__outer-ring"></div>
        <div className="pl__inner-ring"></div>
        <div className="pl__track-cover" style={{ transform: `rotate(${trackCoverAngle}deg)` }}></div>
        <div className="pl__ball" style={{ transform: `rotate(${ballAngle}deg) translateY(${ballTranslateY}em)` }}>
          <div className="pl__ball-texture">
            <div className="pl__ball-texture-inner" style={{ transform: `translateX(${textureTranslateX}%)` }}></div>
          </div>
          <div className="pl__ball-outer-shadow" style={{ transform: `rotate(${outerShadowAngle}deg)` }}></div>
          <div className="pl__ball-inner-shadow" style={{ transform: `rotate(${innerShadowAngle}deg)` }}></div>
          <div className="pl__ball-side-shadows"></div>
        </div>
      </div>
    </div>
  );
}

export default SnowBallLoadingSpinnerTemplate;
