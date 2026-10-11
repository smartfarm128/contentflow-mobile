import { describe, expect, test } from "bun:test";
import type { TimelineElement } from "@kneecap/editor-core/timeline";
import { buildContextualItems, editSheetFor } from "./toolbar-defs";

function ids({ type, hasKeyframes = false }: { type: TimelineElement["type"]; hasKeyframes?: boolean }) {
	return buildContextualItems({ type, hasKeyframes }).map((item) => item.id);
}

describe("contextual toolbar", () => {
	test("video gets visual tools and Cut gaps, Edit last", () => {
		expect(ids({ type: "video" })).toEqual([
			"back", "split", "delete", "duplicate", "filters", "effects", "adjust", "masks", "cut-gaps", "edit",
		]);
	});

	test("audio gets no visual tools", () => {
		expect(ids({ type: "audio" })).toEqual(["back", "split", "delete", "duplicate", "cut-gaps", "edit"]);
	});

	test("image has visual tools but no Cut gaps", () => {
		const items = ids({ type: "image" });
		expect(items).toContain("filters");
		expect(items).not.toContain("cut-gaps");
	});

	test("Graph appears only with keyframes, before Edit", () => {
		expect(ids({ type: "image" })).not.toContain("graph");
		expect(ids({ type: "image", hasKeyframes: true }).slice(-2)).toEqual(["graph", "edit"]);
	});

	test("Edit opens the editor built for the selected item", () => {
		expect(editSheetFor({ element: { type: "video" } })).toBe("edit");
		expect(editSheetFor({ element: { type: "audio" } })).toBe("edit");
		expect(editSheetFor({ element: { type: "text" } })).toBe("text");
		expect(editSheetFor({ element: { type: "caption" } })).toBe("captions");
		expect(editSheetFor({ element: { type: "graphic", definitionId: "html:lower-third" } })).toBe("template");
		expect(editSheetFor({ element: { type: "graphic", definitionId: "rectangle" } })).toBe("edit");
		expect(buildContextualItems({ type: "text", hasKeyframes: false }).at(-1)?.label).toBe("Edit text");
	});
});
