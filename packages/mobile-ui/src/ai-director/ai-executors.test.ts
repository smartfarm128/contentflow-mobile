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

	it("exposes the reference-matching tools the core use case depends on", () => {
		expect(AI_TOOL_NAMES.has("analyze_reference_video")).toBe(true);
		expect(AI_TOOL_NAMES.has("save_style_profile")).toBe(true);
		expect(AI_TOOL_NAMES.has("list_style_profiles")).toBe(true);
	});

	it("lets propose_plan carry the style profile it is matching", () => {
		const plan = AI_TOOLS.find((t) => t.name === "propose_plan");
		expect(plan?.input_schema.properties).toHaveProperty("style_profile_id");
	});

	it("save_style_profile actually persists, so a plan can reference it", async () => {
		const { useStyleProfileStore } = await import("./style-profile-store");
		useStyleProfileStore.setState({ profiles: [] });

		const out = await executeTool(
			"save_style_profile",
			{
				name: "Contract Test Style",
				pacing: "fast, ~170wpm",
				cut_rhythm: "every 2s on sentence ends",
			},
			stubCtx,
		);

		const saved = useStyleProfileStore.getState().profiles;
		expect(saved).toHaveLength(1);
		expect(saved[0].name).toBe("Contract Test Style");
		// snake_case in the schema must land on the camelCase store field —
		// a silent mismatch here would save an empty profile.
		expect(saved[0].cutRhythm).toBe("every 2s on sentence ends");
		// The model needs the id back, or it cannot reference the profile.
		expect(out.text).toContain(saved[0].id);
	});

	it("list_style_profiles reports emptiness honestly rather than inventing a style", async () => {
		const { useStyleProfileStore } = await import("./style-profile-store");
		useStyleProfileStore.setState({ profiles: [] });
		const out = await executeTool("list_style_profiles", {}, stubCtx);
		expect(out.text).toContain("No style profiles saved yet");
		expect(out.text).toContain("analyze_reference_video");
	});

	it("save_style_profile refuses an unnamed profile instead of saving a blank", async () => {
		const { useStyleProfileStore } = await import("./style-profile-store");
		useStyleProfileStore.setState({ profiles: [] });
		const out = await executeTool("save_style_profile", { name: "   " }, stubCtx);
		expect(out.text).toStartWith("Error");
		expect(useStyleProfileStore.getState().profiles).toHaveLength(0);
	});
});
