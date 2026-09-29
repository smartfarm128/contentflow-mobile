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
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any -- deliberately empty: these cases must fail before touching the editor at all.
const stubCtx = { editor: {} as any };

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

	it("does not offer reverse_clip, because the renderer never plays a clip backwards", async () => {
		expect(AI_TOOL_NAMES.has("reverse_clip")).toBe(false);
		const out = await executeTool("reverse_clip", { clip_id: "x" }, stubCtx);
		expect(out.text).toContain("unknown tool");
	});
});

/**
 * The same executors against a REAL editor loaded with the EDL golden fixture:
 * clip-a (0–2s) and clip-b (2–4s) on main, "kneecap" text (0.5–3.5s), a music
 * bed, no captions, and no media files registered. Each assertion pins a tool
 * result that used to lie to the model — zeroed clip times, a success message
 * for a split that never happened, a grade applied at 1% strength.
 */
describe("AI Director executors against a real editor", () => {
	async function loadFixture() {
		const { EditorCore } = await import("@kneecap/editor-core");
		const { buildFixtureProject, buildFixtureScene } = await import(
			"../../../editor-core/src/edl/__tests__/fixture"
		);
		EditorCore.reset();
		const editor = EditorCore.getInstance();
		const scene = buildFixtureScene();
		editor.project.setActiveProject({ project: { ...buildFixtureProject(), scenes: [scene] } });
		editor.scenes.initializeScenes({ scenes: [scene], currentSceneId: scene.id });
		const mainIds = () => editor.scenes.getActiveScene().tracks.main.elements.map((e) => e.id);
		return { editor, ctx: { editor }, mainIds };
	}

	it("get_timeline reports each clip's real start and end, not zero", async () => {
		const { ctx } = await loadFixture();
		const out = await executeTool("get_timeline", {}, ctx);
		expect(out.text).toContain("clip-a | video | 0s → 2.000s");
		expect(out.text).toContain("clip-b | video | 2s → 4.000s");
		expect(out.text).toContain('clip-title | text | 0.5s → 3.500s | "kneecap"');
	});

	it("get_timeline reads the live playhead after a seek, not a turn-start snapshot", async () => {
		const { ctx } = await loadFixture();
		const seek = await executeTool("seek", { seconds: 1.5 }, ctx);
		expect(seek.text).toContain("1.50s");
		const out = await executeTool("get_timeline", {}, ctx);
		expect(out.text).toContain("playhead 1.50s");
	});

	it("seek reports where the engine clamped the playhead, not the requested time", async () => {
		const { ctx } = await loadFixture();
		const out = await executeTool("seek", { seconds: 999 }, ctx);
		expect(out.text).not.toContain("999");
	});

	it("split_clip declines, and changes nothing, when the playhead is on the clip's edge", async () => {
		const { ctx, mainIds } = await loadFixture();
		const before = mainIds();
		const out = await executeTool("split_clip", { clip_id: "clip-a", at_seconds: 2 }, ctx);
		expect(out.text).toStartWith("Declined");
		expect(mainIds()).toEqual(before);
	});

	it("split_clip reports success only when a new piece actually exists", async () => {
		const { ctx, mainIds } = await loadFixture();
		const before = mainIds().length;
		const out = await executeTool("split_clip", { clip_id: "clip-a", at_seconds: 1 }, ctx);
		expect(out.text).toStartWith("Split clip clip-a at 1.00s");
		expect(mainIds()).toHaveLength(before + 1);
	});

	it("apply_color_adjust maps the model's -1..1 onto the effect's -100..100 range", async () => {
		const { editor, ctx } = await loadFixture();
		const out = await executeTool("apply_color_adjust", { clip_id: "clip-a", brightness: 0.2 }, ctx);
		expect(out.text).toContain("brightness=0.2");
		const { getElement } = await import("../editor/actions");
		const el = getElement({ editor, ref: { trackId: "track-main", elementId: "clip-a" } });
		const adjust =
			el && "effects" in el ? el.effects?.find((e) => e.type === "adjust") : undefined;
		expect(adjust?.type).toBe("adjust");
		expect(adjust?.type === "adjust" ? adjust.params.brightness : undefined).toBe(20);
	});

	it("cut_silence reports a clip it cannot analyse as a failure, not a win", async () => {
		const { ctx } = await loadFixture();
		for (const clip_id of ["clip-title", "clip-a"]) {
			const out = await executeTool("cut_silence", { clip_id }, ctx);
			expect(out.text).toStartWith("Could not analyse");
		}
		const missing = await executeTool("cut_silence", { clip_id: "nope" }, ctx);
		expect(missing.text).toStartWith("Error");
	});

	it("get_transcript is honest that there are no captions yet", async () => {
		const { ctx } = await loadFixture();
		const out = await executeTool("get_transcript", {}, ctx);
		expect(out.text).toContain("No transcript yet");
	});

	it("generate_captions fails honestly instead of laying the sample transcript down", async () => {
		const { editor, ctx } = await loadFixture();
		const { getAllCaptions } = await import("../editor/captions-actions");
		const out = await executeTool("generate_captions", { language: "en" }, ctx);
		expect(out.text).toStartWith("Could not generate captions");
		expect(getAllCaptions({ editor })).toHaveLength(0);
	});
});
