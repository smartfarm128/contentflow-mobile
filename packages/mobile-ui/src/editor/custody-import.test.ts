import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	EditorCore,
	mediaTimeToSeconds,
	registerNativeMediaPathResolver,
	resolveNativeMediaRawPath,
} from "@kneecap/editor-core";
import type { MediaHandle } from "@kneecap/native-bridge";
import { resetNotifier, setNotifier } from "../../../editor-core/src/core/notifications";
import { buildFixtureProject } from "../../../editor-core/src/edl/__tests__/fixture";
import { __resetNativeMediaPathResolverForTests } from "../../../editor-core/src/media/native-paths";
import { buildDefaultScene } from "../../../editor-core/src/timeline/scenes";
import { importRemoteMediaToTimeline, type RemoteImportBridge } from "./custody-import";
import { elevenLabsSpeechRequest } from "./elevenlabs-voice";
import { useVaultStore } from "../vault/vault-store";

/**
 * Pexels and ElevenLabs used to land as blob: URLs with a guessed duration
 * and hasAudio: false. These cases pin the custody import: the probe's
 * duration and hasAudio are what the project stores, a file:// handle
 * still gets a container-relative path, and a requested clip length trims
 * the element without shortening the asset.
 */

const ROOT = "/sandbox/kneecap";

function toPlaybackUri(uri: string): string {
	const path = uri.startsWith("file://") ? uri.slice("file://".length) : uri;
	return `capacitor://localhost/_capacitor_file_${path}`;
}

function handle(overrides: Partial<MediaHandle> & Pick<MediaHandle, "id" | "uri" | "kind">): MediaHandle {
	return {
		fileName: "clip.mp4",
		sizeBytes: 1000,
		durationMicros: 6_000_000,
		width: 1280,
		height: 720,
		rotationDegrees: 0,
		hasAudio: true,
		codec: "avc1",
		frameRate: { numerator: 30, denominator: 1 },
		...overrides,
	};
}

function fakeBridge({
	media,
	proxyCalls,
}: {
	media: MediaHandle;
	proxyCalls?: { n: number };
}): RemoteImportBridge {
	return {
		async importRemoteMedia() {
			return media;
		},
		async *generateProxy({ handle: incoming }) {
			if (proxyCalls) proxyCalls.n += 1;
			yield {
				assetId: incoming.id,
				stage: "done",
				fraction: 1,
				proxyUri: `${ROOT}/Proxies/${incoming.id}.mp4`,
			};
		},
		toPlaybackUri,
		async getMediaRoot() {
			return ROOT;
		},
	};
}

function bootEditor(): EditorCore {
	const editor = EditorCore.getInstance();
	const scene = buildDefaultScene({ name: "Main scene", isMain: true });
	const base = buildFixtureProject();
	editor.project.setActiveProject({
		project: {
			...base,
			metadata: { ...base.metadata, id: "custody-project", name: "Custody" },
			scenes: [scene],
			currentSceneId: scene.id,
		},
	});
	editor.scenes.initializeScenes({ scenes: [scene], currentSceneId: scene.id });
	return editor;
}

function placedSeconds({ editor, name }: { editor: EditorCore; name: string }): number {
	const tracks = editor.scenes.getActiveScene().tracks;
	const onMain = tracks.main.elements.find((element) => element.name === name);
	if (onMain) return mediaTimeToSeconds({ time: onMain.duration });
	for (const track of tracks.audio) {
		const element = track.elements.find((item) => item.name === name);
		if (element) return mediaTimeToSeconds({ time: element.duration });
	}
	throw new Error(`no element named ${name}`);
}

describe("importRemoteMediaToTimeline", () => {
	beforeEach(() => {
		EditorCore.reset();
		setNotifier(() => {});
		__resetNativeMediaPathResolverForTests();
	});

	afterEach(() => {
		resetNotifier();
		EditorCore.reset();
		__resetNativeMediaPathResolverForTests();
	});

	test("a file:// video keeps the probed duration, hasAudio, and a relative path", async () => {
		const editor = bootEditor();
		const proxyCalls = { n: 0 };
		const placed = await importRemoteMediaToTimeline({
			editor,
			request: {
				url: "https://videos.pexels.com/example.mp4",
				kind: "video",
				fileName: "Stock b-roll.mp4",
			},
			name: "Stock b-roll",
			clipDurationSec: 4,
			bridge: fakeBridge({
				proxyCalls,
				media: handle({
					id: "stock-1",
					uri: `file://${ROOT}/media/clip.mp4`,
					kind: "video",
					fileName: "Stock b-roll.mp4",
				}),
			}),
		});

		expect(proxyCalls.n).toBe(1);
		expect(placed.assetDurationSec).toBeCloseTo(6, 5);
		expect(placed.durationSec).toBeCloseTo(4, 5);
		expect(placed.hasAudio).toBe(true);
		const asset = editor.media.getAssets().find((item) => item.id === placed.assetId);
		expect(asset?.duration).toBeCloseTo(6, 5);
		expect(asset?.hasAudio).toBe(true);
		expect(asset?.sourceNativeRelativePath).toBe("media/clip.mp4");
		expect(asset?.url?.startsWith("blob:")).toBe(false);
		expect(placedSeconds({ editor, name: "Stock b-roll" })).toBeCloseTo(4, 5);

		registerNativeMediaPathResolver({
			root: "/new-container/kneecap",
			toPlaybackUri,
		});
		expect(resolveNativeMediaRawPath("media/clip.mp4")).toBe("/new-container/kneecap/media/clip.mp4");
	});

	test("audio uses the probed length and does not run the video proxy", async () => {
		const editor = bootEditor();
		const proxyCalls = { n: 0 };
		const placed = await importRemoteMediaToTimeline({
			editor,
			request: {
				url: "https://api.elevenlabs.io/v1/text-to-speech/voice",
				kind: "audio",
				fileName: "voiceover.mp3",
				method: "POST",
				headers: { "xi-api-key": "xi-test" },
				body: "{\"text\":\"hello\"}",
			},
			name: "VO fixture",
			bridge: fakeBridge({
				proxyCalls,
				media: handle({
					id: "voice-1",
					uri: `${ROOT}/media/voice.mp3`,
					kind: "audio",
					fileName: "voiceover.mp3",
					durationMicros: 2_500_000,
					width: 0,
					height: 0,
					codec: "mp3",
					frameRate: null,
				}),
			}),
		});

		expect(proxyCalls.n).toBe(0);
		expect(placed.durationSec).toBeCloseTo(2.5, 5);
		expect(placed.assetDurationSec).toBeCloseTo(2.5, 5);
		expect(placed.hasAudio).toBe(true);
		const asset = editor.media.getAssets().find((item) => item.id === placed.assetId);
		expect(asset?.sourceNativeRelativePath).toBe("media/voice.mp3");
		expect(asset?.type).toBe("audio");
		expect(placedSeconds({ editor, name: "VO fixture" })).toBeCloseTo(2.5, 5);
		expect(editor.scenes.getActiveScene().tracks.audio.length).toBeGreaterThan(0);
	});

	test("a still with a zero probe uses the three-second clip default", async () => {
		const editor = bootEditor();
		const placed = await importRemoteMediaToTimeline({
			editor,
			request: {
				url: "file:///sandbox/kneecap/media/still.jpg",
				kind: "image",
				fileName: "still.jpg",
			},
			name: "Stock photo",
			bridge: fakeBridge({
				media: handle({
					id: "still-1",
					uri: `${ROOT}/media/still.jpg`,
					kind: "image",
					fileName: "still.jpg",
					durationMicros: 0,
					hasAudio: false,
					codec: "jpeg",
					frameRate: null,
				}),
			}),
		});
		expect(placed.assetDurationSec).toBe(0);
		expect(placed.durationSec).toBeCloseTo(3, 5);
		expect(placed.hasAudio).toBe(false);
	});
});

describe("elevenLabsSpeechRequest", () => {
	afterEach(() => {
		useVaultStore.setState({ isConfigured: false, isUnlocked: false, keys: {} });
	});

	test("posts the spoken text and keeps the API key out of the URL", () => {
		useVaultStore.setState({
			isConfigured: true,
			isUnlocked: true,
			keys: { elevenlabs: "xi-test-key" },
		});
		const request = elevenLabsSpeechRequest({
			text: "Hello from the director",
			voiceId: "voice-abc",
		});
		expect(request.method).toBe("POST");
		expect(request.fileName).toBe("voiceover.mp3");
		expect(request.url).toBe("https://api.elevenlabs.io/v1/text-to-speech/voice-abc");
		expect(request.url.includes("xi-test-key")).toBe(false);
		expect(request.headers["xi-api-key"]).toBe("xi-test-key");
		expect(request.body.includes("Hello from the director")).toBe(true);
	});

	test("refuses to build a request with no key", () => {
		useVaultStore.setState({ isConfigured: false, isUnlocked: false, keys: {} });
		expect(() => elevenLabsSpeechRequest({ text: "Hello", voiceId: "voice-abc" })).toThrow(
			/API key/,
		);
	});
});
