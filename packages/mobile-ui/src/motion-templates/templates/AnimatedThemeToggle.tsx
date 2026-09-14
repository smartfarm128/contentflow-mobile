import type { HtmlTemplateProps } from "../types";

export function AnimatedThemeToggleTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 4.0);
  const accentColor = String(values.accentColor ?? "#ffffff");
  const backgroundColor = String(values.backgroundColor ?? "#09090b");
  const borderCol = String(values.borderColor ?? "rgba(255, 255, 255, 0.15)");

  const halfCycle = cycleDuration / 2;
  const t = time % cycleDuration;
  const isDarkState = t >= halfCycle;

  let scaleMoon = 0;
  let scaleSun = 0;

  if (isDarkState) {
    const progress = Math.min(1, (t - halfCycle) / 0.7);
    scaleMoon = progress;
    scaleSun = 1 - progress;
  } else {
    const progress = Math.min(1, t / 0.7);
    scaleMoon = 1 - progress;
    scaleSun = progress;
  }

  const pathLengthMoon = scaleMoon >= 0.6 ? (scaleMoon - 0.6) / 0.4 : 0;
  const pathLengthSun = scaleSun >= 0.6 ? (scaleSun - 0.6) / 0.4 : 0;

  const compositionHeight = 200;
  const scaleFactor = Math.min(width, height) / compositionHeight;
  const toggleSize = 64 * scaleFactor;
  const svgSize = 28 * scaleFactor;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${toggleSize}px`,
          height: `${toggleSize}px`,
          borderRadius: `${12 * scaleFactor}px`,
          border: `1.5px solid ${borderCol}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
          backgroundColor: isDarkState ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
        }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sun Rays & Circle */}
          {scaleSun > 0 && (
            <>
              {/* Sun center */}
              <path
                d="M12.4058 17.7625C15.1672 17.7625 17.4058 15.5239 17.4058 12.7625C17.4058 10.0011 15.1672 7.76251 12.4058 7.76251C9.64434 7.76251 7.40576 10.0011 7.40576 12.7625C7.40576 15.5239 9.64434 17.7625 12.4058 17.7625Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: `scale(${scaleSun})`,
                  transformOrigin: "12.4px 12.7px",
                  strokeDasharray: 100,
                  strokeDashoffset: (1 - pathLengthSun) * 100,
                }}
              />
              {/* Rays */}
              {[
                "M12.4058 1.76251V3.76251",
                "M12.4058 21.7625V23.7625",
                "M4.62598 4.98248L6.04598 6.40248",
                "M18.7656 19.1225L20.1856 20.5425",
                "M1.40576 12.7625H3.40576",
                "M21.4058 12.7625H23.4058",
                "M4.62598 20.5425L6.04598 19.1225",
                "M18.7656 6.40248L20.1856 4.98248"
              ].map((d, index) => (
                <path
                  key={index}
                  d={d}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: `scale(${scaleSun})`,
                    transformOrigin: "12.4px 12.7px",
                    strokeDasharray: 10,
                    strokeDashoffset: (1 - pathLengthSun) * 10,
                  }}
                />
              ))}
            </>
          )}

          {/* Moon crescent */}
          {scaleMoon > 0 && (
            <path
              d="M21.1918 13.2013C21.0345 14.9035 20.3957 16.5257 19.35 17.8781C18.3044 19.2305 16.8953 20.2571 15.2875 20.8379C13.6797 21.4186 11.9398 21.5294 10.2713 21.1574C8.60281 20.7854 7.07479 19.9459 5.86602 18.7371C4.65725 17.5283 3.81774 16.0003 3.4457 14.3318C3.07367 12.6633 3.18451 10.9234 3.76526 9.31561C4.346 7.70783 5.37263 6.29868 6.72501 5.25307C8.07739 4.20746 9.69959 3.56862 11.4018 3.41132C10.4052 4.75958 9.92564 6.42077 10.0503 8.09273C10.175 9.76469 10.8957 11.3364 12.0812 12.5219C13.2667 13.7075 14.8384 14.4281 16.5104 14.5528C18.1823 14.6775 19.8435 14.1979 21.1918 13.2013Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: `scale(${scaleMoon})`,
                transformOrigin: "12px 12px",
                strokeDasharray: 100,
                strokeDashoffset: (1 - pathLengthMoon) * 100,
              }}
            />
          )}
        </svg>
      </div>
    </div>
  );
}
