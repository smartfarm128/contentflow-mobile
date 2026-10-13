import { describe, expect, test } from "bun:test";
import { getAllHtmlTemplateMeta, getHtmlTemplateMeta } from "./template-meta";

describe("template metadata catalog", () => {
	test("keeps every template id without loading a component", () => {
		const templates = getAllHtmlTemplateMeta();
		expect(templates.length).toBe(378);
		expect(new Set(templates.map((template) => template.id)).size).toBe(378);
		expect(getHtmlTemplateMeta({ id: "html-text-scramble" })?.name).toBe("Text Scramble");
		expect(getHtmlTemplateMeta({ id: "html-shader-animation" })?.category).toBe("motion-graphics");
		expect(templates.every((template) => !("Component" in template))).toBe(true);
	});
});
