import { useCallback, useRef, useState, type SetStateAction } from "react";
import type {
	ActiveDragState,
	DragMode,
	SnapHoldState,
	TrackLaneRect,
} from "./pointer-types";

export const SNAP_THRESHOLD_PX = 8;
export const STICKY_RELEASE = 1.5;

export function resolveTrackFromY({
	clientY,
	trackLanes,
}: {
	clientY: number;
	trackLanes: TrackLaneRect[];
}): {
	targetTrackId: string;
	isNewTrack: boolean;
	newTrackPosition?: "above" | "below";
} {
	if (!trackLanes.length) {
		return { targetTrackId: "main", isNewTrack: false };
	}

	// If above topmost track, target new track above
	const first = trackLanes[0];
	if (clientY < first.top) {
		return {
			targetTrackId: first.id,
			isNewTrack: true,
			newTrackPosition: "above",
		};
	}

	// If below bottommost track, target new track below
	const last = trackLanes[trackLanes.length - 1];
	if (clientY > last.bottom) {
		return {
			targetTrackId: last.id,
			isNewTrack: true,
			newTrackPosition: "below",
		};
	}

	// Find intersecting track
	for (const lane of trackLanes) {
		if (clientY >= lane.top && clientY <= lane.bottom) {
			return { targetTrackId: lane.id, isNewTrack: false };
		}
	}

	return { targetTrackId: first.id, isNewTrack: false };
}

export function applyHysteresisSnap({
	rawDeltaFrames,
	baseFrame,
	edge,
	pixelsPerFrame,
	snapPoints,
	currentHold,
}: {
	rawDeltaFrames: number;
	baseFrame: number;
	edge: "start" | "end";
	pixelsPerFrame: number;
	snapPoints: number[];
	currentHold: SnapHoldState | null;
}): {
	deltaFrames: number;
	snapAtFrame: number | null;
	nextHold: SnapHoldState | null;
} {
	const thresholdFrames = SNAP_THRESHOLD_PX / Math.max(0.001, pixelsPerFrame);
	const probeFrame = baseFrame + rawDeltaFrames;

	// 1. Maintain existing hold if within release radius (1.5x)
	if (currentHold) {
		const dist = Math.abs(probeFrame - currentHold.frame);
		if (dist <= thresholdFrames * STICKY_RELEASE) {
			return {
				deltaFrames: currentHold.frame - baseFrame,
				snapAtFrame: currentHold.frame,
				nextHold: currentHold,
			};
		}
	}

	// 2. Search nearest snap point
	let closestPoint: number | null = null;
	let minDist = Infinity;
	for (const pt of snapPoints) {
		const d = Math.abs(probeFrame - pt);
		if (d <= thresholdFrames && d < minDist) {
			minDist = d;
			closestPoint = pt;
		}
	}

	if (closestPoint !== null) {
		const nextHold: SnapHoldState = {
			frame: closestPoint,
			edge,
			type: "clip-edge",
		};
		return {
			deltaFrames: closestPoint - baseFrame,
			snapAtFrame: closestPoint,
			nextHold,
		};
	}

	return { deltaFrames: rawDeltaFrames, snapAtFrame: null, nextHold: null };
}

function usePointerState<T>(initial: T) {
	const [value, publishValue] = useState<T>(initial);
	const ref = useRef<T>(value);
	const setValue = useCallback(
		(next: SetStateAction<T>, publish = true) => {
			const resolved =
				typeof next === "function"
					? (next as (current: T) => T)(ref.current)
					: next;
			ref.current = resolved;
			if (publish) publishValue(resolved);
		},
		[publishValue],
	);
	return [value, setValue, ref] as const;
}

export interface UseTimelinePointerDeps {
	fps: number;
	pixelsPerFrame: number;
	snapPoints: number[];
	trackLanes: TrackLaneRect[];
	onCommitMove: (params: {
		elementId: string;
		sourceTrackId: string;
		targetTrackId: string;
		newStartFrame: number;
		isNewTrack: boolean;
		newTrackPosition?: "above" | "below";
	}) => void;
	onCommitTrim: (params: {
		elementId: string;
		trackId: string;
		edge: "start" | "end";
		deltaFrames: number;
	}) => void;
	onScrubTrim?: (params: {
		elementId: string;
		trackId: string;
		edge: "start" | "end";
		deltaFrames: number;
		candidateBoundaryFrame: number;
	}) => void;
}

export function useTimelinePointer(deps: UseTimelinePointerDeps) {
	const {
		pixelsPerFrame,
		snapPoints,
		trackLanes,
		onCommitMove,
		onCommitTrim,
		onScrubTrim,
	} = deps;

	const [drag, setDrag, dragRef] = usePointerState<ActiveDragState | null>(null);
	const snapHoldRef = useRef<SnapHoldState | null>(null);
	const pendingMoveRef = useRef<{ clientX: number; clientY: number } | null>(null);
	const rafIdRef = useRef<number>(0);

	const applySnap = useCallback(
		(rawDeltaFrames: number, baseFrame: number, edge: "start" | "end") => {
			const res = applyHysteresisSnap({
				rawDeltaFrames,
				baseFrame,
				edge,
				pixelsPerFrame,
				snapPoints,
				currentHold: snapHoldRef.current,
			});
			snapHoldRef.current = res.nextHold;
			return {
				deltaFrames: res.deltaFrames,
				snapAtFrame: res.snapAtFrame,
			};
		},
		[pixelsPerFrame, snapPoints],
	);

	const resolveTrack = useCallback(
		(clientY: number) => resolveTrackFromY({ clientY, trackLanes }),
		[trackLanes],
	);

	const flushPointerMove = useCallback(
		(publish: boolean) => {
			rafIdRef.current = 0;
			const pending = pendingMoveRef.current;
			const currentDrag = dragRef.current;
			if (!pending || !currentDrag) return;

			const dx = pending.clientX - currentDrag.startClientX;
			const rawDeltaFrames = Math.round(dx / Math.max(0.001, pixelsPerFrame));

			if (currentDrag.mode === "move") {
				const { targetTrackId, isNewTrack, newTrackPosition } = resolveTrack(
					pending.clientY,
				);
				const snapped = applySnap(
					rawDeltaFrames,
					currentDrag.baseStartFrame,
					"start",
				);

				const nextStartFrame = Math.max(
					0,
					currentDrag.baseStartFrame + snapped.deltaFrames,
				);

				setDrag(
					{
						...currentDrag,
						targetTrackId,
						isNewTrackTarget: isNewTrack,
						newTrackPosition,
						deltaFrames: nextStartFrame - currentDrag.baseStartFrame,
						snapAtFrame: snapped.snapAtFrame,
					},
					publish,
				);
			} else if (
				currentDrag.mode === "trim-left" ||
				currentDrag.mode === "trim-right"
			) {
				const edge = currentDrag.mode === "trim-left" ? "start" : "end";
				const baseAnchor =
					edge === "start"
						? currentDrag.baseStartFrame
						: currentDrag.baseStartFrame + currentDrag.baseDurationFrames;

				const snapped = applySnap(rawDeltaFrames, baseAnchor, edge);

				// Clamping: clip cannot shrink below 6 frames (~0.2s)
				const minDuration = 6;
				let clampedDelta = snapped.deltaFrames;
				if (edge === "start") {
					// Cannot extend left beyond frame 0
					if (currentDrag.baseStartFrame + clampedDelta < 0) {
						clampedDelta = -currentDrag.baseStartFrame;
					}
					// Cannot shrink past min duration
					if (currentDrag.baseDurationFrames - clampedDelta < minDuration) {
						clampedDelta = currentDrag.baseDurationFrames - minDuration;
					}
				} else {
					// Cannot shrink past min duration
					if (currentDrag.baseDurationFrames + clampedDelta < minDuration) {
						clampedDelta = minDuration - currentDrag.baseDurationFrames;
					}
				}

				const rippleDeltaFrames =
					edge === "start" ? -clampedDelta : clampedDelta;

				setDrag(
					{
						...currentDrag,
						deltaFrames: clampedDelta,
						snapAtFrame: snapped.snapAtFrame,
						rippleDeltaFrames,
					},
					publish,
				);

				onScrubTrim?.({
					elementId: currentDrag.elementId,
					trackId: currentDrag.sourceTrackId,
					edge,
					deltaFrames: clampedDelta,
					candidateBoundaryFrame: baseAnchor + clampedDelta,
				});
			}
		},
		[applySnap, dragRef, onScrubTrim, pixelsPerFrame, resolveTrackFromY, setDrag],
	);

	const onPointerMove = useCallback(
		(event: React.PointerEvent) => {
			if (!dragRef.current) return;
			pendingMoveRef.current = {
				clientX: event.clientX,
				clientY: event.clientY,
			};
			if (rafIdRef.current) return;
			rafIdRef.current = requestAnimationFrame(() => flushPointerMove(true));
		},
		[dragRef, flushPointerMove],
	);

	const onPointerUp = useCallback(
		(event: React.PointerEvent) => {
			if (rafIdRef.current) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = 0;
			}
			flushPointerMove(false);
			const currentDrag = dragRef.current;
			if (!currentDrag) return;

			setDrag(null);
			snapHoldRef.current = null;
			pendingMoveRef.current = null;

			if (currentDrag.mode === "move") {
				if (
					currentDrag.deltaFrames === 0 &&
					currentDrag.targetTrackId === currentDrag.sourceTrackId &&
					!currentDrag.isNewTrackTarget
				) {
					return;
				}
				onCommitMove({
					elementId: currentDrag.elementId,
					sourceTrackId: currentDrag.sourceTrackId,
					targetTrackId: currentDrag.targetTrackId,
					newStartFrame: Math.max(
						0,
						currentDrag.baseStartFrame + currentDrag.deltaFrames,
					),
					isNewTrack: currentDrag.isNewTrackTarget,
					newTrackPosition: currentDrag.newTrackPosition,
				});
			} else if (
				currentDrag.mode === "trim-left" ||
				currentDrag.mode === "trim-right"
			) {
				if (currentDrag.deltaFrames === 0) return;
				const edge = currentDrag.mode === "trim-left" ? "start" : "end";
				onCommitTrim({
					elementId: currentDrag.elementId,
					trackId: currentDrag.sourceTrackId,
					edge,
					deltaFrames: currentDrag.deltaFrames,
				});
			}
		},
		[dragRef, flushPointerMove, onCommitMove, onCommitTrim, setDrag],
	);

	const onPointerCancel = useCallback(() => {
		if (rafIdRef.current) {
			cancelAnimationFrame(rafIdRef.current);
			rafIdRef.current = 0;
		}
		setDrag(null);
		snapHoldRef.current = null;
		pendingMoveRef.current = null;
	}, [setDrag]);

	const startDrag = useCallback(
		(params: {
			event: React.PointerEvent;
			elementId: string;
			trackId: string;
			mode: DragMode;
			baseStartFrame: number;
			baseDurationFrames: number;
			baseSrcInFrame?: number;
		}) => {
			const {
				event,
				elementId,
				trackId,
				mode,
				baseStartFrame,
				baseDurationFrames,
				baseSrcInFrame = 0,
			} = params;

			event.stopPropagation();
			try {
				event.currentTarget.setPointerCapture(event.pointerId);
			} catch {}

			snapHoldRef.current = null;
			pendingMoveRef.current = null;

			setDrag({
				mode,
				elementId,
				sourceTrackId: trackId,
				targetTrackId: trackId,
				baseStartFrame,
				baseDurationFrames,
				baseSrcInFrame,
				startClientX: event.clientX,
				startClientY: event.clientY,
				deltaFrames: 0,
				snapAtFrame: null,
				rippleDeltaFrames: 0,
				isNewTrackTarget: false,
			});
		},
		[setDrag],
	);

	return {
		drag,
		dragRef,
		startDrag,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
	};
}
