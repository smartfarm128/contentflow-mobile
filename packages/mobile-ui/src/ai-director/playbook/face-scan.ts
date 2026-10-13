/**
 * On-device face boxes for one video frame. iOS uses Vision, Android
 * uses ML Kit. A browser, or a native build that predates the method,
 * comes back unavailable so the caller can warn instead of guessing.
 */
import type { EditorCore } from "@kneecap/editor-core";
import { mediaTimeToSeconds } from "@kneecap/editor-core/wasm";
import { getNativeBridge, type FaceBox } from "@kneecap/native-bridge";
import { timelineVideoAt } from "../frame-capture";
import {
	placeClearOfFaces,
	positionYForBand,
	type TextBand,
} from "./face-clearance";

export interface FaceClearance {
	/** Null when the position should stay where the editor put it. */
	band: TextBand | null;
	positionY: number | null;
	note: string;
}

function clampBox(box: FaceBox): FaceBox {
	const x = Math.min(1, Math.max(0, box.x));
	const y = Math.min(1, Math.max(0, box.y));
	return {
		x,
		y,
		width: Math.min(1 - x, Math.max(0, box.width)),
		height: Math.min(1 - y, Math.max(0, box.height)),
	};
}

async function scanOne({
	path,
	timeSeconds,
}: {
	path: string;
	timeSeconds: number;
}): Promise<{ available: boolean; faces: FaceBox[]; warning: string | null }> {
	try {
		const bridge = await getNativeBridge();
		const scan = await bridge.detectFaces({ path, timeSeconds });
		if (!scan.available) {
			return {
				available: false,
				faces: [],
				warning: scan.warning ?? "Face detection is not available on this device, so I could not check faces.",
			};
		}
		return { available: true, faces: scan.faces.map(clampBox), warning: null };
	} catch {
		return {
			available: false,
			faces: [],
			warning: "Face detection is not available on this device, so I could not check faces.",
		};
	}
}

/** Sample a few times and keep text off every face that showed up. */
export async function clearanceForTimes({
	editor,
	timeSeconds,
	preferred,
}: {
	editor: EditorCore;
	timeSeconds: number[];
	preferred: TextBand;
}): Promise<FaceClearance> {
	const times = timeSeconds.filter((time) => Number.isFinite(time)).slice(0, 3);
	const sample = times.length > 0 ? times : [0];
	const faces: FaceBox[] = [];
	let sawVideo = false;
	for (const time of sample) {
		const located = timelineVideoAt({ editor, timeSeconds: time });
		if (!located) continue;
		sawVideo = true;
		const scan = await scanOne({ path: located.path, timeSeconds: located.sourceSeconds });
		if (!scan.available) {
			return { band: null, positionY: null, note: scan.warning ?? "Face detection is unavailable." };
		}
		faces.push(...scan.faces);
	}
	if (!sawVideo) {
		return {
			band: null,
			positionY: null,
			note: "No video frame to scan, so I could not check faces.",
		};
	}
	if (faces.length === 0) {
		return { band: null, positionY: null, note: "No face in the scanned frame." };
	}
	const placed = placeClearOfFaces({ preferred, faces });
	const canvasHeight = editor.project.getActive().settings.canvasSize.height;
	const positionY = positionYForBand({ band: placed.band, canvasHeight });
	if (placed.warning) {
		return { band: placed.band, positionY, note: placed.warning };
	}
	if (!placed.moved) {
		return { band: placed.band, positionY: null, note: "A face is in frame. The text band does not cover it." };
	}
	return {
		band: placed.band,
		positionY,
		note: `Moved text to the ${placed.band} band so it does not cover a face.`,
	};
}

export function captionSampleTimes({
	editor,
}: {
	editor: EditorCore;
}): number[] {
	const tracks = editor.scenes.getActiveScene().tracks.overlay;
	const starts: number[] = [];
	for (const track of tracks) {
		if (track.type !== "caption") continue;
		for (const element of track.elements) {
			starts.push(mediaTimeToSeconds({ time: element.startTime }));
		}
	}
	if (starts.length === 0) return [];
	const first = starts[0] ?? 0;
	const middle = starts[Math.floor(starts.length / 2)] ?? first;
	const last = starts[starts.length - 1] ?? first;
	return [...new Set([first, middle, last])];
}
