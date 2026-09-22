/**
 * Pure decision logic for the clip-body gesture machine (long-press hold vs.
 * move-drag vs. strip pan). Extracted from components/timeline/timeline-clip.tsx
 * so the rules can be unit-tested without a DOM: the bug these functions guard
 * against was invisible to every synthetic-pointer test we had.
 *
 * The bug (founder's iPhone, 2026-09-22 — "when I cut I can't drag the
 * videos"): pointerdown armed BOTH a move-drag session and a long-press timer.
 * When the timer fired it tore down the move session before asking whether the
 * hold would even be honoured. A finger that rests on the glass longer than
 * the timer — routine on a touchscreen, never on a mouse — lost its drag. CDP
 * and every other synthetic driver fire pointerdown -> pointermove within
 * milliseconds, so the timer never elapsed and the suite stayed green through
 * a bug that reproduced on the first real tap.
 *
 * Rule: a long-press only claims the gesture when the view actually lifts the
 * clip into reorder mode. A declined hold is a no-op and the drag survives.
 */

/** Travel (px, any direction) that promotes a press into a drag and cancels a
 *  pending hold. Taps below this stay selection-only. */
export const MOVE_THRESHOLD_PX = 6;

/** Hold duration before a clip lifts into reorder mode.
 *
 *  550ms, not 450: iOS's own long-press recognizer fires at 500ms. Sitting
 *  under it put our timer in a race with WebKit's for the same gesture; above
 *  it, the browser has already decided before we do. */
export const LONG_PRESS_MS = 550;

/**
 * Whether pointer travel from the press origin should cancel a pending hold
 * and/or promote the gesture to a drag.
 *
 * Measures true distance, not |dx|. The X-only check this replaced left a hold
 * armed through a diagonal slide off the clip.
 */
export function exceedsMoveThreshold({
	startClientX,
	startClientY,
	clientX,
	clientY,
	thresholdPx = MOVE_THRESHOLD_PX,
}: {
	startClientX: number;
	startClientY: number;
	clientX: number;
	clientY: number;
	thresholdPx?: number;
}): boolean {
	return Math.hypot(clientX - startClientX, clientY - startClientY) >= thresholdPx;
}

/**
 * What a fired long-press timer should do to the in-flight gesture sessions.
 *
 * `lifted` is the view's answer — it declines holds it cannot honour (a
 * non-main track, or a main track with fewer than 2 clips, since there is
 * nothing to reorder against). Only an honoured hold may discard move/pan
 * state; a declined one must leave the drag intact.
 */
export function resolveLongPressOutcome({ lifted }: { lifted: boolean }): {
	clearMoveSession: boolean;
	clearPanSession: boolean;
} {
	return { clearMoveSession: lifted, clearPanSession: lifted };
}

/**
 * Whether the view will honour a hold on this track — the predicate behind
 * `lifted` above, mirrored here so it is testable independently of React.
 */
export function canLiftForReorder({
	trackKind,
	clipCount,
	reorderSupported,
}: {
	trackKind: string;
	clipCount: number;
	reorderSupported: boolean;
}): boolean {
	if (!reorderSupported) return false;
	if (trackKind !== "main") return false;
	return clipCount >= 2;
}
