/**
 * Per-turn memory for the playbook. A label is allowed only after
 * render_frame or review_composition actually returned a video frame.
 */

let lookedAtVideo = false;

export function resetPlaybookTurn(): void {
	lookedAtVideo = false;
}

export function markFrameSeen(): void {
	lookedAtVideo = true;
}

export function frameWasSeen(): boolean {
	return lookedAtVideo;
}
