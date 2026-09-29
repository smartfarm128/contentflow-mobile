import { describe, expect, test } from "bun:test";
import {
	predecessorRightEdge,
	remainingSourceFrames,
	sourceFrameAt,
	sourceFramesToTimelineFrames,
	sourceWindowForTimelineRange,
	timelineFramesToSourceFrames,
} from "../source-limits";
import type { SceneTracks } from "../types";
import { frameTicksForFps } from "../../wasm/media-time";

const FPS_30 = { numerator: 30, denominator: 1 };

describe("source-limits conversions", () => {
	test("converts timeline frames to source frames factoring speed", () => {
		expect(timelineFramesToSourceFrames({ item: { playbackRate: 1 }, frames: 30 })).toBe(30);
		expect(timelineFramesToSourceFrames({ item: { playbackRate: 2 }, frames: 30 })).toBe(60);
		expect(timelineFramesToSourceFrames({ item: { playbackRate: 0.5 }, frames: 30 })).toBe(15);
	});

	test("converts source frames to timeline frames factoring speed", () => {
		expect(sourceFramesToTimelineFrames({ item: { playbackRate: 1 }, frames: 30 })).toBe(30);
		expect(sourceFramesToTimelineFrames({ item: { playbackRate: 2 }, frames: 60 })).toBe(30);
		expect(sourceFramesToTimelineFrames({ item: { playbackRate: 0.5 }, frames: 15 })).toBe(30);
	});

	test("calculates sourceFrameAt including in-point offset", () => {
		expect(sourceFrameAt({ item: { srcInFrame: 10, playbackRate: 1 }, localFrame: 20 })).toBe(30);
		expect(sourceFrameAt({ item: { srcInFrame: 10, playbackRate: 2 }, localFrame: 20 })).toBe(50);
	});

	test("sourceWindowForTimelineRange maps local timeline bounds to source frames", () => {
		const window = sourceWindowForTimelineRange({ item: { srcInFrame: 30, playbackRate: 1 }, localStartFrame: 0, durationInFrames: 60 });
		expect(window.startFrame).toBe(30);
		expect(window.endFrame).toBe(90);
	});

	test("remainingSourceFrames calculates remaining headroom", () => {
		// Total 300 frames, srcInFrame at 100 -> 200 source frames left -> 200 timeline frames at 1x
		expect(remainingSourceFrames({ item: { playbackRate: 1 }, srcInFrame: 100, sourceTotalFrames: 300 })).toBe(200);
		// At 2x speed -> 200 source frames left -> 100 timeline frames
		expect(remainingSourceFrames({ item: { playbackRate: 2 }, srcInFrame: 100, sourceTotalFrames: 300 })).toBe(100);
		// At 0.5x speed -> 200 source frames left -> 400 timeline frames
		expect(remainingSourceFrames({ item: { playbackRate: 0.5 }, srcInFrame: 100, sourceTotalFrames: 300 })).toBe(400);
	});
});

describe("predecessorRightEdge collision clamping", () => {
	test("finds nearest preceding clip right edge", () => {
		const clip1Start = frameTicksForFps({ frame: 0, fps: FPS_30 });
		const clip1Dur = frameTicksForFps({ frame: 90, fps: FPS_30 }); // ends at frame 90

		const clip2Start = frameTicksForFps({ frame: 150, fps: FPS_30 }); // starts at frame 150
		const clip2Dur = frameTicksForFps({ frame: 60, fps: FPS_30 });

		const mockTracks: SceneTracks = {
			overlay: [
				{
					id: "track-1",
					name: "Track 1",
					type: "video",
					muted: false,
					hidden: false,
					elements: [
						{
							id: "clip-1",
							name: "Clip 1",
							type: "video",
							mediaId: "m1",
							startTime: clip1Start,
							duration: clip1Dur,
							trimStart: frameTicksForFps({ frame: 0, fps: FPS_30 }),
							trimEnd: frameTicksForFps({ frame: 0, fps: FPS_30 }),
							params: {},
						},
						{
							id: "clip-2",
							name: "Clip 2",
							type: "video",
							mediaId: "m2",
							startTime: clip2Start,
							duration: clip2Dur,
							trimStart: frameTicksForFps({ frame: 0, fps: FPS_30 }),
							trimEnd: frameTicksForFps({ frame: 0, fps: FPS_30 }),
							params: {},
						},
					],
				},
			],
			main: {
				id: "main-track",
				name: "Main",
				type: "video",
				muted: false,
				hidden: false,
				elements: [],
			},
			audio: [],
		};

		// For clip-2 starting at frame 150, its predecessor clip-1 ends at frame 90.
		const pred = predecessorRightEdge({
			tracks: mockTracks,
			elementId: "clip-2",
			trackId: "track-1",
			baseStartFrame: 150,
			fps: FPS_30,
		});

		expect(pred).toBe(90);
	});
});
