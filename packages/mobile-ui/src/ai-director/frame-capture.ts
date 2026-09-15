/**
 * ContentFlow — composited frame capture for the AI Director's eyes.
 *
 * This is what separates a director from a chatbot: the model can LOOK at the
 * finished frame — overlays, captions, motion graphics and all — instead of
 * reasoning blind from clip metadata. A transcript says what was said; only a
 * frame shows whether the caption is covering someone's face.
 *
 * Mechanism: the preview already composites every layer into the wgpu
 * compositor's canvas (`wasmCompositor.getCanvas()`, a module singleton, so it
 * is reachable outside React). We seek the engine, render that exact time
 * through the SAME `CanvasRenderer` path the preview uses, then read the
 * canvas back as JPEG. Because it is the same path, what Claude sees is what
 * the user sees — and what will export.
 *
 * Frames are downscaled before encoding: a 1080x1920 PNG per frame would blow
 * the request size and cost for no analytic gain. ~768px on the long edge is
 * plenty for judging composition, legibility and framing.
 */
import type { EditorCore } from "@kneecap/editor-core";
import { CanvasRenderer } from "@kneecap/editor-core/services/renderer/canvas-renderer";
import { wasmCompositor } from "@kneecap/editor-core/services/renderer/compositor/wasm-compositor";
import { buildScene } from "@kneecap/editor-core/services/renderer/scene-builder";
import { mediaTimeFromSeconds, mediaTimeToSeconds } from "@kneecap/editor-core/wasm";

/** Long-edge cap for a captured frame. Enough to judge composition, small
 *  enough to keep vision requests fast on a phone connection. */
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
 * Renders the composited output at `timeSeconds` and returns it as base64 JPEG.
 * Returns null when the compositor isn't up yet (no project open, or GPU init
 * failed) — callers surface that honestly rather than pretending to see.
 */
export async function captureFrameAt({
	editor,
	timeSeconds,
}: {
	editor: EditorCore;
	timeSeconds: number;
}): Promise<CapturedFrame | null> {
	const project = editor.project.getActive();
	if (!project) return null;

	const { width, height } = project.settings.canvasSize;
	const fps = project.settings.fps;

	try {
		const tracks = editor.timeline.getRenderTracks() ?? editor.scenes.getActiveScene().tracks;
		const mediaAssets = editor.media.getAssets();
		const duration = editor.timeline.getTotalDuration();

		// Rebuild the tree for this moment rather than reusing the live preview
		// tree: the preview's tree tracks the playhead, and we may be sampling a
		// time the user isn't parked on.
		const tree = buildScene({
			tracks,
			mediaAssets,
			duration,
			canvasSize: { width, height },
			background: project.settings.background,
			isPreview: true,
		});

		const renderer = new CanvasRenderer({ width, height, fps });
		// Touch the compositor first so its canvas exists before we render into it.
		renderer.getOutputCanvas();

		const clamped = Math.max(
			0,
			Math.min(timeSeconds, mediaTimeToSeconds({ time: duration })),
		);
		await renderer.render({
			node: tree,
			time: mediaTimeFromSeconds({ seconds: clamped }),
		});

		const source = wasmCompositor.getCanvas();
		if (!source || source.width === 0 || source.height === 0) return null;

		const scale = Math.min(1, MAX_EDGE_PX / Math.max(source.width, source.height));
		const outW = Math.max(1, Math.round(source.width * scale));
		const outH = Math.max(1, Math.round(source.height * scale));

		const out = document.createElement("canvas");
		out.width = outW;
		out.height = outH;
		const ctx = out.getContext("2d");
		if (!ctx) return null;
		// Flatten onto black: the compositor canvas can carry alpha, and JPEG has
		// none — without this, transparent regions encode as noise.
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, outW, outH);
		ctx.drawImage(source, 0, 0, outW, outH);

		const dataUrl = out.toDataURL("image/jpeg", JPEG_QUALITY);
		const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
		if (!base64) return null;

		return { base64, mediaType: "image/jpeg", timeSeconds: clamped };
	} catch (error) {
		console.warn("[frame-capture] failed:", error);
		return null;
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
