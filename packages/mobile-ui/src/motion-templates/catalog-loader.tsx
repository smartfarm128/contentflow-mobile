/**
 * Adapts the 211 OpenChatCut catalog templates to the HtmlTemplate contract,
 * so they live in the same registry, Templates sheet, preview layer and AI
 * Director tool list as the 167 hand-built ones.
 *
 * The raw JSX catalog is compiled at build time
 * (scripts/precompile-motion-catalog.ts) into sandboxed factory functions:
 * the app CSP has no 'unsafe-eval', so runtime `new Function` compilation
 * throws in the webview. Each factory is instantiated lazily on first render.
 */

import type {
	EditingTemplatePrimitive,
	HtmlTemplate,
	HtmlTemplateComponent,
	HtmlTemplateControl,
	HtmlTemplateControlOption,
} from "./types";
import { getPrecompiledTemplate, TemplateContext, type SandboxFactory } from "./template-host";
import { placeholderImage, placeholderLogo } from "./local-placeholder";
import rawTemplates from "./catalog/openchatcut-templates.compiled";

interface RawPropSchema {
	key: string;
	type: string;
	defaultValue: unknown;
	label?: string;
	min?: number;
	max?: number;
	step?: number;
	options?: HtmlTemplateControlOption[];
}

interface RawTemplate {
	id: string;
	name: string;
	category: string;
	description: string;
	width: number;
	height: number;
	fps: number;
	durationInFrames: number;
	props: Record<string, unknown>;
	propSchema?: RawPropSchema[];
	factory: SandboxFactory;
}

export const CATALOG_ID_PREFIX = "occ-";

const REMOTE_URL = /^https?:\/\//i;

function toPrimitive(value: unknown): EditingTemplatePrimitive {
	return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
		? value
		: String(value ?? "");
}

function toControlType({ type, value }: { type: string; value: unknown }): HtmlTemplateControl["type"] {
	switch (type) {
		case "color":
			return "color";
		case "number":
			return "number";
		case "boolean":
		case "toggle":
			return "toggle";
		case "select":
			return "select";
		case "image":
		case "asset":
			return "image";
		case "inferred":
			if (typeof value === "number") return "number";
			if (typeof value === "boolean") return "toggle";
			if (typeof value === "string" && value.startsWith("#")) return "color";
			return "text";
		default:
			// "text", "string", "font" -- all free-text on a phone.
			return "text";
	}
}

/**
 * A handful of catalog defaults are Unsplash photos. Offline (airplane mode,
 * bad signal, the export renderer) those render as a broken image burned into
 * the video, so they are swapped for the same local SVG placeholders the
 * hand-built templates use. The user replaces them via the image control.
 */
function offlineDefault({ key, value }: { key: string; value: EditingTemplatePrimitive }): EditingTemplatePrimitive {
	if (typeof value !== "string" || !REMOTE_URL.test(value)) return value;
	return /logo/i.test(key) ? placeholderLogo("Brand") : placeholderImage(key, 1200, 900);
}

function humanize(key: string): string {
	return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function buildControls(raw: RawTemplate): HtmlTemplateControl[] {
	const schema: RawPropSchema[] = raw.propSchema?.length
		? raw.propSchema
		: Object.entries(raw.props ?? {}).map(([key, value]) => ({
				key,
				type: "inferred",
				defaultValue: value,
			}));

	return schema.map((p) => {
		// props carries the template's real default; the schema default is
		// occasionally blank for the same key.
		const source = p.key in (raw.props ?? {}) ? raw.props[p.key] : p.defaultValue;
		const control: HtmlTemplateControl = {
			id: p.key,
			label: p.label || humanize(p.key),
			type: toControlType({ type: p.type, value: source }),
			defaultValue: offlineDefault({ key: p.key, value: toPrimitive(source) }),
		};
		if (p.min !== undefined) control.min = p.min;
		if (p.max !== undefined) control.max = p.max;
		if (p.step !== undefined) control.step = p.step;
		if (p.options?.length) control.options = p.options;
		return control;
	});
}

function aspectHint({ width, height }: { width: number; height: number }): string {
	if (width === height) return "1:1";
	return width > height ? "16:9" : "9:16";
}

function convertTemplate(raw: RawTemplate): HtmlTemplate {
	const fps = raw.fps || 30;
	const durationInFrames = raw.durationInFrames || 90;
	const designWidth = raw.width || 1920;
	const designHeight = raw.height || 1080;

	const Component: HtmlTemplateComponent = ({ progress, width, height, values }) => {
		const Compiled = getPrecompiledTemplate(raw.factory);
		const frame = Math.min(
			durationInFrames - 1,
			Math.max(0, Math.round(progress * durationInFrames)),
		);
		return (
			<TemplateContext.Provider
				value={{
					frame,
					config: { fps, width: designWidth, height: designHeight, durationInFrames },
				}}
			>
				{/* Catalog templates scale themselves from item.width/height. */}
				<Compiled item={{ props: values, width, height } as { props: Record<string, unknown> }} />
			</TemplateContext.Provider>
		);
	};

	const tags = raw.category && raw.category !== "uncategorized" ? [raw.category] : [];

	return {
		id: `${CATALOG_ID_PREFIX}${raw.id}`,
		name: raw.name,
		description: raw.description,
		category: "motion-graphics",
		tags,
		controls: buildControls(raw),
		defaultDuration: Math.max(1, Math.round(durationInFrames / fps)),
		aspectHint: aspectHint({ width: designWidth, height: designHeight }),
		Component,
	};
}

export function loadCatalogTemplates(): HtmlTemplate[] {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the JSON catalog is generated by scripts/compile-templates and matches RawTemplate by construction; convertTemplate defensively defaults every field it reads.
	return (rawTemplates as unknown as RawTemplate[]).map(convertTemplate);
}
