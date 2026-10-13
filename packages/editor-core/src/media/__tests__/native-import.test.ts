import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { EditorCore } from "@/core";
import { resetNotifier, setNotifier } from "@/core/notifications";
import type { Notification } from "@/core/notifications";
import { buildFixtureProject, buildFixtureScene } from "@/edl/__tests__/fixture";
import {
	buildMediaAssetFromNativeImport,
	drainProxyEvents,
	formatImportFailure,
	importMediaFromNative,
	pickNativeMedia,
	prepareNativeMedia,
	type NativeMediaHandle,
	type NativeMediaSource,
	type NativeProxyProgress,
} from "../native-import";

// --- buildMediaAssetFromNativeImport: pure, no EditorCore needed -----------

describe("buildMediaAssetFromNativeImport", () => {
	const handle: NativeMediaHandle = {
		id: "native-1",
		uri: "/sandbox/Media/native-1.mp4",
		kind: "video",
		fileName: "clip.mp4",
		sizeBytes: 827_678,
		durationMicros: 4_000_000,
		width: 960,
		height: 540,
		hasAudio: true,
		codec: "avc1",
		frameRate: { numerator: 30, denominator: 1 },
	};
	const doneProxy: NativeProxyProgress = {
		assetId: "native-1",
		stage: "done",
		fraction: 1,
		proxyUri: "/sandbox/Proxies/native-1.mp4",
		proxyWidth: 480,
		proxyHeight: 270,
		thumbnailUris: [
			"/sandbox/Thumbnails/native-1/thumb-000.jpg",
			"/sandbox/Thumbnails/native-1/thumb-001.jpg",
		],
	};
	const toPlaybackUri = (uri: string) => `capacitor://localhost/_capacitor_file_${uri}`;

	test("maps a done proxy to the right MediaAsset shape", () => {
		const asset = buildMediaAssetFromNativeImport({ handle, proxy: doneProxy, toPlaybackUri });

		expect(asset.name).toBe("clip.mp4");
		expect(asset.type).toBe("video");
		expect(asset.url).toBe("capacitor://localhost/_capacitor_file_/sandbox/Proxies/native-1.mp4");
		// Proxy dims win over source dims — that's what the webview will
		// actually be compositing against.
		expect(asset.width).toBe(480);
		expect(asset.height).toBe(270);
		expect(asset.duration).toBeCloseTo(4.0, 5);
		expect(asset.fps).toBe(30);
		expect(asset.hasAudio).toBe(true);
		expect(asset.thumbnailUrl).toBe(
			"capacitor://localhost/_capacitor_file_/sandbox/Thumbnails/native-1/thumb-000.jpg",
		);
		// Never real bytes on the JS heap — see the file's own header comment.
		expect(asset.file.size).toBe(0);
		expect(asset.file.name).toBe("clip.mp4");
	});

	test("fps is undefined when the native probe reported no frame rate (e.g. an image)", () => {
		const imageHandle: NativeMediaHandle = { ...handle, kind: "image", frameRate: null, hasAudio: false };
		const imageProxy: NativeProxyProgress = { ...doneProxy, proxyWidth: undefined, proxyHeight: undefined };
		const asset = buildMediaAssetFromNativeImport({ handle: imageHandle, proxy: imageProxy, toPlaybackUri });
		expect(asset.fps).toBeUndefined();
		// Falls back to the source probe's dims when the proxy didn't resize anything.
		expect(asset.width).toBe(960);
		expect(asset.height).toBe(540);
	});

	test("throws if the proxy is not stage \"done\"", () => {
		const errorProxy: NativeProxyProgress = { assetId: "native-1", stage: "error", fraction: 1, error: "boom" };
		expect(() =>
			buildMediaAssetFromNativeImport({ handle, proxy: errorProxy, toPlaybackUri }),
		).toThrow();
	});

	test("thumbnailUrl is undefined when the proxy produced no thumbnail strip", () => {
		const noThumbs: NativeProxyProgress = { ...doneProxy, thumbnailUris: undefined };
		const asset = buildMediaAssetFromNativeImport({ handle, proxy: noThumbs, toPlaybackUri });
		expect(asset.thumbnailUrl).toBeUndefined();
	});
});

// --- importMediaFromNative: the full orchestration, against a real ---------
// --- EditorCore singleton and a fake NativeMediaSource. --------------------

function fakeSource(overrides: Partial<NativeMediaSource> = {}): NativeMediaSource {
	return {
		async pickMedia() {
			return [];
		},
		async *generateProxy() {
			// no-op default
		},
		toPlaybackUri: (uri: string) => `webview://${uri}`,
		async getMediaRoot() {
			return null;
		},
		...overrides,
	};
}

function makeHandle(id: string): NativeMediaHandle {
	return {
		id,
		uri: `/sandbox/Media/${id}.mp4`,
		kind: "video",
		fileName: `${id}.mp4`,
		sizeBytes: 1000,
		durationMicros: 2_000_000,
		width: 640,
		height: 360,
		hasAudio: true,
		codec: "avc1",
		frameRate: { numerator: 30, denominator: 1 },
	};
}

describe("importMediaFromNative", () => {
	let notifications: Notification[] = [];

	beforeEach(() => {
		EditorCore.reset();
		notifications = [];
		setNotifier((n) => notifications.push(n));
		// AddMediaAssetCommand's own failure-handling path (storage save
		// rejects -> roll back the optimistic add) reads
		// `editor.scenes.getActiveScene()`, which throws if nothing has ever
		// set an active project/scene — as nothing does by default under
		// `bun test` (there's no earlier app-boot step to have done it). Reuse
		// the EDL fixture's project+scene (already exercised elsewhere in this
		// package) purely as bootstrap data; these tests don't touch its
		// content.
		const editor = EditorCore.getInstance();
		editor.project.setActiveProject({ project: buildFixtureProject() });
		editor.scenes.initializeScenes({
			scenes: [buildFixtureScene()],
			currentSceneId: "scene-1",
		});
	});

	afterEach(() => {
		resetNotifier();
		EditorCore.reset();
	});

	test("no media picked -> empty result, no assets added, no crash", async () => {
		const editor = EditorCore.getInstance();
		const result = await importMediaFromNative({
			editor,
			projectId: "p1",
			source: fakeSource(),
			kinds: ["video"],
			allowMultiple: false,
		});
		expect(result.imported).toHaveLength(0);
		expect(result.failed).toHaveLength(0);
		expect(editor.media.getAssets()).toHaveLength(0);
	});

	test("a successful import adds exactly one MediaAsset to the editor", async () => {
		const editor = EditorCore.getInstance();
		const handle = makeHandle("a1");
		const source = fakeSource({
			async pickMedia() {
				return [handle];
			},
			async *generateProxy({ handle: h }) {
				yield { assetId: h.id, stage: "transcoding", fraction: 0.5 } satisfies NativeProxyProgress;
				yield {
					assetId: h.id,
					stage: "done",
					fraction: 1,
					proxyUri: `/sandbox/Proxies/${h.id}.mp4`,
					proxyWidth: 320,
					proxyHeight: 180,
				} satisfies NativeProxyProgress;
			},
		});

		const result = await importMediaFromNative({
			editor,
			projectId: "p1",
			source,
			kinds: ["video"],
			allowMultiple: false,
		});

		expect(result.failed).toHaveLength(0);
		expect(result.imported).toHaveLength(1);
		expect(result.imported[0]?.name).toBe("a1.mp4");
		expect(result.imported[0]?.url).toBe(`webview:///sandbox/Proxies/a1.mp4`);
		// It really landed in the engine's media list, not just the return value.
		expect(editor.media.getAssets()).toHaveLength(1);
		expect(editor.media.getAssets()[0]?.id).toBe(result.imported[0]?.id);
	});

	test("a proxy that ends in \"error\" is routed to `failed`, not thrown, and does not add an asset", async () => {
		const editor = EditorCore.getInstance();
		const handle = makeHandle("bad1");
		const source = fakeSource({
			async pickMedia() {
				return [handle];
			},
			async *generateProxy({ handle: h }) {
				yield { assetId: h.id, stage: "error", fraction: 1, error: "unsupported codec" } satisfies NativeProxyProgress;
			},
		});

		const result = await importMediaFromNative({
			editor,
			projectId: "p1",
			source,
			kinds: ["video"],
			allowMultiple: false,
		});

		expect(result.imported).toHaveLength(0);
		expect(result.failed).toHaveLength(1);
		expect(result.failed[0]?.error).toBe("Import failed at proxy: unsupported codec");
		expect(editor.media.getAssets()).toHaveLength(0);
		expect(notifications.some((n) => n.level === "error")).toBe(true);
	});

	test("generateProxy throwing mid-stream is caught, routed to `failed`, and doesn't abort the rest of the batch", async () => {
		const editor = EditorCore.getInstance();
		const throwingHandle = makeHandle("throws1");
		const okHandle = makeHandle("ok1");
		const source = fakeSource({
			async pickMedia() {
				return [throwingHandle, okHandle];
			},
			async *generateProxy({ handle: h }) {
				if (h.id === "throws1") {
					throw new Error("native transcode crashed");
				}
				yield {
					assetId: h.id,
					stage: "done",
					fraction: 1,
					proxyUri: `/sandbox/Proxies/${h.id}.mp4`,
				} satisfies NativeProxyProgress;
			},
		});

		const result = await importMediaFromNative({
			editor,
			projectId: "p1",
			source,
			kinds: ["video"],
			allowMultiple: true,
		});

		expect(result.failed).toHaveLength(1);
		expect(result.failed[0]?.handle.id).toBe("throws1");
		expect(result.imported).toHaveLength(1);
		expect(result.imported[0]?.name).toBe("ok1.mp4");
	});

	test("multiple successful imports each get distinct MediaAsset ids", async () => {
		const editor = EditorCore.getInstance();
		const h1 = makeHandle("m1");
		const h2 = makeHandle("m2");
		const source = fakeSource({
			async pickMedia() {
				return [h1, h2];
			},
			async *generateProxy({ handle: h }) {
				yield {
					assetId: h.id,
					stage: "done",
					fraction: 1,
					proxyUri: `/sandbox/Proxies/${h.id}.mp4`,
				} satisfies NativeProxyProgress;
			},
		});

		const result = await importMediaFromNative({
			editor,
			projectId: "p1",
			source,
			kinds: ["video"],
			allowMultiple: true,
		});

		expect(result.imported).toHaveLength(2);
		expect(result.imported[0]?.id).not.toBe(result.imported[1]?.id);
		expect(editor.media.getAssets()).toHaveLength(2);
	});
});

// --- pick / prepare split: usable BEFORE any project exists ----------------

describe("pickNativeMedia + prepareNativeMedia (no project)", () => {
	beforeEach(() => {
		EditorCore.reset();
		setNotifier(() => {});
	});

	afterEach(() => {
		resetNotifier();
		EditorCore.reset();
	});

	test("Android USER_CANCELLED rejection is an empty pick, not an error", async () => {
		const cancelled = Object.assign(new Error("cancelled"), {
			code: "USER_CANCELLED",
		});
		const result = await pickNativeMedia({
			source: fakeSource({
				async pickMedia() {
					throw cancelled;
				},
			}),
			kinds: ["video"],
			allowMultiple: false,
		});
		expect(result).toEqual({ handles: [], pickFailures: 0 });
	});

	test("any other picker rejection still throws", async () => {
		const source = fakeSource({
			async pickMedia() {
				throw Object.assign(new Error("boom"), { code: "INTERNAL" });
			},
		});
		await expect(
			pickNativeMedia({ source, kinds: ["video"], allowMultiple: false }),
		).rejects.toThrow("boom");
	});

	test("onPickStart fires once on the first native event; failures are counted", async () => {
		let starts = 0;
		const h1 = makeHandle("p1");
		const result = await pickNativeMedia({
			source: fakeSource({
				async pickMedia({ onProgress }) {
					onProgress?.({ index: 0, total: 2, stage: "loading", fraction: 0 });
					onProgress?.({ index: 0, total: 2, stage: "loaded", fraction: 1 });
					onProgress?.({ index: 1, total: 2, stage: "error", fraction: 0, error: "x" });
					return [h1];
				},
			}),
			kinds: ["video"],
			allowMultiple: true,
			onPickStart: () => starts++,
		});
		expect(starts).toBe(1);
		expect(result.handles).toEqual([h1]);
		expect(result.pickFailures).toBe(1);
	});

	test("prepareNativeMedia needs no active project and splits prepared/failed", async () => {
		expect(EditorCore.getInstance().project.getActiveOrNull()).toBeNull();
		const good = makeHandle("good");
		const bad = makeHandle("bad");
		const image: NativeMediaHandle = { ...makeHandle("img"), kind: "image" };
		const result = await prepareNativeMedia({
			source: fakeSource({
				async *generateProxy({ handle: h }) {
					yield h.id === "bad"
						? ({ assetId: h.id, stage: "error", fraction: 0, error: "codec" } satisfies NativeProxyProgress)
						: ({ assetId: h.id, stage: "done", fraction: 1, proxyUri: `/p/${h.id}.mp4` } satisfies NativeProxyProgress);
				},
			}),
			handles: [good, bad, image],
		});
		expect(result.prepared.map((p) => p.handle.id)).toEqual(["good", "img"]);
		expect(result.prepared[1]?.proxy.proxyUri).toBe(image.uri);
		expect(result.failed).toEqual([{ handle: bad, error: "Import failed at proxy: codec" }]);
	});
});

describe("post-copy import step timeouts", () => {
	test("formatImportFailure names the step and keeps a native prefix", () => {
		expect(formatImportFailure({ step: "proxy", detail: "no progress for 45s" })).toBe(
			"Import failed at proxy: no progress for 45s",
		);
		expect(
			formatImportFailure({
				step: "proxy",
				detail: "Import failed at thumbnails: timed out after 8s",
			}),
		).toBe("Import failed at thumbnails: timed out after 8s");
		expect(
			formatImportFailure({
				step: "thumbnails",
				detail: "Import failed at proxy: cancelled",
			}),
		).toBe("Import failed at proxy: cancelled");
	});

	test("a proxy stream that never emits again fails at proxy", async () => {
		async function* hang(): AsyncGenerator<NativeProxyProgress> {
			yield { assetId: "a", stage: "transcoding", fraction: 0.2 };
			await new Promise(() => {});
		}
		await expect(
			drainProxyEvents({
				events: hang(),
				onEvent: () => {},
				silenceMs: { proxy: 1000, thumbnails: 1000 },
				fileName: "clip.mov",
			}),
		).rejects.toThrow("Import failed at proxy: timed out after 1s");
	});

	test("after the 95% thumbnail marker a silent stream fails at thumbnails", async () => {
		async function* hang(): AsyncGenerator<NativeProxyProgress> {
			yield { assetId: "a", stage: "transcoding", fraction: 0.4 };
			yield { assetId: "a", stage: "thumbnails", fraction: 0.95 };
			await new Promise(() => {});
		}
		const seen: string[] = [];
		await expect(
			drainProxyEvents({
				events: hang(),
				onEvent: (event) => seen.push(event.stage),
				silenceMs: { proxy: 5_000, thumbnails: 1000 },
				fileName: "clip.mov",
			}),
		).rejects.toThrow("Import failed at thumbnails: timed out after 1s");
		expect(seen).toEqual(["transcoding", "thumbnails"]);
	});
});
