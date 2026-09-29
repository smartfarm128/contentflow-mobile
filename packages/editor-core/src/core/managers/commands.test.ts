import { beforeEach, expect, test } from "bun:test";
import { EditorCore } from "@/core";
import { TracksSnapshotCommand } from "@/commands/timeline/tracks-snapshot";
import { buildFixtureProject, buildFixtureScene } from "@/edl/__tests__/fixture";
import type { SceneTracks } from "@/timeline/types";

const tracksWith = (ids: string[]): SceneTracks => ({
	main: {
		id: "main-track",
		name: "Main",
		type: "video",
		muted: false,
		hidden: false,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test fixture: raw numbers stand in for branded MediaTime ticks.
		elements: ids.map((id, i) => ({
			id,
			name: id,
			type: "video",
			mediaId: "m1",
			startTime: i * 1000,
			duration: 1000,
			trimStart: 0,
			trimEnd: 0,
			params: {},
		})) as never,
	},
	overlay: [],
	audio: [],
});

let editor: EditorCore;
const ids = () =>
	editor.scenes.getActiveScene().tracks.main.elements.map((e) => e.id).join(",");
const step = ({ from, to }: { from: string[]; to: string[] }) =>
	editor.command.execute({
		command: new TracksSnapshotCommand({ before: tracksWith(from), after: tracksWith(to) }),
	});

beforeEach(() => {
	EditorCore.reset();
	editor = EditorCore.getInstance();
	editor.project.setActiveProject({ project: buildFixtureProject() });
	editor.scenes.initializeScenes({ scenes: [buildFixtureScene()], currentSceneId: "scene-1" });
	editor.timeline.updateTracks(tracksWith(["a"]));
});

test("squashSince makes a multi-step operation exactly one undo", () => {
	step({ from: ["a"], to: ["a", "x"] }); // user edit before the operation
	const before = structuredClone(editor.scenes.getActiveScene().tracks);
	const mark = editor.command.mark();
	step({ from: ["a", "x"], to: ["a", "x", "b"] });
	step({ from: ["a", "x", "b"], to: ["a", "x", "b", "c"] });
	editor.command.squashSince({
		mark,
		command: new TracksSnapshotCommand({
			before,
			after: structuredClone(editor.scenes.getActiveScene().tracks),
		}),
	});

	expect(ids()).toBe("a,x,b,c");
	editor.command.undo();
	expect(ids()).toBe("a,x");
	// The next undo reaches the user's own edit, never a half-applied state.
	editor.command.undo();
	expect(ids()).toBe("a");
	expect(editor.command.canUndo()).toBe(false);

	editor.command.redo();
	editor.command.redo();
	expect(ids()).toBe("a,x,b,c");
});

test("squashSince clears redo", () => {
	step({ from: ["a"], to: ["a", "x"] });
	editor.command.undo();
	expect(editor.command.canRedo()).toBe(true);
	const mark = editor.command.mark();
	step({ from: ["a"], to: ["a", "b"] });
	editor.command.squashSince({
		mark,
		command: new TracksSnapshotCommand({ before: tracksWith(["a"]), after: tracksWith(["a", "b"]) }),
	});
	expect(editor.command.canRedo()).toBe(false);
});
