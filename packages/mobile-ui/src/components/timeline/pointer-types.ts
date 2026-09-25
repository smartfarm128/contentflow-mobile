export type DragMode = "move" | "trim-left" | "trim-right" | "slip";

export interface SnapHoldState {
	frame: number;
	edge: "start" | "end";
	type: "clip-edge" | "playhead" | "marker" | "bound";
}

export interface ActiveDragState {
	mode: DragMode;
	elementId: string;
	sourceTrackId: string;
	targetTrackId: string;
	baseStartFrame: number;
	baseDurationFrames: number;
	baseSrcInFrame: number;
	startClientX: number;
	startClientY: number;
	deltaFrames: number;
	snapAtFrame: number | null;
	/** Visual ripple offset in frames for subsequent clips on the active track */
	rippleDeltaFrames: number;
	/** Indicates whether a new track will be created upon drop */
	isNewTrackTarget: boolean;
	newTrackPosition?: "above" | "below";
	newTrackKind?: "video" | "audio";
}

export interface TrackLaneRect {
	id: string;
	kind: string;
	top: number;
	bottom: number;
	height: number;
}
