import React from "react";
import type { HtmlTemplateProps } from "../types";
import { placeholderLogo } from "../local-placeholder";

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function CalendarTemplate({
  progress,
  width,
  height,
  values,
}: HtmlTemplateProps) {
  const scaleFactor = Math.min(width, height) / 1080;

  const title = String(values.title ?? "Any questions about Design?");
  const subtitle = String(values.subtitle ?? "Feel free to reach out to me!");
  const bookingLink = String(values.bookingLink ?? placeholderLogo("mdesignali"));
  const bookingButtonText = String(values.bookingButtonText ?? "Book Now");
  const durationText = String(values.durationText ?? "30 min call");
  const accentColor = String(values.accentColor ?? "#6366f1");

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(
    currentYear,
    currentDate.getMonth() + 1,
    0
  ).getDate();

  // Deterministic animation states based on progress
  const introOpacity = progress < 0.15 ? progress / 0.15 : 1;
  const introY = progress < 0.15 ? (1 - progress / 0.15) * 40 * scaleFactor : 0;

  // Pulse effect for the button
  const buttonScale = 1 + 0.03 * Math.sin(progress * Math.PI * 6);

  // Stagger grid day cells fade-in
  const renderCalendarDays = () => {
    const totalSlots = dayNames.length + firstDayOfWeek + daysInMonth;
    const days: React.ReactNode[] = [];

    // Header names
    dayNames.forEach((day, index) => {
      const cellProgressStart = 0.1 + (index / totalSlots) * 0.4;
      const cellProgressEnd = cellProgressStart + 0.1;
      let opacity = 0;
      if (progress > cellProgressEnd) {
        opacity = 1;
      } else if (progress > cellProgressStart) {
        opacity = (progress - cellProgressStart) / (cellProgressEnd - cellProgressStart);
      }

      days.push(
        <div
          key={`header-${day}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${11 * scaleFactor}px`,
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.4)",
            opacity,
          }}
        >
          {day}
        </div>
      );
    });

    // Empty cells
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const globalIndex = dayNames.length + firstDayOfWeek + i - 1;
      const cellProgressStart = 0.1 + (globalIndex / totalSlots) * 0.4;
      const cellProgressEnd = cellProgressStart + 0.1;
      let opacity = 0;
      if (progress > cellProgressEnd) {
        opacity = 1;
      } else if (progress > cellProgressStart) {
        opacity = (progress - cellProgressStart) / (cellProgressEnd - cellProgressStart);
      }

      const isBooked = [3, 8, 12, 19, 24].includes(i);

      days.push(
        <div
          key={`day-${i}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: `${32 * scaleFactor}px`,
            height: `${32 * scaleFactor}px`,
            borderRadius: `${10 * scaleFactor}px`,
            backgroundColor: isBooked ? accentColor : "transparent",
            color: isBooked ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
            fontSize: `${13 * scaleFactor}px`,
            fontWeight: 500,
            opacity,
            boxShadow: isBooked ? `0 0 10px ${accentColor}80` : "none",
          }}
        >
          {i}
        </div>
      );
    }

    return days;
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0d0d0d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
        padding: `${40 * scaleFactor}px`,
      }}
    >
      <div
        style={{
          width: `${860 * scaleFactor}px`,
          backgroundColor: "#171717",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: `${24 * scaleFactor}px`,
          padding: `${32 * scaleFactor}px`,
          display: "flex",
          gap: `${40 * scaleFactor}px`,
          opacity: introOpacity,
          transform: `translate3d(0, ${introY}px, 0)`,
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Left column info */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontSize: `${36 * scaleFactor}px`,
              fontWeight: 700,
              color: "#ffffff",
              margin: `0 0 ${16 * scaleFactor}px 0`,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: `${16 * scaleFactor}px`,
              color: "rgba(255,255,255,0.5)",
              margin: `0 0 ${32 * scaleFactor}px 0`,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>

          <a
            href={bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#ffffff",
              color: "#000000",
              fontWeight: 600,
              fontSize: `${15 * scaleFactor}px`,
              padding: `${12 * scaleFactor}px ${28 * scaleFactor}px`,
              borderRadius: `${12 * scaleFactor}px`,
              textDecoration: "none",
              transform: `scale(${buttonScale})`,
              boxShadow: "0 4px 15px rgba(255,255,255,0.2)",
            }}
          >
            {bookingButtonText}
          </a>
        </div>

        {/* Right column calendar grid */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: `${340 * scaleFactor}px`,
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: `${20 * scaleFactor}px`,
              padding: `${20 * scaleFactor}px`,
            }}
          >
            {/* Header info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: `${8 * scaleFactor}px`,
                marginBottom: `${20 * scaleFactor}px`,
              }}
            >
              <span
                style={{
                  fontSize: `${15 * scaleFactor}px`,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                {currentMonth}, {currentYear}
              </span>
              <span
                style={{
                  width: `${4 * scaleFactor}px`,
                  height: `${4 * scaleFactor}px`,
                  borderRadius: "50%",
                  backgroundColor: accentColor,
                }}
              />
              <span
                style={{
                  fontSize: `${13 * scaleFactor}px`,
                  color: "rgba(255, 255, 255, 0.4)",
                }}
              >
                {durationText}
              </span>
            </div>

            {/* Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: `${10 * scaleFactor}px`,
                justifyItems: "center",
              }}
            >
              {renderCalendarDays()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
