import { create } from "zustand";
import type { EditingTemplatePrimitive, HtmlTemplateClip } from "./types";

interface HtmlTemplateStore {
  clips: HtmlTemplateClip[];
  // Simple temporal undo stack — snapshots of clips before each mutation
  _undoStack: HtmlTemplateClip[][];

  addClip(
    templateId: string,
    startTime: number,
    duration: number,
    values: Record<string, EditingTemplatePrimitive>,
    trackId?: string,
  ): HtmlTemplateClip;

  updateClip(
    id: string,
    updates: Partial<Omit<HtmlTemplateClip, "id" | "templateId">>,
  ): void;

  updateValues(
    id: string,
    values: Record<string, EditingTemplatePrimitive>,
  ): void;

  removeClip(id: string): void;

  getClipsAtTime(time: number): HtmlTemplateClip[];

  undo(): void;

  clearAll(): void;

  setClips(clips: HtmlTemplateClip[]): void;
}

export const useHtmlTemplateStore = create<HtmlTemplateStore>()(
  (set, get) => ({
      clips: [],
      _undoStack: [],

      addClip(templateId, startTime, duration, values, trackId) {
        const clip: HtmlTemplateClip = {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10),
          trackId: trackId ?? "html-overlay",
          startTime,
          duration,
          templateId,
          values,
          position: { x: 0.5, y: 0.5 },
          scale: { x: 1, y: 1 },
          opacity: 1,
        };
        set((s) => ({
          _undoStack: [...s._undoStack.slice(-20), s.clips],
          clips: [...s.clips, clip],
        }));
        return clip;
      },

      updateClip(id, updates) {
        set((s) => ({
          _undoStack: [...s._undoStack.slice(-20), s.clips],
          clips: s.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      updateValues(id, values) {
        set((s) => ({
          _undoStack: [...s._undoStack.slice(-20), s.clips],
          clips: s.clips.map((c) =>
            c.id === id ? { ...c, values: { ...c.values, ...values } } : c,
          ),
        }));
      },

      removeClip(id) {
        set((s) => ({
          _undoStack: [...s._undoStack.slice(-20), s.clips],
          clips: s.clips.filter((c) => c.id !== id),
        }));
      },

      getClipsAtTime(time) {
        return get().clips.filter(
          (c) => time >= c.startTime && time < c.startTime + c.duration,
        );
      },

      undo() {
        set((s) => {
          if (s._undoStack.length === 0) return s;
          const prev = s._undoStack[s._undoStack.length - 1];
          return {
            clips: prev,
            _undoStack: s._undoStack.slice(0, -1),
          };
        });
      },

      clearAll() {
        set({ clips: [], _undoStack: [] });
      },

      /** Replace all clips (used when loading/recovering a project). */
      setClips(clips: HtmlTemplateClip[]) {
        set({ clips, _undoStack: [] });
      },
    }),
);
