import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { addMediaTime } from "@kneecap/editor-core/wasm";
import {
	EditorCore,
	ZERO_MEDIA_TIME,
	type NativeMediaHandle,
	type NativeMediaSource,
	type NativeProxyProgress,
} from "@kneecap/editor-core";
import { resetNotifier, setNotifier } from "../../../editor-core/src/core/notifications";
import { buildFixtureProject } from "../../../editor-core/src/edl/__tests__/fixture";
import { buildDefaultScene } from "../../../editor-core/src/timeline/scenes";
import { createProjectFromPickedMedia } from "./actions";

/**
 * Start Creating's contract: no project exists until picked media is
 * ready. Storage is IndexedDB (absent under bun), so createNewProject /
 * saveCurrentProject are replaced on the instance with in-memory versions
 * that record the call order.
 */

function makeHandle({ id, kind = "video" }: { id: string; kind?: "video" | "image" }): NativeMediaHandle {
	return {
		id,
		uri: `/sandbox/Media/${id}.${kind === "video" ? "mp4" : "jpg"}`,
		kind,
		fileName: `${id}.${kind === "video" ? "mp4" : "jpg"}`,
		sizeBytes: 1000,
		durationMicros: kind === "video" ? 2_000_000 : 0,
		width: 640,
		height: 360,
		hasAudio: kind === "video",
		codec: kind === "video" ? "avc1" : "jpeg",
		frameRate: kind === "video" ? { numerator: 30, denominator: 1 } : null,
	};
}

function fakeSource(overrides: Partial<NativeMediaSource> = {}): NativeMediaSource {
	return {
		async pickMedia() {
			return [];
		},
		async *generateProxy({ handle }) {
			yield {
				assetId: handle.id,
				stage: "done",
				fraction: 1,
				proxyUri: `/sandbox/Proxies/${handle.id}.mp4`,
			} satisfies NativeProxyProgress;
		},
		toPlaybackUri: (uri: string) => `webview://${uri}`,
		async getMediaRoot() {
			return null;
		},
		...overrides,
	};
}

describe("createProjectFromPickedMedia", () => {
	let calls: string[] = [];
	let editor: EditorCore;

	beforeEach(() => {
		EditorCore.reset();
		setNotifier(() => {});
		calls = [];
		editor = EditorCore.getInstance();
		editor.project.createNewProject = async ({ name }) => {
			calls.push("createNewProject");
			const scene = buildDefaultScene({ name: "Main scene", isMain: true });
			const base = buildFixtureProject();
			editor.project.setActiveProject({
				project: {
					...base,
					metadata: { ...base.metadata, id: "new-project", name },
					scenes: [scene],
					currentSceneId: scene.id,
				},
			});
			editor.scenes.initializeScenes({ scenes: [scene], currentSceneId: scene.id });
			return "new-project";
		};
		editor.project.saveCurrentProject = async () => {
			calls.push("saveCurrentProject");
		};
	});

	afterEach(() => {
		resetNotifier();
		EditorCore.reset();
	});

	it("cancel creates nothing and never announces a pick", async () => {
		let picked = 0;
		const outcome = await createProjectFromPickedMedia({
			editor,
			name: "Project 1",
			source: fakeSource(),
			onPicked: () => picked++,
		});
		expect(outcome).toEqual({ kind: "cancelled" });
		expect(picked).toBe(0);
		expect(calls).toEqual([]);
		expect(editor.project.getActiveOrNull()).toBeNull();
	});

	it("Android USER_CANCELLED is a cancel, not a failure", async () => {
		const outcome = await createProjectFromPickedMedia({
			editor,
			name: "Project 1",
			source: fakeSource({
				async pickMedia() {
					throw Object.assign(new Error("cancelled"), { code: "USER_CANCELLED" });
				},
			}),
		});
		expect(outcome).toEqual({ kind: "cancelled" });
		expect(calls).toEqual([]);
	});

	it("every pick failing reports failure and creates nothing", async () => {
		const outcome = await createProjectFromPickedMedia({
			editor,
			name: "Project 1",
			source: fakeSource({
				async pickMedia({ onProgress }) {
					onProgress?.({ index: 0, total: 1, stage: "error", fraction: 0, error: "offline" });
					return [];
				},
			}),
		});
		expect(outcome.kind).toBe("failed");
		expect(calls).toEqual([]);
		expect(editor.project.getActiveOrNull()).toBeNull();
	});

	it("every proxy failing reports failure and creates nothing", async () => {
		const outcome = await createProjectFromPickedMedia({
			editor,
			name: "Project 1",
			source: fakeSource({
				async pickMedia() {
					return [makeHandle({ id: "v1" })];
				},
				async *generateProxy({ handle }) {
					yield { assetId: handle.id, stage: "error", fraction: 0, error: "unsupported codec" } satisfies NativeProxyProgress;
				},
			}),
		});
		expect(outcome).toEqual({
			kind: "failed",
			message: "Couldn't import the selected media: unsupported codec",
		});
		expect(calls).toEqual([]);
		expect(editor.project.getActiveOrNull()).toBeNull();
	});

	it("video + image: project created after prep, clips back to back from 0, first selected, no undo, saved", async () => {
		const order: string[] = [];
		const outcome = await createProjectFromPickedMedia({
			editor,
			name: "Project 7",
			source: fakeSource({
				async pickMedia({ onProgress }) {
					onProgress?.({ index: 0, total: 2, stage: "loading", fraction: 0 });
					onProgress?.({ index: 0, total: 2, stage: "loaded", fraction: 1 });
					return [makeHandle({ id: "v1" }), makeHandle({ id: "i1", kind: "image" })];
				},
			}),
			onPicked: () => order.push("picked"),
			onProgress: (p) => {
				if (order.at(-1) !== p.stage) order.push(p.stage);
			},
		});

		expect(outcome).toEqual({ kind: "created", projectId: "new-project" });
		expect(order.filter((s) => s === "picked")).toHaveLength(1);
		expect(order[0]).toBe("picked");
		expect(calls).toEqual(["createNewProject", "saveCurrentProject"]);
		expect(editor.project.getActive().metadata.name).toBe("Project 7");

		const main = editor.scenes.getActiveScene().tracks.main.elements;
		expect(main).toHaveLength(2);
		const [first, second] = main;
		expect(first?.startTime).toBe(ZERO_MEDIA_TIME);
		expect(second?.startTime).toBe(first ? addMediaTime({ a: first.startTime, b: first.duration }) : ZERO_MEDIA_TIME);

		const selected = editor.selection.getSelectedElements();
		expect(selected.map((s) => s.elementId)).toEqual([first?.id]);
		expect(editor.command.canUndo()).toBe(false);
	});
});
