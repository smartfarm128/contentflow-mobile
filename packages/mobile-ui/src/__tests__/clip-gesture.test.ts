import { describe, expect, test } from "bun:test";
import {
	canLiftForReorder,
	exceedsMoveThreshold,
	LONG_PRESS_MS,
	MOVE_THRESHOLD_PX,
	resolveLongPressOutcome,
} from "../timeline/clip-gesture";

/**
 * Regression guard for the drag-after-rest bug (founder's iPhone, 2026-09-22).
 * See src/timeline/clip-gesture.ts for the full history — the short version is
 * that a fired long-press timer used to destroy the move session before asking
 * whether the hold was honoured, so resting a finger before sliding killed the
 * drag. Synthetic pointer events never rest, which is why this shipped green.
 */
describe("long-press vs. move-drag arbitration", () => {
	test("a DECLINED hold leaves the move session intact — the actual bug", () => {
		const outcome = resolveLongPressOutcome({ lifted: false });
		expect(outcome.clearMoveSession).toBe(false);
		expect(outcome.clearPanSession).toBe(false);
	});

	test("an HONOURED hold takes the gesture and clears move/pan", () => {
		const outcome = resolveLongPressOutcome({ lifted: true });
		expect(outcome.clearMoveSession).toBe(true);
		expect(outcome.clearPanSession).toBe(true);
	});

	test("the single-clip main track that reproduced it declines the hold", () => {
		// Before a split there is one clip: nothing to reorder against, so the
		// hold is declined -- and the drag must still work.
		expect(
			canLiftForReorder({ trackKind: "main", clipCount: 1, reorderSupported: true }),
		).toBe(false);
		expect(
			resolveLongPressOutcome({
				lifted: canLiftForReorder({
					trackKind: "main",
					clipCount: 1,
					reorderSupported: true,
				}),
			}).clearMoveSession,
		).toBe(false);
	});

	test("after a cut (2+ clips) the main track does lift", () => {
		expect(
			canLiftForReorder({ trackKind: "main", clipCount: 2, reorderSupported: true }),
		).toBe(true);
	});

	test("overlay/text/audio rows never lift, so their drags always survive", () => {
		for (const trackKind of ["overlay", "text", "audio", "caption", "sticker"]) {
			expect(canLiftForReorder({ trackKind, clipCount: 5, reorderSupported: true })).toBe(
				false,
			);
		}
	});

	test("no reorder handler wired means no hold at all", () => {
		expect(
			canLiftForReorder({ trackKind: "main", clipCount: 9, reorderSupported: false }),
		).toBe(false);
	});
});

describe("move threshold measures travel in any direction", () => {
	test("a still finger does not cross it", () => {
		expect(
			exceedsMoveThreshold({
				startClientX: 100,
				startClientY: 100,
				clientX: 102,
				clientY: 101,
			}),
		).toBe(false);
	});

	test("horizontal travel crosses it", () => {
		expect(
			exceedsMoveThreshold({
				startClientX: 100,
				startClientY: 100,
				clientX: 100 + MOVE_THRESHOLD_PX,
				clientY: 100,
			}),
		).toBe(true);
	});

	test("a diagonal slide crosses it — the X-only check missed this", () => {
		// dx=5, dy=5 => distance 7.07. The old |dx| >= 6 test said "no travel"
		// and left the hold armed through a finger leaving the clip.
		expect(
			exceedsMoveThreshold({
				startClientX: 100,
				startClientY: 100,
				clientX: 105,
				clientY: 105,
			}),
		).toBe(true);
	});

	test("purely vertical travel crosses it", () => {
		expect(
			exceedsMoveThreshold({
				startClientX: 100,
				startClientY: 100,
				clientX: 100,
				clientY: 110,
			}),
		).toBe(true);
	});
});

describe("hold timing", () => {
	test("sits above iOS's own 500ms long-press recognizer", () => {
		expect(LONG_PRESS_MS).toBeGreaterThan(500);
	});
});
