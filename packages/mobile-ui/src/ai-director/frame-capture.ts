/**
 * ContentFlow — composited frame capture for the AI Director's eyes.
 *
 * The still is painted on a private canvas. The video layer is a JPEG
 * grabbed on the native side (AVAssetImageGenerator / MediaMetadataRetriever)
 * from the proxy at the source time, contain-fit under the overlays.
 * Text, captions, stickers and shapes use the export overlay path. Motion
 * templates use the same WKWebView-safe rasterizer as export. The live
 * preview compositor is never a draw target.
 *
 * A failed grab still returns the overlay still, and the trace says the
 * video is missing. Callers must not describe that JPEG as the full frame.
 *
 * Frames are downscaled before encoding: a 1080x1920 JPEG per frame would
 * blow the request size. ~768px on the long edge is plenty for judging
 * titles, captions and template placement.
 */
import type { EditorCore } from "@kneecap/editor-core";
import { resolveNativeMediaRawPath } from "@kneecap/editor-core";
import { paintOverlaySnapshot } from "@kneecap/editor-core/export/overlay-frames";
import { TICKS_PER_SECOND, mediaTimeToSeconds } from "@kneecap/editor-core/wasm";
import type { VideoElement } from "@kneecap/editor-core/timeline";
import { getNativeBridge } from "@kneecap/native-bridge";
import { createHtmlOverlayPainter } from "../motion-templates/rasterize-for-export";

/** Long-edge cap for a captured frame. */
const MAX_EDGE_PX = 768;
/** JPEG quality — visibly clean, roughly a third the bytes of quality 1. */
const JPEG_QUALITY = 0.72;

export interface FrameCaptureTrace {
	video: "yes" | "no" | "error";
	/** Which sub-step produced the video layer, or why it is absent. */
	videoDetail: string;
	captured: string[];
	missed: string[];
	jpegChars: number;
}

export interface CapturedFrame {
	/** Base64 JPEG payload (no data: prefix — Anthropic wants raw base64). */
	base64: string;
	mediaType: "image/jpeg";
	timeSeconds: number;
	/** True when the proxy (or source) frame was drawn under the overlays. */
	includesVideo: boolean;
	trace: FrameCaptureTrace;
}

function videoAt({
	tracks,
	mediaAssets,
	timeSeconds,
}: {
	tracks: ReturnType<EditorCore["scenes"]["getActiveScene"]>["tracks"];
	mediaAssets: ReturnType<EditorCore["media"]["getAssets"]>;
	timeSeconds: number;
}): { path: string; sourceSeconds: number; kind: "proxy" | "source" } | null {
	const overlayVideos = tracks.overlay.flatMap((track) =>
		track.type === "video"
			? track.elements.filter((element): element is VideoElement => element.type === "video" && !element.hidden)
			: [],
	);
	const mainVideos = tracks.main.elements.filter(
		(element): element is VideoElement => element.type === "video" && !element.hidden,
	);
	const hit = [...mainVideos, ...overlayVideos].find((element) => {
		const start = mediaTimeToSeconds({ time: element.startTime });
		const duration = mediaTimeToSeconds({ time: element.duration });
		return timeSeconds >= start && timeSeconds < start + duration;
	});
	if (!hit) return null;
	const asset = mediaAssets.find((item) => item.id === hit.mediaId);
	if (!asset) return null;
	const proxy = asset.nativeRelativePath ? resolveNativeMediaRawPath(asset.nativeRelativePath) : null;
	const source = asset.sourceNativeRelativePath
		? resolveNativeMediaRawPath(asset.sourceNativeRelativePath)
		: null;
	const path = proxy ?? source;
	if (!path) return null;
	const start = mediaTimeToSeconds({ time: hit.startTime });
	const trim = mediaTimeToSeconds({ time: hit.trimStart });
	const rate = hit.retime?.rate && hit.retime.rate > 0 ? hit.retime.rate : 1;
	return {
		path,
		sourceSeconds: Math.max(0, (timeSeconds - start) * rate + trim),
		kind: proxy ? "proxy" : "source",
	};
}

function loadJpeg({ base64 }: { base64: string }): Promise<HTMLImageElement> {
	const img = new Image();
	const loaded = new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error("video jpeg decode failed"));
	});
	img.src = `data:image/jpeg;base64,${base64}`;
	return loaded.then(() => img);
}

/**
 * Renders the proxy video frame, then overlays and motion templates, at
 * `timeSeconds` onto a private canvas. Returns null when there is no
 * document or the encode throws (WKWebView SecurityError included).
 * `onTrace` receives one line per sub-step.
 */
export async function captureFrameAt({
	editor,
	timeSeconds,
	onTrace,
}: {
	editor: EditorCore;
	timeSeconds: number;
	onTrace?: (line: string) => void;
}): Promise<CapturedFrame | null> {
	const project = editor.project.getActive();
	if (!project || typeof document === "undefined") return null;

	const trace = (line: string) => onTrace?.(line);
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
	const report: FrameCaptureTrace = {
		video: "no",
		videoDetail: "no video clip at this time",
		captured: [],
		missed: [],
		jpegChars: 0,
	};
	try {
		const fill = project.settings.background.type === "color" ? project.settings.background.color : "#000000";
		fullCtx.fillStyle = fill;
		fullCtx.fillRect(0, 0, full.width, full.height);

		const request = videoAt({ tracks, mediaAssets, timeSeconds: clamped });
		if (!request) {
			trace("video: none (no clip covering this time, or no sandbox path)");
		} else {
			trace(`video: ${request.kind} path=${request.path} t=${request.sourceSeconds.toFixed(3)}`);
			try {
				const bridge = await getNativeBridge();
				const grabbed = await bridge.grabVideoFrame({
					path: request.path,
					timeSeconds: request.sourceSeconds,
					maxEdge: Math.max(full.width, full.height, MAX_EDGE_PX),
				});
				trace(`grab: jpeg chars=${grabbed.jpegBase64.length} ${grabbed.width}x${grabbed.height}`);
				const img = await loadJpeg({ base64: grabbed.jpegBase64 });
				const fit = Math.min(full.width / img.naturalWidth, full.height / img.naturalHeight);
				const dw = img.naturalWidth * fit;
				const dh = img.naturalHeight * fit;
				fullCtx.drawImage(img, (full.width - dw) / 2, (full.height - dh) / 2, dw, dh);
				report.video = "yes";
				report.videoDetail = `${request.kind} ${grabbed.width}x${grabbed.height} at ${request.sourceSeconds.toFixed(3)}s`;
				trace(`draw: contain-fit ${Math.round(dw)}x${Math.round(dh)}`);
			} catch (error) {
				const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
				report.video = "error";
				report.videoDetail = message;
				trace(`grab error: ${message}`);
			}
		}

		const painted = await paintOverlaySnapshot({
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
		report.captured = [...painted.captured];
		report.missed = [...painted.missed];
		trace(`paint: captured=${report.captured.join(",") || "none"} missed=${report.missed.join(",") || "none"}`);

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
		report.jpegChars = base64.length;
		trace(`jpeg: chars=${base64.length} ${outW}x${outH} video=${report.video}`);
		return {
			base64,
			mediaType: "image/jpeg",
			timeSeconds: clamped,
			includesVideo: report.video === "yes",
			trace: report,
		};
	} catch (error) {
		console.warn("[frame-capture] failed:", error);
		trace(`encode error: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`);
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
	onTrace,
}: {
	editor: EditorCore;
	count?: number;
	onTrace?: (line: string) => void;
}): Promise<CapturedFrame[]> {
	const totalSeconds = mediaTimeToSeconds({ time: editor.timeline.getTotalDuration() });
	if (totalSeconds <= 0) return [];

	const n = Math.max(1, Math.min(8, count));
	const frames: CapturedFrame[] = [];
	for (let i = 0; i < n; i++) {
		const t = ((i + 0.5) / n) * totalSeconds;
		const frame = await captureFrameAt({
			editor,
			timeSeconds: t,
			onTrace: (line) => onTrace?.(`frame ${i} ${line}`),
		});
		if (frame) frames.push(frame);
	}
	return frames;
}
