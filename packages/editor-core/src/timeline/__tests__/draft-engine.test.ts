import { describe, expect, test } from "bun:test";
import { makeDraft } from "../draft-engine";
import { EditorCore } from "../../core";
import { frameTicksForFps } from "../../wasm/media-time";
import { buildFixtureProject, buildFixtureScene } from "../../edl/__tests__/fixture";
import type { SceneTracks } from "../types";

const FPS_30 = { numerator: 30, denominator: 1 };

describe("DraftEngine in-memory sandbox and proposal lifecycle", () => {
	test("isolates draft mutations from base editor tracks and applies atomically on approval", () => {
		EditorCore.reset();
		const editor = EditorCore.getInstance();
		editor.project.setActiveProject({ project: buildFixtureProject() });
		editor.scenes.initializeScenes({
			scenes: [buildFixtureScene()],
			currentSceneId: "scene-1",
		});

		const t0 = frameTicksForFps({ frame: 0, fps: FPS_30 });
		const dur30 = frameTicksForFps({ frame: 30, fps: FPS_30 });

		const initialTracks: SceneTracks = {
			main: {
				id: "main-track",
				name: "Main",
				type: "video",
				muted: false,
				hidden: false,
				elements: [
					{
						id: "clip-m1",
						name: "Main 1",
						type: "video",
						mediaId: "m1",
						startTime: t0,
						duration: dur30,
						trimStart: t0,
						trimEnd: t0,
						params: {},
					},
				],
			},
			overlay: [],
			audio: [],
		};

		editor.timeline.updateTracks(initialTracks);

		// Create draft from live tracks
		const draft = makeDraft(initialTracks);
		expect(draft.getTracks().main.elements.length).toBe(1);

		// Mutate draft (simulate AI adding a title overlay)
		const modifiedTracks: SceneTracks = {
			...draft.getTracks(),
			overlay: [
				{
					id: "overlay-title",
					name: "Titles",
					type: "video",
					muted: false,
					hidden: false,
					elements: [
						{
							id: "clip-title-ai",
							name: "AI Title",
							type: "video",
							mediaId: "title1",
							startTime: t0,
							duration: dur30,
							trimStart: t0,
							trimEnd: t0,
							params: { content: "Draft Title" },
						},
					],
				},
			],
		};

		draft.updateTracks(modifiedTracks);

		// Live editor tracks MUST NOT have changed
		const liveTracks = editor.scenes.getActiveScene().tracks;
		expect(liveTracks.overlay.length).toBe(0);

		// Compute diff and proposal
		const proposal = draft.createProposal({ title: "Add Intro Title", summary: "Adds dynamic title on overlay track" });
		expect(proposal.diff.addedElementIds).toEqual(["clip-title-ai"]);
		expect(proposal.diff.removedElementIds).toEqual([]);

		// User approves proposal -> applyToEditor commits atomically
		draft.applyToEditor({ editor, proposal });

		const committed = editor.scenes.getActiveScene().tracks;
		expect(committed.overlay.length).toBe(1);
		expect(committed.overlay[0].elements[0].id).toBe("clip-title-ai");

		// One undo step reverts the entire proposal
		editor.command.undo();
		const reverted = editor.scenes.getActiveScene().tracks;
		expect(reverted.overlay.length).toBe(0);
		expect(reverted.main.elements.length).toBe(1);
	});
});
