import React, { useMemo } from "react";
import { useHtmlTemplateStore } from "./html-template-store";
import { getHtmlTemplate } from "./registry";

interface HtmlMotionLayerProps {
  time: number;
  canvasWidth: number;
  canvasHeight: number;
  isPlaying?: boolean;
  selectedClipId?: string | null;
  onSelectClip?: (id: string) => void;
}

export const HtmlMotionLayer: React.FC<HtmlMotionLayerProps> = ({
  time,
  canvasWidth,
  canvasHeight,
  isPlaying = false,
  selectedClipId,
  onSelectClip,
}) => {
  const clips = useHtmlTemplateStore((s) => s.clips);

  const activeClips = useMemo(
    () =>
      clips.filter(
        (c) => time >= c.startTime && time < c.startTime + c.duration,
      ),
    [clips, time],
  );

  if (activeClips.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: isPlaying ? "none" : "auto",
        overflow: "hidden",
        zIndex: 20,
      }}
    >
      {activeClips.map((clip) => {
        const template = getHtmlTemplate(clip.templateId);
        if (!template) return null;

        const { Component } = template;
        const progress =
          clip.duration > 0
            ? Math.max(0, Math.min(1, (time - clip.startTime) / clip.duration))
            : 0;

        const mergedValues = {
          ...Object.fromEntries(
            template.controls.map((c) => [c.id, c.defaultValue]),
          ),
          ...clip.values,
        };

        const isSelected = selectedClipId === clip.id;

        return (
          <div
            key={clip.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectClip?.(clip.id);
            }}
            style={{
              position: "absolute",
              left: `${(clip.position.x - clip.scale.x / 2) * 100}%`,
              top: `${(clip.position.y - clip.scale.y / 2) * 100}%`,
              width: `${clip.scale.x * 100}%`,
              height: `${clip.scale.y * 100}%`,
              opacity: clip.opacity,
              cursor: "pointer",
              outline: isSelected ? "2px solid #00f2fe" : "none",
              outlineOffset: "2px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              <Component
                progress={progress}
                time={time}
                width={canvasWidth * clip.scale.x}
                height={canvasHeight * clip.scale.y}
                values={mergedValues}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
