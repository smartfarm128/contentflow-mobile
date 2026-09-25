import { beforeEach, describe, expect, test } from "bun:test";
import { MoveElementCommand } from "../../commands/timeline/element/move-elements";
import { EditorCore } from "../../core";
import { frameTicksForFps } from "../../wasm/media-time";
import { buildFixtureProject, buildFixtureScene } from "../../edl/__tests__/fixture";
import type { SceneTracks } from "../types";

const FPS_30 = { numerator: 30, denominator: 1 };

describe("MoveElementCommand cross-track moves", () => {
	beforeEach(() => {
		EditorCore.reset();
		const editor = EditorCore.getInstance();
		editor.project.setActiveProject({ project: buildFixtureProject() });
		editor.scenes.initializeScenes({
			scenes: [buildFixtureScene()],
			currentSceneId: "scene-1",
		});
	});

	test("moves element from main to overlay track and cleanly rebutts main", () => {
		const editor = EditorCore.getInstance();

		const t0 = frameTicksForFps({ frame: 0, fps: FPS_30 });
		const t60 = frameTicksForFps({ frame: 60, fps: FPS_30 });
		const dur60 = frameTicksForFps({ frame: 60, fps: FPS_30 });

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
						duration: dur60,
						trimStart: t0,
						trimEnd: t0,
						params: {},
					},
					{
						id: "clip-m2",
						name: "Main 2",
						type: "video",
						mediaId: "m2",
						startTime: t60,
						duration: dur60,
						trimStart: t0,
						trimEnd: t0,
						params: {},
					},
				],
			},
			overlay: [
				{
					id: "overlay-1",
					name: "Overlay 1",
					type: "video",
					muted: false,
					hidden: false,
					elements: [],
				},
			],
			audio: [],
		};

		editor.timeline.updateTracks(initialTracks);

		// Move clip-m1 from main to overlay-1 at frame 30
		const targetStart = frameTicksForFps({ frame: 30, fps: FPS_30 });
		const cmd = new MoveElementCommand({
			moves: [
				{
					sourceTrackId: "main-track",
					targetTrackId: "overlay-1",
					elementId: "clip-m1",
					newStartTime: targetStart,
				},
			],
		});

		editor.command.execute({ command: cmd });

		const after = editor.scenes.getActiveScene().tracks;
		// clip-m1 should now be on overlay-1
		expect(after.overlay[0].elements.length).toBe(1);
		expect(after.overlay[0].elements[0].id).toBe("clip-m1");
		expect(after.overlay[0].elements[0].startTime).toBe(targetStart);

		// clip-m2 on main should have been rebutted from frame 0 (startTime === t0)
		expect(after.main.elements.length).toBe(1);
		expect(after.main.elements[0].id).toBe("clip-m2");
		expect(after.main.elements[0].startTime).toBe(t0);

		// Undo restores initial state
		editor.command.undo();
		const restored = editor.scenes.getActiveScene().tracks;
		expect(restored.main.elements.length).toBe(2);
		expect(restored.main.elements[0].id).toBe("clip-m1");
		expect(restored.overlay[0].elements.length).toBe(0);
	});

	test("moves element from overlay track onto main track and rebutts", () => {
		const editor = EditorCore.getInstance();

		const t0 = frameTicksForFps({ frame: 0, fps: FPS_30 });
		const t30 = frameTicksForFps({ frame: 30, fps: FPS_30 });
		const dur60 = frameTicksForFps({ frame: 60, fps: FPS_30 });

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
						duration: dur60,
						trimStart: t0,
						trimEnd: t0,
						params: {},
					},
				],
			},
			overlay: [
				{
					id: "overlay-1",
					name: "Overlay 1",
					type: "video",
					muted: false,
					hidden: false,
					elements: [
						{
							id: "clip-ov1",
							name: "Overlay 1",
							type: "video",
							mediaId: "ov1",
							startTime: t30,
							duration: dur60,
							trimStart: t0,
							trimEnd: t0,
							params: {},
						},
					],
				},
			],
			audio: [],
		};

		editor.timeline.updateTracks(initialTracks);

		// Move clip-ov1 to main track at frame 90 (after clip-m1)
		const targetStart = frameTicksForFps({ frame: 90, fps: FPS_30 });
		const cmd = new MoveElementCommand({
			moves: [
				{
					sourceTrackId: "overlay-1",
					targetTrackId: "main-track",
					elementId: "clip-ov1",
					newStartTime: targetStart,
				},
			],
		});

		editor.command.execute({ command: cmd });

		const after = editor.scenes.getActiveScene().tracks;
		// Empty overlay track is cleanly pruned when all elements move off it
		expect(after.overlay.length).toBe(0);
		// Main should now have both clips, rebutted sequentially from 0
		expect(after.main.elements.length).toBe(2);
		expect(after.main.elements[0].id).toBe("clip-m1");
		expect(after.main.elements[0].startTime).toBe(t0);
		expect(after.main.elements[1].id).toBe("clip-ov1");
		expect(after.main.elements[1].startTime).toBe(dur60); // 60 frames in

		// Undo restores overlay-1 with clip-ov1 and main with only clip-m1
		editor.command.undo();
		const restored = editor.scenes.getActiveScene().tracks;
		expect(restored.overlay.length).toBe(1);
		expect(restored.overlay[0].elements.length).toBe(1);
		expect(restored.overlay[0].elements[0].id).toBe("clip-ov1");
		expect(restored.main.elements.length).toBe(1);
		expect(restored.main.elements[0].id).toBe("clip-m1");
	});

	test("moves element between overlay tracks", () => {
		const editor = EditorCore.getInstance();

		const t0 = frameTicksForFps({ frame: 0, fps: FPS_30 });
		const t30 = frameTicksForFps({ frame: 30, fps: FPS_30 });
		const t45 = frameTicksForFps({ frame: 45, fps: FPS_30 });
		const dur60 = frameTicksForFps({ frame: 60, fps: FPS_30 });

		const initialTracks: SceneTracks = {
			main: {
				id: "main-track",
				name: "Main",
				type: "video",
				muted: false,
				hidden: false,
				elements: [],
			},
			overlay: [
				{
					id: "overlay-1",
					name: "Overlay 1",
					type: "video",
					muted: false,
					hidden: false,
					elements: [
						{
							id: "clip-ov1",
							name: "Overlay 1",
							type: "video",
							mediaId: "ov1",
							startTime: t0,
							duration: dur60,
							trimStart: t0,
							trimEnd: t0,
							params: {},
						},
					],
				},
				{
					id: "overlay-2",
					name: "Overlay 2",
					type: "video",
					muted: false,
					hidden: false,
					elements: [
						{
							id: "clip-ov2",
							name: "Overlay 2",
							type: "video",
							mediaId: "ov2",
							startTime: t30,
							duration: dur60,
							trimStart: t0,
							trimEnd: t0,
							params: {},
						},
					],
				},
			],
			audio: [],
		};

		editor.timeline.updateTracks(initialTracks);

		// Move clip-ov1 from overlay-1 to overlay-2 at frame 45
		const cmd = new MoveElementCommand({
			moves: [
				{
					sourceTrackId: "overlay-1",
					targetTrackId: "overlay-2",
					elementId: "clip-ov1",
					newStartTime: t45,
				},
			],
		});

		editor.command.execute({ command: cmd });

		const after = editor.scenes.getActiveScene().tracks;
		// overlay-1 is empty so it was pruned
		expect(after.overlay.length).toBe(1);
		expect(after.overlay[0].id).toBe("overlay-2");
		expect(after.overlay[0].elements.length).toBe(2);
		expect(after.overlay[0].elements.some((e) => e.id === "clip-ov1" && e.startTime === t45)).toBe(true);

		// Undo restores both tracks
		editor.command.undo();
		const restored = editor.scenes.getActiveScene().tracks;
		expect(restored.overlay.length).toBe(2);
		expect(restored.overlay[0].elements.length).toBe(1);
		expect(restored.overlay[1].elements.length).toBe(1);
	});
});
