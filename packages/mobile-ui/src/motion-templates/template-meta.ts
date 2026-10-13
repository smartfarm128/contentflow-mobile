import raw from "./template-meta.json";
import type {
	EditingTemplatePrimitive,
	HtmlTemplateControl,
	HtmlTemplateControlOption,
	HtmlTemplateControlType,
	HtmlTemplateMeta,
} from "./types";

/**
 * Cold-start catalog: id, name, controls, duration. No React component, no
 * three.js, no remotion, no OpenChatCut factory. The heavy modules load
 * from `load-template.ts` the first time a template is previewed or exported.
 *
 * The JSON is checked field by field. A cast would be a narrower type than
 * the import, which the lint rule rejects, and a bad row would otherwise
 * reach the panel as if it were a template.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrimitive(value: unknown): value is EditingTemplatePrimitive {
	const kind = typeof value;
	return kind === "string" || kind === "number" || kind === "boolean";
}

function isControlType(value: unknown): value is HtmlTemplateControlType {
	return (
		value === "text" ||
		value === "color" ||
		value === "number" ||
		value === "toggle" ||
		value === "select" ||
		value === "image"
	);
}

function readControl(value: unknown): HtmlTemplateControl | null {
	if (!isRecord(value)) return null;
	if (typeof value.id !== "string" || typeof value.label !== "string") return null;
	if (!isControlType(value.type) || !isPrimitive(value.defaultValue)) return null;
	const control: HtmlTemplateControl = {
		id: value.id,
		label: value.label,
		type: value.type,
		defaultValue: value.defaultValue,
	};
	if (typeof value.min === "number") control.min = value.min;
	if (typeof value.max === "number") control.max = value.max;
	if (typeof value.step === "number") control.step = value.step;
	if (value.options !== undefined) {
		if (!Array.isArray(value.options)) return null;
		const options: HtmlTemplateControlOption[] = [];
		for (const option of value.options) {
			if (typeof option === "string") {
				options.push({ label: option, value: option });
				continue;
			}
			if (!isRecord(option) || typeof option.label !== "string" || !isPrimitive(option.value)) {
				return null;
			}
			options.push({ label: option.label, value: option.value });
		}
		control.options = options;
	}
	return control;
}

function readTemplate(value: unknown): HtmlTemplateMeta | null {
	if (!isRecord(value)) return null;
	if (
		typeof value.id !== "string" ||
		typeof value.name !== "string" ||
		value.category !== "motion-graphics" ||
		typeof value.defaultDuration !== "number" ||
		typeof value.aspectHint !== "string" ||
		!Array.isArray(value.tags) ||
		!Array.isArray(value.controls)
	) {
		return null;
	}
	const description = typeof value.description === "string" ? value.description : "";
	const tags: string[] = [];
	for (const tag of value.tags) {
		if (typeof tag !== "string") return null;
		tags.push(tag);
	}
	const controls: HtmlTemplateControl[] = [];
	for (const control of value.controls) {
		const parsed = readControl(control);
		if (!parsed) return null;
		controls.push(parsed);
	}
	return {
		id: value.id,
		name: value.name,
		description,
		category: "motion-graphics",
		tags,
		controls,
		defaultDuration: value.defaultDuration,
		aspectHint: value.aspectHint,
	};
}

function readCatalog(value: unknown): readonly HtmlTemplateMeta[] {
	if (!Array.isArray(value)) return [];
	const templates: HtmlTemplateMeta[] = [];
	for (const row of value) {
		const template = readTemplate(row);
		if (template) templates.push(template);
	}
	return templates;
}

const TEMPLATES = readCatalog(raw);

const BY_ID = new Map(TEMPLATES.map((template) => [template.id, template]));

export function getAllHtmlTemplateMeta(): readonly HtmlTemplateMeta[] {
	return TEMPLATES;
}

export function getHtmlTemplateMeta({ id }: { id: string }): HtmlTemplateMeta | undefined {
	return BY_ID.get(id);
}

export function getHtmlTemplateDefaultValues(
	template: HtmlTemplateMeta,
): Record<string, EditingTemplatePrimitive> {
	return Object.fromEntries(template.controls.map((control) => [control.id, control.defaultValue]));
}
