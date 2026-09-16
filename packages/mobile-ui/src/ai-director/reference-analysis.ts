/**
 * ContentFlow — reference-video analysis.
 *
 * The founder's core use case, in their words: "this is meant for people who
 * cannot edit but they have a reference or editing style in mind and they want
 * the AI to edit for them."
 *
 * So: the creator picks a reference video off their phone. We do NOT put it on
 * their timeline — it is a specimen, not footage. We sample frames across it,
 * transcribe it on-device, compute deterministic pacing statistics, and hand
 * all three to the Director, which distils a Style Profile.
 *
 * Frames are decoded straight off a <video> element rather than through the
 * compositor: the reference never enters the project, so there is no render
 * tree for it. Everything here is local — the file never leaves the device.
 */
import { getNativeBridge } from "@kneecap/native-bridge";
import type { MediaHandle } from "@kneecap/native-bridge";
import type { CapturedFrame } from "./frame-capture";

const MAX_EDGE_PX = 768;
const JPEG_QUALITY = 0.72;
/** Native timestamps are integer microseconds — never float seconds. */
const MICROS_PER_SECOND = 1_000_000;

export interface ReferenceAnalysis {
	/** Sampled frames, evenly spaced across the whole reference. */
	frames: CapturedFrame[];
	/** Timestamped transcript lines, or an honest note that there was none. */
	transcript: string;
	/** Deterministic speech-rate statistics — not model guesswork. */
	pacing: string;
	durationSeconds: number;
	name: string;
}

export interface ReferenceWord {
	text: string;
	startSeconds: number;
	endSeconds: number;
}

/**
 * Decodes `count` evenly-spaced frames from a video URL.
 *
 * Samples at slice MIDPOINTS so the first frame isn't a black leader and the
 * last isn't past the end — same discipline as frame-capture.ts.
 */
export async function sampleVideoFrames({
	url,
	count,
	durationSeconds,
}: {
	url: string;
	count: number;
	durationSeconds: number;
}): Promise<CapturedFrame[]> {
	const video = document.createElement("video");
	video.src = url;
	video.muted = true;
	video.playsInline = true;
	video.preload = "auto";

	await new Promise<void>((resolve, reject) => {
		video.addEventListener("loadeddata", () => resolve(), { once: true });
		video.addEventListener("error", () => reject(new Error("Could not decode the reference video.")), {
			once: true,
		});
		// A stalled decode must not hang the Director forever.
		setTimeout(() => reject(new Error("Timed out decoding the reference video.")), 15000);
	});

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D is unavailable.");

	const frames: CapturedFrame[] = [];
	for (let i = 0; i < count; i++) {
		const t = ((i + 0.5) / count) * durationSeconds;
		try {
			await seekVideo(video, t);
			const scale = Math.min(1, MAX_EDGE_PX / Math.max(video.videoWidth, video.videoHeight));
			canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
			canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
			// Flatten onto black: JPEG has no alpha (same reason as frame-capture).
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
			const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
			if (base64) {
				frames.push({ base64, mediaType: "image/jpeg", timeSeconds: t });
			}
		} catch {
			// One unseekable timestamp must not abort the whole analysis — a
			// partial set of frames still supports a real style read.
		}
	}

	video.src = "";
	return frames;
}

function seekVideo(video: HTMLVideoElement, timeSeconds: number): Promise<void> {
	return new Promise((resolve, reject) => {
		const onSeeked = () => {
			video.removeEventListener("seeked", onSeeked);
			resolve();
		};
		video.addEventListener("seeked", onSeeked);
		setTimeout(() => {
			video.removeEventListener("seeked", onSeeked);
			reject(new Error("seek timeout"));
		}, 4000);
		video.currentTime = Math.max(0, Math.min(timeSeconds, video.duration || timeSeconds));
	});
}

/**
 * Words/minute overall and per quarter, computed from real word timings.
 *
 * Per-quarter matters more than the average: a reference that opens at 200wpm
 * and settles to 120 is a completely different edit from a flat 160, and the
 * average hides exactly that.
 */
export function computePacingStats({
	words,
	durationSeconds,
}: {
	words: ReferenceWord[];
	durationSeconds: number;
}): string {
	if (words.length === 0 || durationSeconds <= 0) {
		return "No speech detected — this reference's rhythm is carried by cuts and music, not narration.";
	}
	const sorted = [...words].sort((a, b) => a.startSeconds - b.startSeconds);
	const spoken = sorted[sorted.length - 1].endSeconds - sorted[0].startSeconds;
	const wpm = spoken > 0 ? (sorted.length / spoken) * 60 : 0;
	const quarterSeconds = durationSeconds / 4;
	const quarters = [0, 1, 2, 3].map((q) => {
		const from = q * quarterSeconds;
		const to = (q + 1) * quarterSeconds;
		const n = sorted.filter((w) => w.startSeconds >= from && w.startSeconds < to).length;
		return Math.round((n / quarterSeconds) * 60);
	});
	return (
		`Speech stats: ${sorted.length} words over ${spoken.toFixed(1)}s of speech ` +
		`(video ${durationSeconds.toFixed(1)}s) — ${Math.round(wpm)} wpm average; ` +
		`per-quarter wpm: ${quarters.join(" / ")}.`
	);
}

/** Groups words into readable timestamped lines for the model. */
export function formatTranscriptLines({
	words,
	wordsPerLine = 10,
}: {
	words: ReferenceWord[];
	wordsPerLine?: number;
}): string {
	if (words.length === 0) return "(no speech detected)";
	const sorted = [...words].sort((a, b) => a.startSeconds - b.startSeconds);
	const lines: string[] = [];
	for (let i = 0; i < sorted.length; i += wordsPerLine) {
		const chunk = sorted.slice(i, i + wordsPerLine);
		const start = chunk[0].startSeconds;
		const end = chunk[chunk.length - 1].endSeconds;
		lines.push(`[${start.toFixed(1)}s–${end.toFixed(1)}s] ${chunk.map((w) => w.text).join(" ")}`);
	}
	return lines.join("\n");
}

/**
 * Transcribes a reference on-device through the native bridge.
 *
 * Reports `available: false` rather than throwing when the platform cannot
 * transcribe (browser preview, or a device without the capability) — a style
 * read from frames alone is still worth having, and the caller says so plainly
 * instead of pretending there was no speech.
 */
export async function transcribeReference({
	handle,
}: {
	handle: MediaHandle;
}): Promise<{ words: ReferenceWord[]; available: boolean; reason?: string }> {
	try {
		const bridge = await getNativeBridge();
		const words: ReferenceWord[] = [];
		for await (const segment of bridge.transcribe({
			handle,
			opts: { modelSize: "base" },
		})) {
			for (const word of segment.words ?? []) {
				if (word.text?.trim()) {
					words.push({
						text: word.text,
						startSeconds: word.startMicros / MICROS_PER_SECOND,
						endSeconds: word.endMicros / MICROS_PER_SECOND,
					});
				}
			}
		}
		return { words, available: true };
	} catch (error) {
		return {
			words: [],
			available: false,
			reason: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Picks a reference video and analyses it end to end.
 *
 * The reference is NEVER added to the project — `pickMedia` hands back a native
 * handle, we read frames and speech off it, and nothing touches the timeline.
 */
export async function analyzeReferenceVideo({
	frameCount = 10,
}: {
	frameCount?: number;
} = {}): Promise<ReferenceAnalysis> {
	const bridge = await getNativeBridge();
	const picked = await bridge.pickMedia({ kinds: ["video"], allowMultiple: false });
	if (picked.length === 0) throw new Error("No reference video selected.");

	const handle = picked[0];
	const durationSeconds = handle.durationMicros / MICROS_PER_SECOND;
	if (durationSeconds <= 0) throw new Error("That file has no readable duration.");

	const count = Math.max(4, Math.min(16, Math.round(frameCount)));
	const frames = await sampleVideoFrames({
		url: bridge.toPlaybackUri(handle.uri),
		count,
		durationSeconds,
	});
	if (frames.length === 0) {
		throw new Error("Could not read any frames from that video.");
	}

	const { words, available, reason } = await transcribeReference({ handle });
	const transcript = available
		? formatTranscriptLines({ words })
		: `(transcription unavailable on this platform${reason ? `: ${reason}` : ""} — read the style from the frames alone and say so)`;

	return {
		frames,
		transcript,
		pacing: computePacingStats({ words, durationSeconds }),
		durationSeconds,
		name: handle.fileName || "Reference",
	};
}

/**
 * The prompt the Director reads after the frames.
 *
 * Deliberately demands a STRUCTURED read and then a save — an unsaved
 * observation helps nobody on the next video.
 */
export function buildStyleExtractionPrompt({
	analysis,
}: {
	analysis: ReferenceAnalysis;
}): string {
	return (
		`Reference video "${analysis.name}" (${analysis.durationSeconds.toFixed(1)}s). ` +
		`${analysis.frames.length} frames sampled at ${analysis.frames
			.map((f) => `${f.timeSeconds.toFixed(1)}s`)
			.join(", ")}.\n\n` +
		`${analysis.pacing}\n\nTranscript:\n${analysis.transcript}\n\n` +
		`Study the FRAMES above alongside the transcript and pacing numbers, then describe this video's ` +
		`editing style concretely — what you can actually SEE, not generic advice:\n` +
		`- pacing: energy and speech rate, and whether it changes across the video\n` +
		`- cut_rhythm: how often cuts land and what triggers them\n` +
		`- hook_structure: what the first few seconds do to hold attention\n` +
		`- caption_style: font weight, size, position, animation, highlight colors AS SEEN in the frames\n` +
		`- color_grade: contrast, saturation, shadow/highlight tint\n` +
		`- motion_graphic_density: how often overlays appear and what kind\n` +
		`- audio_feel: music/SFX character, if inferable\n\n` +
		`Then call save_style_profile with those fields. After it saves, tell the user in plain language ` +
		`what defines this style and offer to apply it to their footage.`
	);
}
