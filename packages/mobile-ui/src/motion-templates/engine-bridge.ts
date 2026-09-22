/**
 * Registers every HTML motion template as a real editor-core GRAPHIC
 * definition, so a template clip can live on the timeline as an ordinary
 * engine element instead of in a parallel store.
 *
 * Why this exists
 * ---------------
 * Motion templates used to be held in `html-template-store.ts`, a Zustand
 * store the engine knew nothing about. Everything else — video, text, audio,
 * captions, stickers — lives in `editor.scenes.getActiveScene().tracks`. That
 * one split caused every symptom the founder hit on device (2026-09-22):
 *
 *   - invisible on the timeline (the VM builds rows from engine tracks)
 *   - no selection box / no resize handles (canvas hit-testing walks engine
 *     elements via getVisibleElementsWithBounds)
 *   - undraggable, rendering a smeared duplicate mid-gesture (neither the
 *     motion layer nor the preview renderer owned the gesture)
 *   - silently dropped from export (the EDL builder never saw them)
 *
 * Once a template clip IS an engine element, all four are fixed by code that
 * already exists and is already tested for text/sticker elements.
 *
 * The canvas-render seam
 * ----------------------
 * `GraphicDefinition.render({ ctx })` is a 2D-canvas callback. HTML templates
 * are React components and cannot satisfy it. They are composited by
 * `HtmlMotionLayer` as real DOM above the preview canvas, so `render` here is
 * deliberately a no-op: the engine owns the element's TIMING, PLACEMENT and
 * PARAMS (which is everything the timeline, selection and export need), while
 * the DOM layer owns its PIXELS. `isHtmlTemplateGraphic` lets the preview and
 * export paths tell the two apart.
 */
import { graphicsRegistry, type GraphicDefinition } from "@kneecap/editor-core/graphics";
import type { ParamDefinition } from "@kneecap/editor-core/params";
import type { EditorCore } from "@kneecap/editor-core";
import type { ElementRef } from "@kneecap/editor-core/timeline";
import { getAllHtmlTemplates, getHtmlTemplate } from "./registry";
import type { HtmlTemplate, HtmlTemplateControl } from "./types";

/** Namespace for template-backed graphic ids, so they can never collide with
 *  editor-core's own built-in shapes (rectangle/ellipse/star/polygon). */
const HTML_GRAPHIC_PREFIX = "html:";

export function htmlGraphicDefinitionId({ templateId }: { templateId: string }): string {
	return `${HTML_GRAPHIC_PREFIX}${templateId}`;
}

/** True for graphic elements whose pixels come from the React motion layer
 *  rather than editor-core's canvas renderer. */
export function isHtmlTemplateGraphic({ definitionId }: { definitionId: string }): boolean {
	return definitionId.startsWith(HTML_GRAPHIC_PREFIX);
}

/** The template id behind a graphic definition id, or null if it isn't one. */
export function templateIdFromDefinitionId({
	definitionId,
}: {
	definitionId: string;
}): string | null {
	if (!isHtmlTemplateGraphic({ definitionId })) return null;
	return definitionId.slice(HTML_GRAPHIC_PREFIX.length);
}

/** The HtmlTemplate behind a graphic element, or undefined. */
export function templateForDefinitionId({
	definitionId,
}: {
	definitionId: string;
}): HtmlTemplate | undefined {
	const templateId = templateIdFromDefinitionId({ definitionId });
	return templateId ? getHtmlTemplate(templateId) : undefined;
}

/**
 * Finds a template clip by element id anywhere on the active scene's overlay
 * tracks. Replaces the old store's flat `clips.find(...)`, which is gone along
 * with the store itself.
 */
export function findHtmlTemplateRef({
	editor,
	elementId,
}: {
	editor: EditorCore;
	elementId: string;
}): ElementRef | null {
	const tracks = editor.scenes.getActiveScene().tracks;
	for (const track of tracks.overlay) {
		for (const element of track.elements) {
			if (element.id !== elementId) continue;
			if (element.type !== "graphic") continue;
			if (!isHtmlTemplateGraphic({ definitionId: element.definitionId })) continue;
			return { trackId: track.id, elementId: element.id };
		}
	}
	return null;
}

/** Every template clip on the active scene, in track order. */
export function listHtmlTemplateRefs({ editor }: { editor: EditorCore }): ElementRef[] {
	const refs: ElementRef[] = [];
	const tracks = editor.scenes.getActiveScene().tracks;
	for (const track of tracks.overlay) {
		for (const element of track.elements) {
			if (element.type !== "graphic") continue;
			if (!isHtmlTemplateGraphic({ definitionId: element.definitionId })) continue;
			refs.push({ trackId: track.id, elementId: element.id });
		}
	}
	return refs;
}

/**
 * Translates a template's editing control into an engine param definition.
 *
 * `image` controls become `text` params holding a URL — editor-core has no
 * image param type, and the template only ever reads the value as a string.
 */
function paramFromControl({ control }: { control: HtmlTemplateControl }): ParamDefinition {
	const base = { key: control.id, label: control.label };

	switch (control.type) {
		case "number":
			return {
				...base,
				type: "number",
				default: typeof control.defaultValue === "number" ? control.defaultValue : 0,
				min: control.min ?? 0,
				max: control.max,
				step: control.step ?? 1,
			};
		case "toggle":
			return {
				...base,
				type: "boolean",
				default: control.defaultValue === true,
			};
		case "color":
			return {
				...base,
				type: "color",
				default: String(control.defaultValue ?? "#ffffff"),
			};
		case "select":
			return {
				...base,
				type: "select",
				default: String(control.defaultValue ?? ""),
				options: (control.options ?? []).map((option) => ({
					value: String(option.value),
					label: option.label,
				})),
			};
		case "image":
		case "text":
		default:
			return {
				...base,
				type: "text",
				default: String(control.defaultValue ?? ""),
			};
	}
}

function definitionFromTemplate({ template }: { template: HtmlTemplate }): GraphicDefinition {
	return {
		id: htmlGraphicDefinitionId({ templateId: template.id }),
		name: template.name,
		keywords: template.tags,
		params: template.controls.map((control) => paramFromControl({ control })),
		// Intentionally empty: pixels come from HtmlMotionLayer (see header).
		render: () => {},
	};
}

let registered = false;

/**
 * Idempotently registers all HTML templates with the graphics registry.
 *
 * Must run before any graphic element referencing a template is built or
 * read — `graphicsRegistry.get` THROWS on an unknown id rather than returning
 * undefined, so a project loaded before registration would crash on render.
 * Called from the editor shell's mount and from the insert action itself.
 */
export function registerHtmlTemplateGraphics(): void {
	if (registered) return;
	registered = true;
	for (const template of getAllHtmlTemplates()) {
		graphicsRegistry.register({
			key: htmlGraphicDefinitionId({ templateId: template.id }),
			definition: definitionFromTemplate({ template }),
		});
	}
}
