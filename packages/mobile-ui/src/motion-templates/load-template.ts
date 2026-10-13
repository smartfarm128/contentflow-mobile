import type { HtmlTemplate } from "./types";

let registryPromise: Promise<typeof import("./registry")> | null = null;

function loadRegistry(): Promise<typeof import("./registry")> {
	registryPromise ??= import("./registry");
	return registryPromise;
}

const loaded = new Map<string, HtmlTemplate>();

/** Loads the template component module (and three / remotion / d3 / the catalog) on first use. */
export async function loadHtmlTemplate({ id }: { id: string }): Promise<HtmlTemplate | undefined> {
	const cached = loaded.get(id);
	if (cached) return cached;
	const registry = await loadRegistry();
	const template = registry.getHtmlTemplate(id);
	if (template) loaded.set(id, template);
	return template;
}

export async function loadHtmlTemplates({
	ids,
}: {
	ids: readonly string[];
}): Promise<Map<string, HtmlTemplate>> {
	const unique = [...new Set(ids)];
	const entries = await Promise.all(
		unique.map(async (id) => {
			const template = await loadHtmlTemplate({ id });
			return template ? ([id, template] as const) : null;
		}),
	);
	return new Map(entries.filter((entry): entry is readonly [string, HtmlTemplate] => entry !== null));
}
