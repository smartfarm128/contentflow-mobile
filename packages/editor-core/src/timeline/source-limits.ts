/**
 * Source media boundary clamping and predecessor collision math.
 * Ported from OpenChatCut's battle-tested sourceLimit.ts and timelineDragCommit.ts.
 *
 * Provides:
 * 1. sourceWindowForTimelineRange: Maps timeline range to source frames factoring in playbackRate.
 * 2. remainingSourceFrames: Upper bound for right-trimming based on source asset length.
 * 3. predecessorRightEdge: Finds nearest preceding same-track clip so left un-trimming
 *    restores footage cleanly without colliding or bouncing against neighbors.
 */
import type { SceneTracks } from "./types";
import { findTrackInSceneTracks } from "./track-element-update";
import { frameIndexForTicks, type MediaTime } from "../wasm/media-time";
import type { FrameRate } from "opencut-wasm";

export interface SourceTimingItem {
	srcInFrame?: number;
	playbackRate?: number;
}

export interface SourceFrameWindow {
	startFrame: number;
	endFrame: number;
}

/** Convert a timeline-frame delta to its source-media-frame delta. */
export function timelineFramesToSourceFrames(item: SourceTimingItem, frames: number): number {
	return frames * Math.max(0.01, item.playbackRate ?? 1);
}

/** Convert a source-media-frame delta to its timeline-frame delta. */
export function sourceFramesToTimelineFrames(item: SourceTimingItem, frames: number): number {
	return frames / Math.max(0.01, item.playbackRate ?? 1);
}

/** Source-media frame at an item-local timeline frame. */
export function sourceFrameAt(item: SourceTimingItem, localFrame: number): number {
	return Math.max(0, (item.srcInFrame ?? 0) + timelineFramesToSourceFrames(item, localFrame));
}

/** Clamped source-media window corresponding to an item-local timeline range. */
export function sourceWindowForTimelineRange(
	item: SourceTimingItem,
	localStartFrame: number,
	durationInFrames: number,
): SourceFrameWindow {
	const startFrame = sourceFrameAt(item, localStartFrame);
	const endFrame = sourceFrameAt(item, localStartFrame + Math.max(0, durationInFrames));
	return { startFrame, endFrame: Math.max(startFrame, endFrame) };
}

/**
 * How many timeline frames can be played starting from `srcInFrame`.
 * Returns null if duration cannot be bounded (e.g. text/graphics with no file media).
 */
export function remainingSourceFrames(
	item: SourceTimingItem,
	srcInFrame: number,
	sourceTotalFrames?: number,
): number | null {
	if (!sourceTotalFrames || sourceTotalFrames <= 0) return null;
	const remaining = sourceTotalFrames - Math.max(0, srcInFrame);
	return Math.max(1, Math.floor(sourceFramesToTimelineFrames(item, remaining)));
}

/**
 * The right edge (in integer frames) of the nearest same-track clip that ends
 * at or before `baseStartFrame`.
 *
 * Used to clamp left-extend trim ("un-trimming") so the restored footage never
 * overlaps its predecessor on the track.
 */
export function predecessorRightEdge({
	tracks,
	elementId,
	trackId,
	baseStartFrame,
	fps,
}: {
	tracks: SceneTracks;
	elementId: string;
	trackId: string;
	baseStartFrame: number;
	fps: FrameRate;
}): number {
	const track = findTrackInSceneTracks({ tracks, trackId });
	if (!track) return 0;

	let rightEdge = 0;
	for (const element of track.elements) {
		if (element.id === elementId) continue;
		const elEndFrame = frameIndexForTicks({
			ticks: (element.startTime + element.duration) as MediaTime,
			fps,
		});
		if (elEndFrame <= baseStartFrame && elEndFrame > rightEdge) {
			rightEdge = elEndFrame;
		}
	}
	return rightEdge;
}
