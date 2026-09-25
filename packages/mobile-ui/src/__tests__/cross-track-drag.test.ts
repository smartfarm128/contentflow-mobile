import { describe, expect, test } from "bun:test";
import { resolveTrackFromY } from "../components/timeline/use-timeline-pointer";
import type { TrackLaneRect } from "../components/timeline/pointer-types";

/**
 * Regression guard for vertical (cross-track) dragging.
 *
 * Founder's iPhone, 2026-09-25: "i have not been able to move it up and down
 * to create a new timeline". The pointer machine and its lane hit-test had
 * been written and unit-tested in isolation, but were never wired into
 * `timeline-clip.tsx` — that file's move gesture read `clientX` only and
 * discarded `clientY`, so a clip could never leave its own row no matter
 * how far the finger travelled vertically. The capability existed in code
 * and was reported complete without checking the integration.
 *
 * These tests pin the geometry rules the wired gesture depends on. The
 * end-to-end path (finger -> lane highlight -> MoveElementCommand) is
 * verified separately against a live timeline, where a main-track clip
 * dragged onto an overlay lane moved: main 1 -> 0, overlay 1 -> 2.
 */
describe("vertical drag lane resolution", () => {
	const lanes: TrackLaneRect[] = [
		{ id: "main-track", kind: "main", top: 513, bottom: 562, height: 49 },
		{ id: "overlay-1", kind: "overlay", top: 562, bottom: 611, height: 49 },
		{ id: "audio-1", kind: "audio", top: 611, bottom: 660, height: 49 },
	];

	test("a finger resting inside a lane resolves to that lane", () => {
		expect(resolveTrackFromY({ clientY: 538, trackLanes: lanes }).targetTrackId).toBe(
			"main-track",
		);
		expect(resolveTrackFromY({ clientY: 587, trackLanes: lanes }).targetTrackId).toBe(
			"overlay-1",
		);
		expect(resolveTrackFromY({ clientY: 635, trackLanes: lanes }).targetTrackId).toBe(
			"audio-1",
		);
	});

	test("dragging from main down to the overlay lane changes the resolved target", () => {
		// This is the exact gesture that did nothing before the fix: the Y
		// travel was computed but thrown away, so source and target always
		// matched and the move stayed on one row.
		const start = resolveTrackFromY({ clientY: 538, trackLanes: lanes });
		const end = resolveTrackFromY({ clientY: 587, trackLanes: lanes });
		expect(start.targetTrackId).not.toBe(end.targetTrackId);
		expect(end.targetTrackId).toBe("overlay-1");
	});

	test("lane boundaries are inclusive so a finger on the seam still resolves", () => {
		// 562 is simultaneously main's bottom and overlay's top. It must
		// resolve to exactly one lane, never to null (which would drop the
		// cross-track intent mid-drag).
		const seam = resolveTrackFromY({ clientY: 562, trackLanes: lanes });
		expect(seam.targetTrackId).toBe("main-track");
	});

	test("dragging above the top lane targets a new track above", () => {
		const above = resolveTrackFromY({ clientY: 400, trackLanes: lanes });
		expect(above.isNewTrack).toBe(true);
		expect(above.newTrackPosition).toBe("above");
	});

	test("dragging below the bottom lane targets a new track below", () => {
		const below = resolveTrackFromY({ clientY: 900, trackLanes: lanes });
		expect(below.isNewTrack).toBe(true);
		expect(below.newTrackPosition).toBe("below");
	});
});
