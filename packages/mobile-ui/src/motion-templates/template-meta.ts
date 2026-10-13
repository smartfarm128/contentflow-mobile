import raw from "./template-meta.json";
import type { EditingTemplatePrimitive, HtmlTemplateMeta } from "./types";

/**
 * Cold-start catalog: id, name, controls, duration. No React component, no
 * three.js, no remotion, no OpenChatCut factory. The heavy modules load
 * from `load-template.ts` the first time a template is previewed or exported.
 */
const TEMPLATES: readonly HtmlTemplateMeta[] = raw as HtmlTemplateMeta[];

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
