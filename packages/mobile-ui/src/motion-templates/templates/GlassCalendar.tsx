"use client";

import { useMemo } from "react";
import { Settings, Plus, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isToday, startOfMonth } from "date-fns";
import type { HtmlTemplateProps } from "../types";

export function GlassCalendarTemplate({ time, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 10.0);
  const showBackground = values.showBackground !== false;

  const progress = (time % cycleDuration) / cycleDuration; // 0 to 1

  // Determine scroll translation back and forth
  const scrollOffset = useMemo(() => {
    // Smoother back and forth scroll using sine wave
    const wave = Math.sin(progress * Math.PI * 2); // -1 to 1
    return wave * 180; // range from -180px to 180px
  }, [progress]);

  // Determine selected day index based on time
  const selectedDayOffset = useMemo(() => {
    // Cycles active index from 0 to 6
    return Math.floor(progress * 7);
  }, [progress]);

  // Base month date
  const currentMonth = useMemo(() => {
    return new Date(2026, 6, 1); // July 2026
  }, []);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const days = [];
    for (let i = 0; i < 31; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), i + 1);
      days.push({
        date,
        isToday: isToday(date),
        isSelected: i === (12 + selectedDayOffset), // Highlight a block of days around mid-month
      });
    }
    return days;
  }, [currentMonth, selectedDayOffset]);

  const backgroundImageUrl = "https://plus.unsplash.com/premium_photo-1673873438024-81d29f555b95?w=900&auto=format&fit=crop&q=60";

  return (
    <div
      className="flex h-full w-full items-center justify-center bg-cover bg-center p-4 bg-zinc-950"
      style={showBackground ? { backgroundImage: `url(${backgroundImageUrl})` } : undefined}
    >
      <div
        className="w-full max-w-[360px] rounded-3xl p-5 shadow-2xl overflow-hidden bg-black/20 backdrop-blur-xl border border-white/10 text-white font-sans"
      >
        {/* Header: Tabs and Settings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 rounded-lg bg-black/20 p-1">
            <button className="rounded-md bg-white px-4 py-1 text-xs font-bold text-black shadow-md">
              Weekly
            </button>
            <button className="rounded-md px-4 py-1 text-xs font-semibold text-white/60">
              Monthly
            </button>
          </div>
          <button className="p-2 text-white/70 rounded-full hover:bg-black/20">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Date Display and Navigation */}
        <div className="my-6 flex items-center justify-between">
          <p className="text-4xl font-bold tracking-tight">
            {format(currentMonth, "MMMM")}
          </p>
          <div className="flex items-center space-x-2">
            <button className="p-1 rounded-full text-white/70 hover:bg-black/20">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="p-1 rounded-full text-white/70 hover:bg-black/20">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Monthly Calendar Grid (Driven by playhead scrollOffset) */}
        <div className="overflow-hidden -mx-5 px-5">
          <div
            className="flex space-x-4 transition-all duration-100 ease-linear"
            style={{
              transform: `translateX(${scrollOffset}px)`,
            }}
          >
            {monthDays.map((day) => (
              <div key={day.date.getDate()} className="flex flex-col items-center space-y-2 flex-shrink-0">
                <span className="text-xs font-bold text-white/50">
                  {format(day.date, "E").charAt(0)}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold relative transition-all duration-300 ${
                    day.isSelected
                      ? "bg-gradient-to-br from-pink-500 to-orange-400 text-white shadow-lg scale-110"
                      : "text-white"
                  }`}
                >
                  {day.isToday && !day.isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-pink-400" />
                  )}
                  {day.date.getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 h-px bg-white/20" />

        {/* Footer Actions */}
        <div className="mt-4 flex items-center justify-between space-x-4">
          <button className="flex items-center space-x-2 text-sm font-medium text-white/70 hover:text-white">
            <Edit2 className="h-4 w-4" />
            <span>Add a note...</span>
          </button>
          <button className="flex items-center space-x-2 rounded-lg bg-black/20 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-black/30">
            <Plus className="h-4 w-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GlassCalendarTemplate;
