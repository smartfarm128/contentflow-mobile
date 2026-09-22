import React, { useState, useMemo } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import { SegmentedControl } from "../segmented-control";
import { ParamRow, ToggleRow } from "../editor/param-row";
import { getAllHtmlTemplates, getHtmlTemplate } from "../../motion-templates/registry";
import { TemplateThumbnail } from "../../motion-templates/ui/template-thumbnail";
import type { HtmlTemplate } from "../../motion-templates/types";
import { Plus, Trash2, LayoutTemplate, Sliders } from "lucide-react";
import { CC_ICON_STROKE } from "../../tokens";
import { useEditor } from "@kneecap/editor-core/react";
import { mediaTimeToSeconds } from "@kneecap/editor-core";
import type { ElementRef, TimelineElement } from "@kneecap/editor-core/timeline";
import {
	isHtmlTemplateGraphic,
	templateIdFromDefinitionId,
} from "../../motion-templates/engine-bridge";
import {
	insertHtmlTemplateElement,
	updateHtmlTemplateValues,
	setElementParam,
	deleteSelected,
	selectElement,
} from "../../editor/actions";
import { useSelectedElement } from "../../editor/use-live-editor";

interface MotionTemplatesPanelProps {
  currentTimeSeconds: number;
  onClose: () => void;
}

export function MotionTemplatesPanel({
  currentTimeSeconds,
  onClose,
}: MotionTemplatesPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<string>("library");
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const editor = useEditor();
  // The engine's own selection drives this panel — tapping a template on the
  // canvas and opening this sheet now refer to the same thing. (They used to
  // be two unrelated ids: the engine's, and the template store's.)
  const [selectedRef, selectedElement] = useSelectedElement();

  /** The selected element, but only when it is a template clip. */
  const selectedClip = useMemo(() => {
    if (!selectedRef || !selectedElement) return null;
    if (selectedElement.type !== "graphic") return null;
    if (!isHtmlTemplateGraphic({ definitionId: selectedElement.definitionId })) return null;
    const templateId = templateIdFromDefinitionId({
      definitionId: selectedElement.definitionId,
    });
    if (!templateId) return null;
    return {
      ref: selectedRef as ElementRef,
      templateId,
      element: selectedElement as Extract<TimelineElement, { type: "graphic" }>,
      startSec: mediaTimeToSeconds({ time: selectedElement.startTime }),
      durationSec: mediaTimeToSeconds({ time: selectedElement.duration }),
      values: selectedElement.params as Record<string, string | number | boolean>,
    };
  }, [selectedRef, selectedElement]);

  const updateValues = (values: Record<string, string | number | boolean>) => {
    if (!selectedClip) return;
    updateHtmlTemplateValues({ editor, ref: selectedClip.ref, values });
  };

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
    // Lands on a real graphic track as an engine element: it shows on the
    // timeline, selects, drags and resizes on canvas, undoes, and survives
    // export — none of which the old parallel store could do.
    const ref = insertHtmlTemplateElement({
      editor,
      templateId: tmpl.id,
      values: defaultVals,
      durationSec: tmpl.defaultDuration || 4,
    });
    if (ref) {
      selectElement({ editor, ref });
      setTab("edit");
    }
  };

  const selectedTemplate = selectedClip
    ? getHtmlTemplate(selectedClip.templateId)
    : null;

  const segmentTabs = [
    { id: "library", label: `Templates (${allTemplates.length})` },
    ...(selectedClip ? [{ id: "edit", label: "Edit Selected" }] : []),
  ];

  return (
    <PanelSheet
      onScrimClick={onClose}
      header={
        <SheetHeader
          searchPlaceholder="Search animations, titles, stats, callouts…"
          onSearchChange={setSearchQuery}
          onClose={onClose}
        />
      }
    >
      {/* CapCut Pill Segmented Switcher */}
      {selectedClip && (
        <div style={{ marginBottom: "12px" }}>
          <SegmentedControl
            segments={segmentTabs}
            activeId={tab}
            onSelect={setTab}
            aria-label="Template tabs"
          />
        </div>
      )}

      {tab === "library" ? (
        <>
          {/* Horizontal CapCut Chip Row for Categories */}
          <div className="cc-chiprow" style={{ paddingBottom: "8px" }}>
            {categories.slice(0, 14).map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`cc-chip ${active ? "cc-chip--active" : ""}`}
                  style={{ textTransform: "capitalize", fontSize: "12px" }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Clean 2-column CapCut mobile Card Grid */}
          <div className="cc-motion-grid">
            {filteredTemplates.map((tmpl: HtmlTemplate) => (
              <div
                key={tmpl.id}
                onClick={() => setPreviewingId(previewingId === tmpl.id ? null : tmpl.id)}
                className={`cc-motion-card ${previewingId === tmpl.id ? "cc-motion-card--previewing" : ""}`}
              >
                <TemplateThumbnail
                  template={tmpl}
                  isLivePreview={previewingId === tmpl.id}
                />
                <div className="cc-motion-card__head">
                  <h4 className="cc-motion-card__title">{tmpl.name}</h4>
                  <span className="cc-motion-card__duration">
                    {tmpl.defaultDuration}s
                  </span>
                </div>
                <p className="cc-motion-card__desc">{tmpl.description}</p>
                <button
                  type="button"
                  className="cc-motion-card__btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyTemplate(tmpl);
                  }}
                >
                  <Plus size={13} strokeWidth={CC_ICON_STROKE} />
                  <span>Add to Video</span>
                </button>
              </div>
            ))}
          </div>
        </>
      ) : selectedClip && selectedTemplate ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Header row with Title and Delete */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: "10px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div>
              <p className="cc-sheet-title" style={{ margin: 0 }}>
                {selectedTemplate.name}
              </p>
              <p className="cc-panel-note" style={{ padding: 0 }}>
                Start: {selectedClip.startSec.toFixed(2)}s · Duration:{" "}
                {selectedClip.durationSec.toFixed(2)}s
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                deleteSelected({ editor, refs: [selectedClip.ref] });
                setTab("library");
              }}
              style={{
                background: "rgba(255, 75, 75, 0.12)",
                color: "#ff4b4b",
                border: "none",
                borderRadius: "8px",
                padding: "6px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>

          {/* Template Controls (inputs, sliders, toggles) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {selectedTemplate.controls.map((ctrl) => {
              const val = selectedClip.values[ctrl.id] ?? ctrl.defaultValue;

              if (ctrl.type === "number") {
                return (
                  <ParamRow
                    key={ctrl.id}
                    label={ctrl.label}
                    value={Number(val ?? 0)}
                    min={ctrl.min ?? 0}
                    max={ctrl.max ?? 100}
                    step={ctrl.step ?? 1}
                    onChange={(n) => updateValues({ [ctrl.id]: n })}
                  />
                );
              }

              if (ctrl.type === "toggle") {
                return (
                  <ToggleRow
                    key={ctrl.id}
                    label={ctrl.label}
                    active={Boolean(val)}
                    onToggle={() => updateValues({ [ctrl.id]: !val })}
                  />
                );
              }

              if (ctrl.type === "color") {
                const colorStr = String(val ?? "#ffffff");
                return (
                  <div key={ctrl.id} className="cc-param-row">
                    <div className="cc-param-row__head">
                      <span className="cc-param-row__label">{ctrl.label}</span>
                      <span className="cc-param-row__value font-mono">
                        {colorStr}
                      </span>
                    </div>
                    <div className="cc-color-row">
                      <div
                        className="cc-color-preview"
                        style={{ backgroundColor: colorStr }}
                      >
                        <input
                          type="color"
                          value={colorStr.startsWith("#") ? colorStr : "#ffffff"}
                          onChange={(e) => updateValues({ [ctrl.id]: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={ctrl.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label className="cc-form-label">{ctrl.label}</label>
                  <input
                    type="text"
                    value={String(val ?? "")}
                    onChange={(e) => updateValues({ [ctrl.id]: e.target.value })}
                    className="cc-text-content-input"
                  />
                </div>
              );
            })}
          </div>

          {/* Size and Opacity Controls */}
          <div
            style={{
              paddingTop: "10px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <p className="cc-form-label">Position & Scale</p>
            {/* These write the SAME transform/opacity params every visual
                element already has (params/registry.ts's visualElementParams),
                so the canvas resize handles and these sliders move one value —
                they are not two parallel notions of size any more. */}
            <ParamRow
              label="Scale"
              value={Math.round(
                (typeof selectedClip.values["transform.scaleX"] === "number"
                  ? (selectedClip.values["transform.scaleX"] as number)
                  : 1) * 100,
              )}
              min={20}
              max={250}
              step={5}
              formatValue={(v) => `${(v / 100).toFixed(2)}x`}
              onChange={(v) => {
                const s = v / 100;
                setElementParam({
                  editor,
                  ref: selectedClip.ref,
                  key: "transform.scaleX",
                  value: s,
                });
                setElementParam({
                  editor,
                  ref: selectedClip.ref,
                  key: "transform.scaleY",
                  value: s,
                });
              }}
            />
            <ParamRow
              label="Opacity"
              value={Math.round(
                (typeof selectedClip.values.opacity === "number"
                  ? (selectedClip.values.opacity as number)
                  : 1) * 100,
              )}
              min={0}
              max={100}
              step={1}
              formatValue={(v) => `${v}%`}
              onChange={(v) => {
                setElementParam({
                  editor,
                  ref: selectedClip.ref,
                  key: "opacity",
                  value: v / 100,
                });
              }}
            />
          </div>
        </div>
      ) : null}
    </PanelSheet>
  );
}
