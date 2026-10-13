/**
 * The same native export the Export sheet runs. The Director's export_video
 * tool calls this so a model cannot report a file the button would not produce.
 */
import type { EditorCore } from "@kneecap/editor-core";
import {
	buildEdl,
	listNativeExportOmissions,
	type Edl,
	type NativeExportOmission,
	type NativeExportPlatform,
} from "@kneecap/editor-core/edl";
import type { ExportFormat, ExportQuality } from "@kneecap/editor-core/export";
import {
	renderOverlayFrames,
	type OverlayFrame,
} from "@kneecap/editor-core/export/overlay-frames";
import { getNativeBridge, type ExportProgress } from "@kneecap/native-bridge";
import type { FrameRate } from "opencut-wasm";
import { buildNativeEdlAssetResolver, toEdlMediaAssets } from "../editor/actions";
import { createHtmlOverlayPainter } from "../motion-templates/rasterize-for-export";
import { clearSpilledOverlayPngs, spillOverlayFrame } from "./spill-overlay-frame";

export const EXPORT_QUALITY_BITRATE: Record<ExportQuality, number> = {
	low: 2_000_000,
	medium: 5_000_000,
	high: 10_000_000,
	very_high: 20_000_000,
};

export function buildProjectEdl({
	editor,
	quality,
	format,
	fps,
}: {
	editor: EditorCore;
	quality: ExportQuality;
	format: ExportFormat;
	fps?: FrameRate;
}): Edl {
	return buildEdl({
		project: editor.project.getActive(),
		scene: editor.scenes.getActiveScene(),
		mediaAssets: toEdlMediaAssets({ assets: editor.media.getAssets() }),
		resolveAsset: buildNativeEdlAssetResolver(),
		output: {
			container: format,
			videoCodec: "h264",
			audioCodec: "aac",
			bitrate: EXPORT_QUALITY_BITRATE[quality],
			includeAudio: true,
			fps,
		},
	});
}

export type ProjectExportResult =
	| { ok: true; outputUri: string | null; omissions: NativeExportOmission[] }
	| { ok: false; cancelled: boolean; error: string; omissions: NativeExportOmission[] };

export async function exportActiveProject({
	editor,
	quality,
	format,
	fps,
	onProgress,
	onOmissions,
	onGenerator,
}: {
	editor: EditorCore;
	quality: ExportQuality;
	format: ExportFormat;
	fps?: FrameRate;
	onProgress?: (progress: { stage: ExportProgress["stage"]; fraction: number }) => void;
	onOmissions?: (omissions: NativeExportOmission[]) => void;
	/** The Export sheet holds this so Cancel can stop the generator. */
	onGenerator?: (generator: AsyncGenerator<ExportProgress> | null) => void;
}): Promise<ProjectExportResult> {
	let edl: Edl;
	try {
		edl = buildProjectEdl({ editor, quality, format, fps });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { ok: false, cancelled: false, error: message, omissions: [] };
	}

	let omissions: NativeExportOmission[] = [];
	const bridge = await getNativeBridge();
	let overlayFrames: OverlayFrame[] = [];
	const sceneTracks = editor.scenes.getActiveScene().tracks;
	const painter = createHtmlOverlayPainter({
		tracks: sceneTracks,
		durationSeconds: edl.meta.durationTicks / edl.meta.ticksPerSecond,
		width: edl.output.resolution.width,
		height: edl.output.resolution.height,
	});
	const platform: NativeExportPlatform =
		bridge.platform === "ios" || bridge.platform === "android" ? bridge.platform : "web";
	omissions = listNativeExportOmissions({ edl, platform });
	onOmissions?.(omissions);
	try {
		onProgress?.({ stage: "preparing", fraction: 0 });
		const rendered = await renderOverlayFrames({
			tracks: sceneTracks,
			mediaAssets: editor.media.getAssets(),
			canvasSize: {
				width: edl.output.resolution.width,
				height: edl.output.resolution.height,
			},
			fps: edl.output.fps,
			durationTicks: edl.meta.durationTicks,
			ticksPerSecond: edl.meta.ticksPerSecond,
			extraHash: (args) => painter.hashAt(args),
			paintExtras: (args) => painter.paint(args),
			spillFrame: (frame) => spillOverlayFrame({ bridge, frame }),
			onProgress: (fraction: number) => onProgress?.({ stage: "preparing", fraction: fraction * 0.2 }),
		});
		overlayFrames = rendered.frames;
		if (rendered.uncapturedElementIds.length > 0) {
			omissions = listNativeExportOmissions({
				edl,
				platform,
				uncapturedClipIds: new Set(rendered.uncapturedElementIds),
			});
			onOmissions?.(omissions);
		}
	} catch (error) {
		console.warn("overlay prerender failed — native text path:", error);
		const missed = new Set<string>();
		for (const track of sceneTracks.overlay) {
			for (const element of track.elements) {
				if (element.type === "graphic" || element.type === "sticker") missed.add(element.id);
			}
		}
		if (missed.size > 0) {
			omissions = listNativeExportOmissions({ edl, platform, uncapturedClipIds: missed });
			onOmissions?.(omissions);
		}
	} finally {
		painter.dispose();
	}

	try {
		const generator = bridge.exportProject({ edl, overlayFrames });
		onGenerator?.(generator);
		let outputUri: string | null = null;
		let failed: string | null = null;
		let finished = false;
		for await (const event of generator) {
			onProgress?.({ stage: event.stage, fraction: event.fraction });
			if (event.stage === "error") {
				failed = event.error ?? "Export failed";
				break;
			}
			if (event.stage === "done") {
				finished = true;
				outputUri = event.outputUri ?? null;
				break;
			}
		}
		onGenerator?.(null);
		if (failed) return { ok: false, cancelled: false, error: failed, omissions };
		if (!finished) return { ok: false, cancelled: true, error: "Export cancelled.", omissions };
		return { ok: true, outputUri, omissions };
	} catch (error) {
		onGenerator?.(null);
		const message = error instanceof Error ? error.message : String(error);
		return { ok: false, cancelled: false, error: message, omissions };
	} finally {
		const cleanup = await getNativeBridge().catch(() => null);
		if (cleanup) await clearSpilledOverlayPngs({ bridge: cleanup });
	}
}
