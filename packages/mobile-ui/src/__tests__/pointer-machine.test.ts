import { describe, expect, test } from "bun:test";
import {
	resolveTrackFromY,
	applyHysteresisSnap,
	SNAP_THRESHOLD_PX,
	STICKY_RELEASE,
} from "../components/timeline/use-timeline-pointer";
import type { TrackLaneRect } from "../components/timeline/pointer-types";

describe("use-timeline-pointer math functions", () => {
	const trackLanes: TrackLaneRect[] = [
		{ id: "overlay-1", kind: "video", top: 100, bottom: 150, height: 50 },
		{ id: "main-track", kind: "video", top: 150, bottom: 200, height: 50 },
		{ id: "audio-1", kind: "audio", top: 200, bottom: 250, height: 50 },
	];

	test("resolves correct target track based on clientY", () => {
		// Y = 125 falls inside overlay-1
		const resOverlay = resolveTrackFromY({ clientY: 125, trackLanes });
		expect(resOverlay.targetTrackId).toBe("overlay-1");
		expect(resOverlay.isNewTrack).toBe(false);

		// Y = 175 falls inside main-track
		const resMain = resolveTrackFromY({ clientY: 175, trackLanes });
		expect(resMain.targetTrackId).toBe("main-track");
		expect(resMain.isNewTrack).toBe(false);

		// Y = 225 falls inside audio-1
		const resAudio = resolveTrackFromY({ clientY: 225, trackLanes });
		expect(resAudio.targetTrackId).toBe("audio-1");
		expect(resAudio.isNewTrack).toBe(false);
	});

	test("detects dragging above top track to create a new track above", () => {
		const resAbove = resolveTrackFromY({ clientY: 50, trackLanes });
		expect(resAbove.isNewTrack).toBe(true);
		expect(resAbove.newTrackPosition).toBe("above");
	});

	test("detects dragging below bottom track to create a new track below", () => {
		const resBelow = resolveTrackFromY({ clientY: 300, trackLanes });
		expect(resBelow.isNewTrack).toBe(true);
		expect(resBelow.newTrackPosition).toBe("below");
	});

	test("applyHysteresisSnap snaps to nearest point within threshold", () => {
		// pixelsPerFrame = 2 -> threshold in frames = 8 / 2 = 4 frames
		const snapPoints = [0, 60, 120];

		// Probe at frame 58 (delta = 58 - 0 = 58)
		// Distance to 60 is 2 frames (within 4 frames)
		const snap1 = applyHysteresisSnap({
			rawDeltaFrames: 58,
			baseFrame: 0,
			edge: "start",
			pixelsPerFrame: 2,
			snapPoints,
			currentHold: null,
		});

		expect(snap1.snapAtFrame).toBe(60);
		expect(snap1.deltaFrames).toBe(60);
		expect(snap1.nextHold).not.toBeNull();
		expect(snap1.nextHold?.frame).toBe(60);
	});

	test("applyHysteresisSnap maintains hold within 1.5x sticky release radius", () => {
		const snapPoints = [0, 60, 120];
		const currentHold = {
			frame: 60,
			edge: "start" as const,
			type: "clip-edge" as const,
		};

		// Threshold is 4 frames. 1.5x release radius is 6 frames.
		// Moving to rawDeltaFrames = 65 (distance 5 frames from 60):
		// Since 5 <= 6, hold remains active!
		const snapHeld = applyHysteresisSnap({
			rawDeltaFrames: 65,
			baseFrame: 0,
			edge: "start",
			pixelsPerFrame: 2,
			snapPoints,
			currentHold,
		});

		expect(snapHeld.snapAtFrame).toBe(60);
		expect(snapHeld.deltaFrames).toBe(60); // Still snapped to 60!

		// Moving to rawDeltaFrames = 68 (distance 8 frames from 60):
		// Exceeds 6 frames -> releases hold!
		const snapReleased = applyHysteresisSnap({
			rawDeltaFrames: 68,
			baseFrame: 0,
			edge: "start",
			pixelsPerFrame: 2,
			snapPoints,
			currentHold,
		});

		expect(snapReleased.snapAtFrame).toBeNull();
		expect(snapReleased.deltaFrames).toBe(68); // Free movement restored
	});
});
