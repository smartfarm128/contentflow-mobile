"use client";

import type { HtmlTemplateProps } from "../types";

export function WarningGraphicTemplate({ time, values }: HtmlTemplateProps) {
  const width = Number(values.width ?? 354);
  const height = Number(values.height ?? 115);
  const color = String(values.color ?? "#FDC221");
  const cycleDuration = Number(values.cycleDuration ?? 6.0);

  const progress = (time % cycleDuration) / cycleDuration;

  // Determine stage variables driven deterministically by playhead progress (0 to 1)
  let overallOpacity = 1;
  if (progress > 0.85) {
    overallOpacity = Math.max(0, 1 - (progress - 0.85) / 0.15);
  }

  // Phase 1: Background/corner path lines draw from inside out
  let pathLinesLength = 0;
  if (progress <= 0.2) {
    pathLinesLength = progress / 0.2;
  } else if (progress > 0.85) {
    pathLinesLength = Math.max(0, 1 - (progress - 0.85) / 0.15);
  } else {
    pathLinesLength = 1;
  }

  // Phase 2: Main warning triangle outline draws
  let triangleLength = 0;
  if (progress > 0.1 && progress <= 0.3) {
    triangleLength = (progress - 0.1) / 0.2;
  } else if (progress > 0.3 && progress <= 0.85) {
    triangleLength = 1;
  } else if (progress > 0.85) {
    triangleLength = Math.max(0, 1 - (progress - 0.85) / 0.15);
  }

  // Phase 3: Interior stripes animate from center outward
  let stripesScale = 0;
  if (progress > 0.25 && progress <= 0.45) {
    stripesScale = (progress - 0.25) / 0.2;
  } else if (progress > 0.45 && progress <= 0.85) {
    stripesScale = 1;
  } else if (progress > 0.85) {
    stripesScale = Math.max(0, 1 - (progress - 0.85) / 0.15);
  }

  // Phase 4: Exclamation mark with overshoot (0 -> 1.3 -> 1.0)
  let exclamationScale = 0;
  let exclamationOpacity = 0;
  if (progress > 0.35 && progress <= 0.55) {
    const t = (progress - 0.35) / 0.2; // 0 to 1
    exclamationOpacity = t;
    if (t < 0.7) {
      exclamationScale = (t / 0.7) * 1.3;
    } else {
      exclamationScale = 1.3 - ((t - 0.7) / 0.3) * 0.3;
    }
  } else if (progress > 0.55 && progress <= 0.85) {
    exclamationScale = 1;
    exclamationOpacity = 1;
  } else if (progress > 0.85) {
    exclamationScale = Math.max(0, 1 - (progress - 0.85) / 0.15);
    exclamationOpacity = Math.max(0, 1 - (progress - 0.85) / 0.15);
  }

  // Phase 5: Corner rectangles fade and scale in last
  let rectScale = 0;
  let rectOpacity = 0;
  if (progress > 0.45 && progress <= 0.6) {
    const t = (progress - 0.45) / 0.15;
    rectScale = t;
    rectOpacity = t;
  } else if (progress > 0.6 && progress <= 0.85) {
    rectScale = 1;
    rectOpacity = 1;
  } else if (progress > 0.85) {
    rectScale = Math.max(0, 1 - (progress - 0.85) / 0.15);
    rectOpacity = Math.max(0, 1 - (progress - 0.85) / 0.15);
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-4 bg-zinc-950">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 176.958 57.531"
        style={{
          opacity: overallOpacity,
          transition: "opacity 0.05s linear",
        }}
      >
        <g>
          {/* Corner rectangles */}
          <rect
            y="25.128"
            width="0.538"
            height="0.538"
            transform="translate(-25.128 25.666) rotate(-90)"
            fill={color}
            style={{
              opacity: rectOpacity,
              transform: `translate(-25.128px, 25.666px) rotate(-90deg) scale(${rectScale})`,
              transformOrigin: "center",
              transition: "transform 0.05s linear, opacity 0.05s linear",
            }}
          />
          <rect
            y="22.449"
            width="0.538"
            height="0.538"
            transform="translate(-22.449 22.987) rotate(-90)"
            fill={color}
            style={{
              opacity: rectOpacity,
              transform: `translate(-22.449px, 22.987px) rotate(-90deg) scale(${rectScale})`,
              transformOrigin: "center",
              transition: "transform 0.05s linear, opacity 0.05s linear",
            }}
          />
          <rect
            x="176.42"
            y="25.128"
            width="0.538"
            height="0.538"
            transform="translate(151.292 202.086) rotate(-90)"
            fill={color}
            style={{
              opacity: rectOpacity,
              transform: `translate(151.292px, 202.086px) rotate(-90deg) scale(${rectScale})`,
              transformOrigin: "center",
              transition: "transform 0.05s linear, opacity 0.05s linear",
            }}
          />
          <rect
            x="176.42"
            y="22.449"
            width="0.538"
            height="0.538"
            transform="translate(153.971 199.408) rotate(-90)"
            fill={color}
            style={{
              opacity: rectOpacity,
              transform: `translate(153.971px, 199.408px) rotate(-90deg) scale(${rectScale})`,
              transformOrigin: "center",
              transition: "transform 0.05s linear, opacity 0.05s linear",
            }}
          />

          {/* Background/corner path lines */}
          <g>
            <path
              d="M25.949,24.432H5.565a.375.375,0,0,1,0-.75H25.52l8.068-13.7H59.015a.375.375,0,0,1,0,.75h-25Z"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: 100 * (1 - pathLinesLength),
                opacity: 0.3 * pathLinesLength,
                transition: "stroke-dashoffset 0.05s linear, opacity 0.05s linear",
              }}
            />
            <path
              d="M171.393,24.432H151.009l-8.068-13.7h-25a.375.375,0,0,1,0-.75H143.37l8.068,13.7h19.955a.375.375,0,0,1,0,.75Z"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: 100 * (1 - pathLinesLength),
                opacity: 0.3 * pathLinesLength,
                transition: "stroke-dashoffset 0.05s linear, opacity 0.05s linear",
              }}
            />
            <path
              d="M57.3,57.531a.375.375,0,0,1-.321-.182L47.147,41.043H18.507l-7.71-7.71H7.66a.375.375,0,1,1,0-.75h3.448l7.709,7.71H47.571L57.623,56.962a.376.376,0,0,1-.127.515A.382.382,0,0,1,57.3,57.531Z"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: 100 * (1 - pathLinesLength),
                opacity: 0.3 * pathLinesLength,
                transition: "stroke-dashoffset 0.05s linear, opacity 0.05s linear",
              }}
            />
            <path
              d="M119.656,57.531a.376.376,0,0,1-.321-.569l10.052-16.669h28.754l7.709-7.71H169.3a.375.375,0,0,1,0,.75h-3.137l-7.71,7.71h-28.64l-9.833,16.306A.377.377,0,0,1,119.656,57.531Z"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: 100 * (1 - pathLinesLength),
                opacity: 0.3 * pathLinesLength,
                transition: "stroke-dashoffset 0.05s linear, opacity 0.05s linear",
              }}
            />
          </g>

          {/* Main warning triangle outline */}
          <path
            d="M93.582,1l26.746,46.327-5.1,8.828H61.737L56.63,47.326,83.377,1h10.2m.577-1H82.8L55.475,47.327l5.685,9.828h54.648l5.675-9.828L94.159,0Z"
            fill={color}
            style={{
              strokeDasharray: 300,
              strokeDashoffset: 300 * (1 - triangleLength),
              opacity: triangleLength,
              transition: "stroke-dashoffset 0.05s linear, opacity 0.05s linear",
            }}
          />

          {/* Interior stripes */}
          <g>
            {/* Left side stripes */}
            <polygon
              points="51.838 37.309 61.852 37.309 75.448 13.85 65.434 13.85 51.838 37.309"
              fill={color}
              style={{
                transform: `scaleX(${stripesScale})`,
                transformOrigin: "right center",
                opacity: stripesScale,
                transition: "transform 0.05s linear, opacity 0.05s linear",
              }}
            />
            <polygon
              points="37.422 37.309 47.436 37.309 61.033 13.85 51.019 13.85 37.422 37.309"
              fill={color}
              style={{
                transform: `scaleX(${stripesScale})`,
                transformOrigin: "right center",
                opacity: stripesScale,
                transition: "transform 0.05s linear, opacity 0.05s linear",
              }}
            />
            <polygon
              points="23.007 37.309 33.021 37.309 46.617 13.85 36.603 13.85 23.007 37.309"
              fill={color}
              style={{
                transform: `scaleX(${stripesScale})`,
                transformOrigin: "right center",
                opacity: stripesScale,
                transition: "transform 0.05s linear, opacity 0.05s linear",
              }}
            />

            {/* Right side stripes */}
            <polygon
              points="125.121 37.309 115.107 37.309 101.51 13.85 111.524 13.85 125.121 37.309"
              fill={color}
              style={{
                transform: `scaleX(${stripesScale})`,
                transformOrigin: "left center",
                opacity: stripesScale,
                transition: "transform 0.05s linear, opacity 0.05s linear",
              }}
            />
            <polygon
              points="139.536 37.309 129.522 37.309 115.926 13.85 125.94 13.85 139.536 37.309"
              fill={color}
              style={{
                transform: `scaleX(${stripesScale})`,
                transformOrigin: "left center",
                opacity: stripesScale,
                transition: "transform 0.05s linear, opacity 0.05s linear",
              }}
            />
            <polygon
              points="153.951 37.309 143.937 37.309 130.341 13.85 140.355 13.85 153.951 37.309"
              fill={color}
              style={{
                transform: `scaleX(${stripesScale})`,
                transformOrigin: "left center",
                opacity: stripesScale,
                transition: "transform 0.05s linear, opacity 0.05s linear",
              }}
            />
          </g>

          {/* Exclamation mark with overshoot */}
          <path
            d="M88.469,38.939a3.158,3.158,0,0,1,2.29.838,3.058,3.058,0,0,1,0,4.269,3.521,3.521,0,0,1-4.56,0,2.827,2.827,0,0,1-.868-2.125,2.858,2.858,0,0,1,.868-2.134A3.11,3.11,0,0,1,88.469,38.939Zm2.339-3.079H86.13l-.662-19.666h6Z"
            fill={color}
            style={{
              opacity: exclamationOpacity,
              transform: `scale(${exclamationScale})`,
              transformOrigin: "88px 30px",
              transition: "transform 0.05s linear, opacity 0.05s linear",
            }}
          />
        </g>
      </svg>
    </div>
  );
}

export default WarningGraphicTemplate;
