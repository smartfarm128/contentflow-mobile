import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
	generatePrecompiledCatalog,
	OUTPUT_PATH,
} from "../../scripts/precompile-motion-catalog";

describe("precompiled motion catalog", () => {
	test("is up to date with openchatcut-templates.json", () => {
		// Stale? Run: bun packages/mobile-ui/scripts/precompile-motion-catalog.ts
		expect(readFileSync(OUTPUT_PATH, "utf8")).toBe(generatePrecompiledCatalog());
	});

	test("rendering the catalog never evaluates strings (CSP has no 'unsafe-eval')", async () => {
		const RealFunction = globalThis.Function;
		let evalCalls = 0;
		globalThis.Function = new Proxy(RealFunction, {
			construct(target, args) {
				evalCalls++;
				return Reflect.construct(target, args);
			},
			apply(target, thisArg, args) {
				evalCalls++;
				return Reflect.apply(target, thisArg, args);
			},
		});
		try {
			const { createElement } = await import("react");
			const { renderToStaticMarkup } = await import("react-dom/server");
			const { loadCatalogTemplates } = await import("../motion-templates/catalog-loader");
			for (const t of loadCatalogTemplates()) {
				const values = Object.fromEntries(t.controls.map((c) => [c.id, c.defaultValue]));
				renderToStaticMarkup(
					createElement(t.Component, { progress: 0.5, time: 1, width: 360, height: 202, values }),
				);
			}
		} finally {
			globalThis.Function = RealFunction;
		}
		expect(evalCalls).toBe(0);
	});
});
