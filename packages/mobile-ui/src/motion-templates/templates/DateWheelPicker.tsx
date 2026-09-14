import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

function getMonthNames(locale?: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale || "en-US", { month: "long" });
  return Array.from({ length: 12 }, (_, i) =>
    formatter.format(new Date(2000, i, 1))
  );
}

interface DeterministicWheelColumnProps {
  items: (string | number)[];
  value: number; // can be float for smooth scrolling!
  itemHeight: number;
  visibleItems: number;
  width: string;
}

function DeterministicWheelColumn({
  items,
  value,
  itemHeight,
  visibleItems,
  width,
}: DeterministicWheelColumnProps) {
  const centerOffset = Math.floor(visibleItems / 2) * itemHeight;
  const yOffset = -value * itemHeight;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: itemHeight * visibleItems,
        width,
      }}
    >
      {/* Fade Overlays */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{
          height: centerOffset,
          background: "linear-gradient(to bottom, #09090b 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          height: centerOffset,
          background: "linear-gradient(to top, #09090b 0%, transparent 100%)",
        }}
      />

      {/* Selected Indicator */}
      <div
        className="absolute inset-x-0 z-5 pointer-events-none border-y border-zinc-800 bg-zinc-900/20"
        style={{
          top: centerOffset,
          height: itemHeight,
        }}
      />

      {/* Scrolling Container */}
      <div
        style={{
          transform: `translateY(${yOffset + centerOffset}px)`,
          position: "absolute",
          width: "100%",
        }}
      >
        {items.map((item, index) => {
          const offset = index * itemHeight + yOffset + centerOffset;
          // Calculate 3D transforms based on relative offset from center
          const relativeOffset = (offset - centerOffset) / itemHeight;
          const rotateX = Math.min(90, Math.max(-90, relativeOffset * -25));
          const scale = Math.max(0.7, 1 - Math.abs(relativeOffset) * 0.08);
          const opacity = Math.max(0.1, 1 - Math.abs(relativeOffset) * 0.25);

          return (
            <div
              key={`${item}-${index}`}
              className="flex items-center justify-center select-none"
              style={{
                height: itemHeight,
                transform: `rotateX(${rotateX}deg) scale(${scale})`,
                opacity,
                transformStyle: "preserve-3d",
                transition: "opacity 0.1s ease-out",
              }}
            >
              <span
                style={{
                  fontWeight: Math.abs(relativeOffset) < 0.5 ? 700 : 500,
                  color: Math.abs(relativeOffset) < 0.5 ? "#ffffff" : "#71717a",
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DateWheelPickerTemplate({ time, width, height, values }: HtmlTemplateProps) {
  const startYear = Number(values.startYear ?? 1990);
  const endYear = Number(values.endYear ?? 2026);
  const duration = Number(values.duration ?? 8);
  const titleText = String(values.title ?? "TIMELINE TRAVEL");
  
  const scaleFactor = Math.min(width, height) / 1080;
  const scaledItemHeight = Math.max(30, Math.floor(ITEM_HEIGHT * scaleFactor));

  // Months
  const months = useMemo(() => getMonthNames(), []);

  // Years array
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = endYear; y >= startYear; y--) {
      arr.push(y);
    }
    // If empty array, default to a fallback
    if (arr.length === 0) arr.push(2026);
    return arr;
  }, [startYear, endYear]);

  // Floating progress over time
  const progress = (time / duration) % 1.0;
  
  // Custom smooth scroll computation:
  // We want the wheel columns to scroll smoothly over the years, months, and days.
  // Instead of jumping, we map the progress to floating wheel indices.
  
  const totalMonths = (endYear - startYear + 1) * 12;
  const currentFloatingMonth = progress * totalMonths;
  
  const currentYearVal = endYear - Math.floor(currentFloatingMonth / 12);
  const currentMonthVal = Math.floor(currentFloatingMonth) % 12;
  
  // Calculate days list for the active month
  const daysInMonth = new Date(currentYearVal, currentMonthVal + 1, 0).getDate();
  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  const yearIndexFloat = currentFloatingMonth / 12;
  const monthIndexFloat = currentFloatingMonth % 12;
  
  // Day scroll progress based on remaining fraction of the month
  const dayIndexFloat = (currentFloatingMonth % 1.0) * daysInMonth;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#09090b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        gap: `${32 * scaleFactor}px`,
      }}
    >
      {titleText && (
        <h2
          style={{
            fontSize: `${Math.max(20, 42 * scaleFactor)}px`,
            fontWeight: 800,
            letterSpacing: "0.3em",
            color: "#ffffff",
            textTransform: "uppercase",
            opacity: 0.9,
            marginBottom: `${20 * scaleFactor}px`,
          }}
        >
          {titleText}
        </h2>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: `${24 * scaleFactor}px`,
          fontSize: `${Math.max(14, 24 * scaleFactor)}px`,
          perspective: "1000px",
        }}
      >
        <DeterministicWheelColumn
          items={days}
          value={dayIndexFloat}
          itemHeight={scaledItemHeight}
          visibleItems={VISIBLE_ITEMS}
          width={`${80 * scaleFactor}px`}
        />

        <DeterministicWheelColumn
          items={months}
          value={monthIndexFloat}
          itemHeight={scaledItemHeight}
          visibleItems={VISIBLE_ITEMS}
          width={`${160 * scaleFactor}px`}
        />

        <DeterministicWheelColumn
          items={years}
          value={yearIndexFloat}
          itemHeight={scaledItemHeight}
          visibleItems={VISIBLE_ITEMS}
          width={`${120 * scaleFactor}px`}
        />
      </div>

      <div
        style={{
          marginTop: `${20 * scaleFactor}px`,
          fontSize: `${Math.max(12, 18 * scaleFactor)}px`,
          color: "#71717a",
          fontFamily: "monospace",
          letterSpacing: "0.1em",
        }}
      >
        ACTIVE: {days[Math.floor(dayIndexFloat) % days.length]} {months[Math.floor(monthIndexFloat)]} {years[Math.min(years.length - 1, Math.floor(yearIndexFloat))]}
      </div>
    </div>
  );
}
