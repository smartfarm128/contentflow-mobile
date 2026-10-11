import {
	Captions,
	ChevronLeft,
	Contrast,
	CopyPlus,
	ScissorsLineDashed,
	SlidersHorizontal,
	Spline,
	Trash2,
	Wand2,
	FileText,
	Film,
	LayoutTemplate,
	Layers,
	Mic,
	Music,
	PaintBucket,
	Scissors,
	Shapes,
	Sliders,
	Sparkles,
	Square,
	Sticker,
	Type,
} from "lucide-react";
import type { TimelineElement } from "@kneecap/editor-core/timeline";
import { isHtmlTemplateGraphic } from "../../motion-templates/engine-bridge";
import type { ToolbarItemDef } from "../toolbar-row";

/**
 * M8 primary toolbar — order MEASURED from the founder's live-CapCut capture
 * session (2026-08-18, docs/capcut-reference/capture-editor-toolbar-start.png
 * + capture-editor-toolbar-scrolled.png, two overlapping scroll positions of
 * the same bar). This closes the corpus 04 §3 [NEEDS-CAPTURE] on ordering:
 * Edit / Audio / Text / Effects / Overlay / Captions / Filters / Adjust /
 * Stickers / Transcript / Aspect ratio / Background / Template. Every
 * pre-capture "canonical superset" guess is superseded by this.
 *
 * Transcript and Template open a "not in kneecap yet" sheet (deliberate,
 * visible response — v1 scope per docs/DECISIONS.md); Aspect ratio and
 * Background are real panels over the engine's project settings.
 */
export const PRIMARY_TOOLBAR_ITEMS: ToolbarItemDef[] = [
	{ id: "ai", label: "AI Director", icon: Sparkles },
	{ id: "edit", label: "Edit", icon: Scissors },
	{ id: "template", label: "Motion Graphics", icon: LayoutTemplate },
	{ id: "audio", label: "Sound & Audio", icon: Music },
	{ id: "voiceover", label: "Voiceover", icon: Mic },
	{ id: "text", label: "Text", icon: Type },
	{ id: "effects", label: "Effects", icon: Sparkles },
	{ id: "overlay", label: "Overlay", icon: Layers },
	{ id: "stock", label: "Assets", icon: Film },
	{ id: "captions", label: "Caption", icon: Captions },
	{ id: "filters", label: "Filters", icon: Sliders },
	{ id: "masks", label: "Mask", icon: Shapes },
	{ id: "adjust", label: "Adjust", icon: Contrast },
	{ id: "stickers", label: "Stickers", icon: Sticker },
	{ id: "transcript", label: "Transcript", icon: FileText },
	{ id: "ratio", label: "Aspect Ratio", icon: Square },
	{ id: "background", label: "Background", icon: PaintBucket },
];

export type PrimaryToolId = (typeof PRIMARY_TOOLBAR_ITEMS)[number]["id"];

type ElementType = TimelineElement["type"];

const SPLIT: ToolbarItemDef = { id: "split", label: "Split", icon: Scissors };
const DELETE: ToolbarItemDef = { id: "delete", label: "Delete", icon: Trash2 };
const DUPLICATE: ToolbarItemDef = { id: "duplicate", label: "Duplicate", icon: CopyPlus };
const CUT_GAPS: ToolbarItemDef = { id: "cut-gaps", label: "Cut gaps", icon: ScissorsLineDashed };
const GRAPH: ToolbarItemDef = { id: "graph", label: "Graph", icon: Spline };
const FILTERS: ToolbarItemDef = { id: "filters", label: "Filters", icon: Sliders };
const EFFECTS: ToolbarItemDef = { id: "effects", label: "Effects", icon: Wand2 };
const ADJUST: ToolbarItemDef = { id: "adjust", label: "Adjust", icon: Contrast };
const MASK: ToolbarItemDef = { id: "masks", label: "Mask", icon: Shapes };

/** Tools that only make sense for one kind of clip, between the direct
 *  verbs and "Edit". Audio gets no visual tools; text and captions are
 *  edited through their own panels. */
const TYPE_TOOLS: Record<ElementType, ToolbarItemDef[]> = {
	video: [FILTERS, EFFECTS, ADJUST, MASK, CUT_GAPS],
	image: [FILTERS, EFFECTS, ADJUST, MASK],
	audio: [CUT_GAPS],
	text: [EFFECTS],
	caption: [],
	sticker: [EFFECTS],
	graphic: [EFFECTS, MASK],
	effect: [],
};

/** The editor the contextual "Edit" item opens for a selected item — the
 *  one built for that kind of item: text → Text, caption → Captions, a
 *  motion-graphic template → Motion Graphics (on its Edit tab), anything
 *  else → the Edit sheet (whose controls already adapt to the type). */
export function editSheetFor({
	element,
}: {
	element: { type: ElementType; definitionId?: string };
}): "text" | "captions" | "template" | "edit" {
	if (element.type === "text") return "text";
	if (element.type === "caption") return "captions";
	if (element.type === "graphic" && element.definitionId && isHtmlTemplateGraphic({ definitionId: element.definitionId }))
		return "template";
	return "edit";
}

/** Leading item of the contextual row: leaves clip mode (deselects), which
 *  brings the primary toolbar back. */
export const CONTEXTUAL_BACK_ID = "back";
const BACK: ToolbarItemDef = { id: CONTEXTUAL_BACK_ID, label: "Back", icon: ChevronLeft };

/** The contextual row that REPLACES the primary toolbar while a clip is
 *  selected (one toolbar at a time — founder, 2026-09-30): Back, direct verbs (Delete must never be two taps deep —
 *  founder feedback 2026-08-19), then the tools for this clip type, then
 *  "Edit", which opens this clip type's editor. */
export function buildContextualItems({
	type,
	hasKeyframes,
}: {
	type: ElementType;
	hasKeyframes: boolean;
}): ToolbarItemDef[] {
	const editLabel = type === "text" || type === "caption" ? "Edit text" : "Edit";
	const editIcon = type === "text" || type === "caption" ? Type : SlidersHorizontal;
	return [
		BACK,
		SPLIT,
		DELETE,
		DUPLICATE,
		...TYPE_TOOLS[type],
		...(hasKeyframes ? [GRAPH] : []),
		{ id: "edit", label: editLabel, icon: editIcon },
	];
}
