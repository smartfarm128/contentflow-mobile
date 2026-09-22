/**
 * HTML/React motion-graphic template system.
 *
 * Every registered template is a pure, deterministic React component:
 * animation is a function of `progress` (0–1) and `time` (seconds),
 * never driven by hover/click/setInterval/Date.now — so playhead-scrubbing
 * and the Phase-3 Chromium export both get the exact same frame.
 */

import type { FC } from "react";

export type EditingTemplatePrimitive = string | number | boolean;

// ─── Component contract ───────────────────────────────────────────────────────

export interface HtmlTemplateProps {
  /** Clip-local 0→1 progress (0 = clip start, 1 = clip end) */
  progress: number;
  /** Absolute timeline time in seconds */
  time: number;
  /** Canvas render width in px */
  width: number;
  /** Canvas render height in px */
  height: number;
  /** User-editable control values */
  values: Record<string, EditingTemplatePrimitive>;
}

export type HtmlTemplateComponent = FC<HtmlTemplateProps>;

// ─── Control definition (reuse same shape as editing-templates) ───────────────

export type HtmlTemplateControlType = "text" | "color" | "number" | "toggle" | "select" | "image";

export interface HtmlTemplateControlOption {
  label: string;
  value: EditingTemplatePrimitive;
}

export interface HtmlTemplateControl {
  id: string;
  label: string;
  type: HtmlTemplateControlType;
  defaultValue: EditingTemplatePrimitive;
  min?: number;
  max?: number;
  step?: number;
  options?: HtmlTemplateControlOption[];
}

// ─── Registry entry ───────────────────────────────────────────────────────────

export interface HtmlTemplate {
  id: string;
  name: string;
  description: string;
  /** Matches editing-template category so it shows in the same Motion Graphics tab */
  category: "motion-graphics";
  tags: string[];
  controls: HtmlTemplateControl[];
  /** Default clip duration in seconds */
  defaultDuration: number;
  /** "16:9" | "9:16" | "1:1" | "any" */
  aspectHint: string;
  Component: HtmlTemplateComponent;
}

// ─── Timeline clip ───────────────────────────────────────────────────────────
// A template clip is a REAL editor-core `graphic` element now, not a local
// shape: see motion-templates/engine-bridge.ts. The former `HtmlTemplateClip`
// interface (and the Zustand store that held them) is gone -- it was a
// parallel copy of timeline state the engine could not see, which is why a
// template had no timeline row, no selection box and no export.
