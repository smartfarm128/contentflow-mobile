/**
 * ContentFlow — composited frame capture for the AI Director's eyes.
 *
 * The still is painted on a private canvas. Text, captions, stickers and
 * shapes use the export overlay path. Motion templates use the same
 * WKWebView-safe rasterizer as export. The live preview compositor is never
 * a draw target, so a capture cannot flash or replace the frame on screen.
 *
 * The video layer stays on that live compositor. This still does not include
 * it. Callers say so instead of claiming the JPEG is the full export.
 *
 * Frames are downscaled before encoding: a 1080x1920 JPEG per frame would
 * blow the request size. ~768px on the long edge is plenty for judging
 * titles, captions and template placement.
 */
import type { EditorCore } from "@kneecap/editor-core";
import { paintOverlaySnapshot } from "@kneecap/editor-core/export/overlay-frames";
import { TICKS_PER_SECOND, mediaTimeToSeconds } from "@kneecap/editor-core/wasm";
import { createHtmlOverlayPainter } from "../motion-templates/rasterize-for-export";

/** Long-edge cap for a captured frame. */
const MAX_EDGE_PX = 768;
/** JPEG quality — visibly clean, roughly a third the bytes of quality 1. */
const JPEG_QUALITY = 0.72;

export interface CapturedFrame {
	/** Base64 JPEG payload (no data: prefix — Anthropic wants raw base64). */
	base64: string;
	mediaType: "image/jpeg";
	timeSeconds: number;
}

/**
 * Renders overlays and motion templates at `timeSeconds` onto a private
 * canvas and returns a base64 JPEG. Returns null when there is no document
 * or the encode throws (WKWebView SecurityError included).
 */
export async function captureFrameAt({
	editor,
	timeSeconds,
}: {
	editor: EditorCore;
	timeSeconds: number;
}): Promise<CapturedFrame | null> {
	const project = editor.project.getActive();
	if (!project || typeof document === "undefined") return null;

	const { width, height } = project.settings.canvasSize;
	const fps = project.settings.fps;
	const tracks = editor.timeline.getRenderTracks() ?? editor.scenes.getActiveScene().tracks;
	const mediaAssets = editor.media.getAssets();
	const duration = editor.timeline.getTotalDuration();
	const durationSeconds = mediaTimeToSeconds({ time: duration });
	const clamped = Math.max(0, Math.min(timeSeconds, durationSeconds));

	const full = document.createElement("canvas");
	full.width = Math.max(1, width);
	full.height = Math.max(1, height);
	const fullCtx = full.getContext("2d");
	if (!fullCtx) return null;

	const painter = createHtmlOverlayPainter({
		tracks,
		durationSeconds: Math.max(durationSeconds, 0.001),
		width: full.width,
		height: full.height,
	});
	try {
		const fill = project.settings.background.type === "color" ? project.settings.background.color : "#000000";
		fullCtx.fillStyle = fill;
		fullCtx.fillRect(0, 0, full.width, full.height);
		await paintOverlaySnapshot({
			tracks,
			mediaAssets,
			canvasSize: { width: full.width, height: full.height },
			fps,
			timeSeconds: clamped,
			ticksPerSecond: TICKS_PER_SECOND,
			durationTicks: duration,
			ctx: fullCtx,
			paintExtras: (args) => painter.paint(args),
		});

		const scale = Math.min(1, MAX_EDGE_PX / Math.max(full.width, full.height));
		const outW = Math.max(1, Math.round(full.width * scale));
		const outH = Math.max(1, Math.round(full.height * scale));
		const out = document.createElement("canvas");
		out.width = outW;
		out.height = outH;
		const ctx = out.getContext("2d");
		if (!ctx) return null;
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, outW, outH);
		ctx.drawImage(full, 0, 0, outW, outH);
		const dataUrl = out.toDataURL("image/jpeg", JPEG_QUALITY);
		const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
		if (!base64) return null;
		return { base64, mediaType: "image/jpeg", timeSeconds: clamped };
	} catch (error) {
		console.warn("[frame-capture] failed:", error);
		return null;
	} finally {
		painter.dispose();
	}
}

/**
 * Evenly spaced frames across the whole timeline, for a self-review pass.
 * Samples at the MIDPOINT of each slice rather than the boundaries, so the
 * first sample isn't a black pre-roll frame and the last isn't past the end.
 */
export async function captureFramesAcross({
	editor,
	count = 4,
}: {
	editor: EditorCore;
	count?: number;
}): Promise<CapturedFrame[]> {
	const totalSeconds = mediaTimeToSeconds({ time: editor.timeline.getTotalDuration() });
	if (totalSeconds <= 0) return [];

	const n = Math.max(1, Math.min(8, count));
	const frames: CapturedFrame[] = [];
	for (let i = 0; i < n; i++) {
		const t = ((i + 0.5) / n) * totalSeconds;
		const frame = await captureFrameAt({ editor, timeSeconds: t });
		if (frame) frames.push(frame);
	}
	return frames;
}
