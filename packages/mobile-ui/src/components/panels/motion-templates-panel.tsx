import React, { useState, useMemo } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import { getAllHtmlTemplates, getHtmlTemplate } from "../../motion-templates/registry";
import { useHtmlTemplateStore } from "../../motion-templates/html-template-store";
import type { HtmlTemplate, HtmlTemplateClip } from "../../motion-templates/types";
import { Plus, Trash2, Sliders } from "lucide-react";

interface MotionTemplatesPanelProps {
  currentTimeSeconds: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onClose: () => void;
}

export function MotionTemplatesPanel({
  currentTimeSeconds,
  selectedClipId,
  onSelectClip,
  onClose,
}: MotionTemplatesPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<"library" | "edit">("library");

  const clips = useHtmlTemplateStore((s) => s.clips);
  const addClip = useHtmlTemplateStore((s) => s.addClip);
  const updateClip = useHtmlTemplateStore((s) => s.updateClip);
  const updateValues = useHtmlTemplateStore((s) => s.updateValues);
  const removeClip = useHtmlTemplateStore((s) => s.removeClip);

  const selectedClip = useMemo(
    () => clips.find((c) => c.id === selectedClipId) || null,
    [clips, selectedClipId],
  );

  const allTemplates = useMemo(() => getAllHtmlTemplates(), []);

  const categories = useMemo(() => {
    const cats = new Set<string>(["all"]);
    for (const t of allTemplates) {
      if (t.tags) {
        for (const tag of t.tags) {
          cats.add(tag);
        }
      }
    }
    return Array.from(cats);
  }, [allTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t: HtmlTemplate) => {
      const matchesCat =
        selectedCategory === "all" ||
        (t.tags && t.tags.includes(selectedCategory));
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [allTemplates, selectedCategory, searchQuery]);

  const handleApplyTemplate = (tmpl: HtmlTemplate) => {
    const defaultVals: Record<string, string | number | boolean> = {};
    for (const c of tmpl.controls) {
      defaultVals[c.id] = c.defaultValue;
    }
    const newClip = addClip(
      tmpl.id,
      currentTimeSeconds,
      tmpl.defaultDuration || 4,
      defaultVals,
      "html-track",
    );
    onSelectClip(newClip.id);
    setTab("edit");
  };

  const selectedTemplate = selectedClip
    ? getHtmlTemplate(selectedClip.templateId)
    : null;

  return (
    <PanelSheet onScrimClick={onClose} header={<SheetHeader onClose={onClose} onConfirm={onClose} />}>
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <p className="cc-sheet-title">
          {selectedClip ? "Edit Motion Graphic" : "Motion Graphics"}
        </p>
      </div>

      {/* Segmented Tab: Library vs Current Active Clip */}
      <div className="flex items-center py-2 border-b border-[#222] gap-2">
        <button
          type="button"
          onClick={() => setTab("library")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            tab === "library"
              ? "bg-[#333] text-white"
              : "text-[#888] hover:text-[#bbb]"
          }`}
        >
          Templates ({allTemplates.length})
        </button>
        {selectedClip && (
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center justify-center gap-1.5 ${
              tab === "edit"
                ? "bg-[#00f2fe]/20 text-[#00f2fe]"
                : "text-[#888] hover:text-[#bbb]"
            }`}
          >
            <Sliders size={12} />
            Edit Selected
          </button>
        )}
      </div>

      {tab === "library" ? (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Search bar */}
          <div className="py-2">
            <input
              type="text"
              placeholder="Search animations, titles, stats, callouts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 px-3 rounded-lg bg-[#1a1a1a] text-xs text-white placeholder-[#666] outline-none border border-[#2a2a2a] focus:border-[#00f2fe]"
            />
          </div>

          {/* Categories Pill Row */}
          <div className="flex items-center gap-1.5 py-1.5 overflow-x-auto no-scrollbar shrink-0">
            {categories.slice(0, 12).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-[11px] font-medium rounded-full capitalize shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? "bg-[#00f2fe] text-black font-semibold"
                    : "bg-[#1f1f1f] text-[#aaa] hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="flex-1 overflow-y-auto py-3 grid grid-cols-2 gap-2.5 max-h-[360px]">
            {filteredTemplates.map((tmpl: HtmlTemplate) => (
              <div
                key={tmpl.id}
                onClick={() => handleApplyTemplate(tmpl)}
                className="group relative flex flex-col p-3 rounded-xl bg-[#181818] border border-[#282828] hover:border-[#00f2fe] transition-all cursor-pointer select-none"
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-xs font-semibold text-white line-clamp-1">
                    {tmpl.name}
                  </span>
                  <span className="text-[10px] text-[#00f2fe] font-mono px-1.5 py-0.5 rounded bg-[#00f2fe]/10 shrink-0">
                    {tmpl.defaultDuration}s
                  </span>
                </div>
                <p className="text-[11px] text-[#888] line-clamp-2 leading-relaxed mb-3">
                  {tmpl.description}
                </p>
                <button
                  type="button"
                  className="mt-auto w-full py-1 rounded-lg bg-[#252525] group-hover:bg-[#00f2fe] group-hover:text-black text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus size={12} />
                  Add to Video
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : selectedClip && selectedTemplate ? (
        <div className="py-3 flex flex-col gap-4 max-h-[420px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#222]">
            <div>
              <h4 className="text-sm font-semibold text-white">
                {selectedTemplate.name}
              </h4>
              <p className="text-[11px] text-[#888]">
                Start: {selectedClip.startTime.toFixed(2)}s · Duration:{" "}
                {selectedClip.duration.toFixed(2)}s
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                removeClip(selectedClip.id);
                onSelectClip(null);
                setTab("library");
              }}
              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Delete Graphic"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Template Controls */}
          <div className="flex flex-col gap-3">
            {selectedTemplate.controls.map((ctrl) => {
              const val = selectedClip.values[ctrl.id] ?? ctrl.defaultValue;
              return (
                <div key={ctrl.id} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#aaa]">
                    {ctrl.label}
                  </label>
                  {ctrl.type === "text" && (
                    <input
                      type="text"
                      value={String(val ?? "")}
                      onChange={(e) =>
                        updateValues(selectedClip.id, {
                          [ctrl.id]: e.target.value,
                        })
                      }
                      className="h-8 px-3 rounded-lg bg-[#1c1c1c] border border-[#2c2c2c] text-xs text-white outline-none focus:border-[#00f2fe]"
                    />
                  )}
                  {ctrl.type === "number" && (
                    <input
                      type="number"
                      min={ctrl.min ?? 0}
                      max={ctrl.max ?? 100}
                      step={ctrl.step ?? 1}
                      value={Number(val ?? 0)}
                      onChange={(e) =>
                        updateValues(selectedClip.id, {
                          [ctrl.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-8 px-3 rounded-lg bg-[#1c1c1c] border border-[#2c2c2c] text-xs text-white outline-none focus:border-[#00f2fe]"
                    />
                  )}
                  {ctrl.type === "color" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={String(val ?? "#ffffff")}
                        onChange={(e) =>
                          updateValues(selectedClip.id, {
                            [ctrl.id]: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-[#aaa]">
                        {String(val)}
                      </span>
                    </div>
                  )}
                  {ctrl.type === "toggle" && (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={(e) =>
                          updateValues(selectedClip.id, {
                            [ctrl.id]: e.target.checked,
                          })
                        }
                        className="rounded accent-[#00f2fe]"
                      />
                      <span className="text-xs text-white">
                        {val ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          {/* Transform Controls: scale & opacity */}
          <div className="pt-3 border-t border-[#222] flex flex-col gap-2.5">
            <h5 className="text-xs font-semibold text-[#aaa]">Position & Size</h5>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#888]">Scale</span>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={selectedClip.scale.x}
                onChange={(e) => {
                  const s = parseFloat(e.target.value);
                  updateClip(selectedClip.id, { scale: { x: s, y: s } });
                }}
                className="w-40 accent-[#00f2fe]"
              />
              <span className="text-white w-8 text-right font-mono">
                {selectedClip.scale.x.toFixed(2)}x
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#888]">Opacity</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedClip.opacity}
                onChange={(e) => {
                  const o = parseFloat(e.target.value);
                  updateClip(selectedClip.id, { opacity: o });
                }}
                className="w-40 accent-[#00f2fe]"
              />
              <span className="text-white w-8 text-right font-mono">
                {Math.round(selectedClip.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </PanelSheet>
  );
}
