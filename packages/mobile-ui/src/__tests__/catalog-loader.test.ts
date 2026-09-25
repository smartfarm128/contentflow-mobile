import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CATALOG_ID_PREFIX, loadCatalogTemplates } from "../motion-templates/catalog-loader";

// The full registry pulls three.js / R3F and cannot load headless, so the
// catalog half of the merge is pinned here on its own.
const templates = loadCatalogTemplates();

const defaults = (t: (typeof templates)[number]) =>
	Object.fromEntries(t.controls.map((c) => [c.id, c.defaultValue]));

const render = (t: (typeof templates)[number], progress: number) =>
	renderToStaticMarkup(
		createElement(t.Component, {
			progress,
			time: progress * t.defaultDuration,
			width: 1920,
			height: 1080,
			values: defaults(t),
		}),
	);

describe("OpenChatCut catalog adapter", () => {
	test("all 211 templates load with unique, prefixed ids", () => {
		expect(templates.length).toBe(211);
		expect(new Set(templates.map((t) => t.id)).size).toBe(211);
		expect(templates.every((t) => t.id.startsWith(CATALOG_ID_PREFIX))).toBe(true);
	});

	test("every template renders at start, middle and end without throwing", () => {
		const failures: string[] = [];
		for (const t of templates) {
			try {
				for (const p of [0, 0.5, 1]) render(t, p);
			} catch (e) {
				failures.push(`${t.name}: ${(e as Error).message}`);
			}
		}
		expect(failures).toEqual([]);
	});

	test("animation advances with progress", () => {
		const bar = templates.find((t) => t.name === "Bar Chart - Annual Sales");
		expect(bar).toBeDefined();
		expect(render(bar!, 0)).not.toBe(render(bar!, 0.8));
	});

	test("no default control points at a remote URL (offline-first)", () => {
		const remote = templates.flatMap((t) =>
			t.controls
				.filter((c) => typeof c.defaultValue === "string" && /^https?:\/\//.test(c.defaultValue))
				.map((c) => `${t.name}.${c.id}`),
		);
		expect(remote).toEqual([]);
	});

	test("select controls keep their options", () => {
		const quote = templates.find((t) => t.name === "X Quote Card");
		const theme = quote?.controls.find((c) => c.id === "theme");
		expect(theme?.type).toBe("select");
		expect(theme?.options?.length).toBe(2);
	});
});
