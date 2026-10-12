import { describe, expect, test } from "bun:test";
import { buildEdl, type Edl, type EdlClip, listNativeExportOmissions } from "../index";
import {
	buildFixtureMediaAssets,
	buildFixtureProject,
	buildFixtureScene,
	fixtureAssetResolver,
	FIXTURE_OUTPUT,
} from "./fixture";

function buildFixtureEdl(): Edl {
	return buildEdl({
		project: buildFixtureProject(),
		scene: buildFixtureScene(),
		mediaAssets: buildFixtureMediaAssets(),
		output: FIXTURE_OUTPUT,
		resolveAsset: fixtureAssetResolver,
	});
}

function cloneClip({ edl }: { edl: Edl }): EdlClip {
	const clip = edl.tracks[0]?.clips[0];
	if (!clip) throw new Error("fixture has no main clip");
	return {
		...clip,
		transform: { ...clip.transform },
		speed: { ...clip.speed },
		effects: [],
		masks: [],
		animations: [],
		captionWords: [],
		params: { ...clip.params },
	};
}

describe("listNativeExportOmissions", () => {
	test("a custody-backed timeline with brightness has nothing left out on iOS", () => {
		const edl = buildFixtureEdl();
		const omissions = listNativeExportOmissions({ edl, platform: "ios" });
		expect(omissions).toEqual([]);
	});

	test("Android still leaves brightness out, because that mapper does not apply it yet", () => {
		const edl = buildFixtureEdl();
		const omissions = listNativeExportOmissions({ edl, platform: "android" });
		expect(omissions.some((item) => item.message.includes('Effect "brightness"'))).toBe(true);
	});

	test("names a motion template, a blob asset, a filter, a mask and reverse", () => {
		const edl = buildFixtureEdl();
		const main = edl.tracks[0];
		if (!main) throw new Error("fixture has no main track");
		const base = cloneClip({ edl });

		edl.assets.push({
			assetId: "blob-broll",
			kind: "video",
			name: "pexels.mp4",
			sourceUri: null,
			proxyUri: null,
			codec: null,
			width: 1920,
			height: 1080,
			durationTicks: null,
			rotationDegrees: 0,
			hasAudio: false,
		});
		main.clips.push({
			...base,
			clipId: "blob-clip",
			name: "Pexels b-roll",
			assetId: "blob-broll",
		});

		const overlay = edl.tracks.find((track) => track.kind === "overlay");
		if (!overlay) throw new Error("fixture has no overlay track");
		overlay.clips.push({
			...base,
			clipId: "template-clip",
			kind: "graphic",
			assetId: null,
			name: "Text Scramble",
			params: { definitionId: "html:html-text-scramble" },
		});
		overlay.clips.push({
			...base,
			clipId: "shape-clip",
			kind: "graphic",
			assetId: null,
			name: "Square",
			params: { definitionId: "rectangle" },
		});
		overlay.clips.push({
			...base,
			clipId: "sticker-clip",
			kind: "sticker",
			assetId: null,
			name: "Star sticker",
			params: { stickerId: "emoji:star" },
		});

		const graded = main.clips[0];
		if (!graded) throw new Error("fixture main clip missing");
		graded.effects.push({
			effectId: "fx-filter",
			type: "filter",
			enabled: true,
			params: { preset: "warm" },
		});
		graded.masks.push({ maskId: "m1", type: "ellipse", params: {} });
		graded.params = { ...graded.params, reversed: true };

		const included = listNativeExportOmissions({ edl, platform: "ios" }).map((item) => item.message);
		expect(included.some((message) => message.includes("Text Scramble"))).toBe(false);
		expect(included.some((message) => message.includes("Square"))).toBe(false);
		expect(included.some((message) => message.includes("Star sticker"))).toBe(false);
		const messages = listNativeExportOmissions({
			edl,
			platform: "ios",
			uncapturedClipIds: new Set(["template-clip", "shape-clip", "sticker-clip"]),
		}).map((item) => item.message);
		expect(messages.some((message) => message.includes('Motion template "Text Scramble"'))).toBe(true);
		expect(messages.some((message) => message.includes('Shape "Square"'))).toBe(true);
		expect(messages.some((message) => message.includes('Sticker "Star sticker"'))).toBe(true);
		expect(messages.some((message) => message.includes('"Pexels b-roll"') && message.includes("sandbox"))).toBe(
			true,
		);
		expect(messages.some((message) => message.startsWith("Filter on"))).toBe(true);
		expect(messages.some((message) => message.startsWith("Mask on"))).toBe(true);
		expect(messages.some((message) => message.startsWith("Reverse on"))).toBe(true);
		// Brightness on the second fixture clip is actually rendered on iOS.
		expect(messages.some((message) => message.includes("brightness"))).toBe(false);
	});

	test("a captured template is not listed on either platform", () => {
		const edl = buildFixtureEdl();
		const overlay = edl.tracks.find((track) => track.kind === "overlay");
		if (!overlay) throw new Error("fixture has no overlay track");
		overlay.clips.push({
			...cloneClip({ edl }),
			clipId: "titled",
			kind: "graphic",
			assetId: null,
			name: "Title card",
			params: { content: "Hello", definitionId: "html:html-text-scramble" },
		});
		const ios = listNativeExportOmissions({ edl, platform: "ios" }).map((item) => item.message);
		const android = listNativeExportOmissions({ edl, platform: "android" }).map((item) => item.message);
		expect(ios.some((message) => message.includes("Title card"))).toBe(false);
		expect(android.some((message) => message.includes("Title card"))).toBe(false);
		const missed = listNativeExportOmissions({
			edl,
			platform: "android",
			uncapturedClipIds: new Set(["titled"]),
		}).map((item) => item.message);
		expect(missed.some((message) => message.includes('Motion template "Title card"'))).toBe(true);
	});
});
