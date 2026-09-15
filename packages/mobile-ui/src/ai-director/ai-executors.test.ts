import { describe, it, expect } from "bun:test";
import { AI_TOOLS, AI_TOOL_NAMES } from "./ai-tools";
import { executeTool } from "./ai-executors";

/**
 * Contract tests for the AI Director's tool layer.
 *
 * These guard the failure mode that matters most here: a tool the model can
 * CALL but that cannot ACT. If a schema exists with no executor (or vice
 * versa), Claude will confidently report an edit that never reached the
 * timeline — the exact "hollow UI" class of bug this project treats as worse
 * than shipping nothing.
 */

/** Minimal stub — enough for the unknown-tool and shape assertions, which
 *  never reach the engine. */
const stubCtx = { editor: {} as any, currentTimeSeconds: 0 };

describe("AI Director tool contract", () => {
	it("every declared tool has a unique name", () => {
		const names = AI_TOOLS.map((t) => t.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it("every declared tool is in the executable name set", () => {
		for (const tool of AI_TOOLS) {
			expect(AI_TOOL_NAMES.has(tool.name)).toBe(true);
		}
	});

	it("every tool has a non-trivial description so the model can choose correctly", () => {
		for (const tool of AI_TOOLS) {
			// Short descriptions are how models end up picking the wrong tool.
			expect(tool.description.length).toBeGreaterThan(40);
			expect(tool.input_schema.type).toBe("object");
		}
	});

	it("every tool declares its required fields as real properties", () => {
		for (const tool of AI_TOOLS) {
			for (const req of tool.input_schema.required ?? []) {
				expect(Object.keys(tool.input_schema.properties)).toContain(req);
			}
		}
	});

	it("rejects an unknown tool instead of silently succeeding", async () => {
		const out = await executeTool("definitely_not_a_tool", {}, stubCtx);
		expect(out.text).toContain("unknown tool");
		expect(out.frames).toBeUndefined();
	});

	it("returns the ToolOutcome shape, never a bare string", async () => {
		const out = await executeTool("definitely_not_a_tool", {}, stubCtx);
		expect(typeof out).toBe("object");
		expect(typeof out.text).toBe("string");
	});

	it("exposes the vision tools that let the Director see its own work", () => {
		expect(AI_TOOL_NAMES.has("render_frame")).toBe(true);
		expect(AI_TOOL_NAMES.has("review_composition")).toBe(true);
	});
});
