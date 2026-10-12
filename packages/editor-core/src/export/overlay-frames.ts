/**
 * PRERENDERED OVERLAY FRAMES — the end of preview-vs-export drift for
 * text and captions (round 37).
 *
 * Until now the native exporter re-implemented text and caption drawing in
 * Swift/CoreText, parallel to the preview's own canvas code. Two
 * implementations of the same visual contract drifted every single round:
 * font size (raw vs height-scaled), border unit (px vs percent), paint
 * order (stroke over fill vs fill over stroke), line breaks (dropped),
 * alignment, line height, letter spacing, z-order, and bitmap resampling
 * on scaled elements. Each was found and fixed one at a time, by
 * measuring exported pixels.
 *
 * This module removes the second implementation. The PREVIEW rasterizes
 * every text/caption node into a full-canvas 2D texture
 * (see `services/renderer/compositor/frame-descriptor.ts` — `draw: (ctx)
 * => renderTextToContext({ node, ctx })`, composited with
 * `fullCanvasTransform`). Here we call the SAME functions, on the same
 * resolved nodes, into a canvas at the EXPORT resolution — so what the
 * exporter composites over the video is, by construction, the same
 * drawing the editor shows. Position, size, weight, wrapping and stacking
 * cannot disagree, because there is only one implementation left.
 *
 * Output is a list of time SEGMENTS, not one image per frame: the overlay
 * layer only changes when a clip enters/leaves, an animation advances, or
 * a caption's active word moves. Each frame's overlay content is hashed
 * (the same params+resolved hash the preview's texture cache uses) and a
 * new PNG is emitted only when that hash changes, so a static title over
 * a 60s clip costs exactly one image.
 *
 * SCOPE: text, captions, canvas graphics (shapes) and stickers — everything
 * the preview draws from a 2D source or an image. HTML motion templates are
 * React/WebGL in the DOM layer; the host paints those through `paintExtras`
 * (mobile-ui). A template the host cannot capture is returned in
 * `uncapturedElementIds` so the export sheet still lists it. PiP video and
 * image overlays stay on the native decoder path.
 */
import type { OverlayTrack, SceneTracks } from "@/timeline";
import type { MediaAsset } from "@/media/types";
import type { TCanvasSize } from "@/project/types";
import type { FrameRate } from "opencut-wasm";
import { DEFAULT_GRAPHIC_SOURCE_SIZE } from "@/graphics";
import { buildScene } from "@/services/renderer/scene-builder";
import { CanvasRenderer } from "@/services/renderer/canvas-renderer";
import { resolveRenderTree } from "@/services/renderer/resolve";
import type { AnyBaseNode } from "@/services/renderer/nodes/base-node";
import { TextNode, renderTextToContext } from "@/services/renderer/nodes/text-node";
import {
	CaptionNode,
	renderCaptionToContext,
} from "@/services/renderer/nodes/caption-node";
import { GraphicNode } from "@/services/renderer/nodes/graphic-node";
import { StickerNode } from "@/services/renderer/nodes/sticker-node";
import type { Transform } from "@/rendering";

export interface OverlayFrame {
	/** Inclusive start / exclusive end on the OUTPUT timeline, in ticks. */
	startTicks: number;
	endTicks: number;
	/**
	 * Base64 PNG (no data: prefix) at the export resolution, transparent
	 * everywhere the overlay does not paint. Empty when `pngPath` is set:
	 * the bytes live in the sandbox so a long timeline does not sit in one
	 * bridge payload.
	 */
	pngBase64: string;
	/** Sandbox path of the same PNG, written one frame at a time. */
	pngPath?: string;
}

export interface OverlayPaintArgs {
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	timeSeconds: number;
	canvasSize: TCanvasSize;
}

export interface OverlayRenderResult {
	frames: OverlayFrame[];
	/**
	 * Timeline element ids whose pixels are not in `frames`. HTML templates
	 * the host could not capture, and canvas graphics whose draw threw.
	 * The omission list names these and only these.
	 */
	uncapturedElementIds: string[];
}

type OverlayCanvas = {
	canvas: HTMLCanvasElement | OffscreenCanvas;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
};

function createCanvas({
	width,
	height,
}: {
	width: number;
	height: number;
}): OverlayCanvas | null {
	// Prefer a DOM canvas whenever a document exists. WKWebView's
	// OffscreenCanvas.convertToBlob throws SecurityError ("The operation
	// is insecure.") even for an origin-clean canvas, and toDataURL on an
	// HTMLCanvasElement does not.
	if (typeof document !== "undefined") {
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (ctx) return { canvas, ctx };
	}
	if (typeof OffscreenCanvas !== "undefined") {
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		return { canvas, ctx };
	}
	return null;
}

function sourceIsReadable({ source }: { source: CanvasImageSource }): boolean {
	if (typeof document === "undefined") return true;
	const probe = document.createElement("canvas");
	probe.width = 1;
	probe.height = 1;
	const ctx = probe.getContext("2d");
	if (!ctx) return false;
	try {
		ctx.drawImage(source, 0, 0, 1, 1);
		ctx.getImageData(0, 0, 1, 1);
		return true;
	} catch {
		return false;
	}
}

/** Depth-first, which is the order `buildScene` appended them: bottom to top. */
function collectOverlayNodes(root: AnyBaseNode): AnyBaseNode[] {
	const out: AnyBaseNode[] = [];
	const walk = (node: AnyBaseNode) => {
		if (
			node instanceof TextNode ||
			node instanceof CaptionNode ||
			node instanceof GraphicNode ||
			node instanceof StickerNode
		) {
			out.push(node);
		}
		for (const child of node.children) walk(child);
	};
	walk(root);
	return out;
}

function isHtmlTemplateDefinition(definitionId: string): boolean {
	return definitionId.startsWith("html:");
}

/** HTML templates are painted by the host, not by GraphicNode's no-op canvas render. */
function canvasOverlayTracks({ tracks }: { tracks: SceneTracks }): SceneTracks {
	const overlay: OverlayTrack[] = [];
	for (const track of tracks.overlay) {
		if (track.type !== "text" && track.type !== "caption" && track.type !== "graphic") {
			continue;
		}
		if (track.type !== "graphic") {
			overlay.push(track);
			continue;
		}
		const elements = track.elements.filter(
			(element) => element.type !== "graphic" || !isHtmlTemplateDefinition(element.definitionId),
		);
		if (elements.length === 0) continue;
		overlay.push({ ...track, elements });
	}
	return {
		main: { ...tracks.main, elements: [] },
		overlay,
		audio: [],
	};
}

function htmlTemplateElementIds({ tracks }: { tracks: SceneTracks }): string[] {
	const ids: string[] = [];
	for (const track of tracks.overlay) {
		if (track.hidden) continue;
		for (const element of track.elements) {
			if (element.type !== "graphic") continue;
			if (!isHtmlTemplateDefinition(element.definitionId)) continue;
			if ("hidden" in element && element.hidden) continue;
			ids.push(element.id);
		}
	}
	return ids;
}

function drawOverlayNode({
	node,
	ctx,
}: {
	node: AnyBaseNode;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}): void {
	// `node.resolved` being null means "not visible at this time" — every
	// resolver returns null outside its element's window.
	if (!node.resolved) return;
	ctx.save();
	if (node instanceof TextNode) {
		// The preview applies a text layer's opacity at the COMPOSITOR
		// (frame-descriptor pushes `opacity: node.resolved.opacity`); there
		// is no compositor layer here, so apply it on the context.
		ctx.globalAlpha = node.resolved.opacity;
		renderTextToContext({ node, ctx });
	} else if (node instanceof CaptionNode) {
		// renderCaptionToContext applies its own globalAlpha already.
		renderCaptionToContext({ node, ctx });
	}
	ctx.restore();
}

/**
 * Same placement as the preview compositor (`computeVisualTransform` in
 * frame-descriptor.ts): contain the source in the canvas, then apply the
 * element's scale, position and rotation around the canvas centre.
 */
function drawPlacedSource({
	ctx,
	source,
	sourceWidth,
	sourceHeight,
	canvasSize,
	transform,
	opacity,
}: {
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	source: CanvasImageSource;
	sourceWidth: number;
	sourceHeight: number;
	canvasSize: TCanvasSize;
	transform: Transform;
	opacity: number;
}): boolean {
	if (!(opacity > 0) || sourceWidth <= 0 || sourceHeight <= 0) return true;
	const containScale = Math.min(canvasSize.width / sourceWidth, canvasSize.height / sourceHeight);
	const scaledWidth = sourceWidth * containScale * transform.scaleX;
	const scaledHeight = sourceHeight * containScale * transform.scaleY;
	const absWidth = Math.abs(scaledWidth);
	const absHeight = Math.abs(scaledHeight);
	if (!(absWidth > 0) || !(absHeight > 0)) return true;
	// A cross-origin or capacitor:// image taints the destination. WebKit
	// then throws SecurityError on toDataURL for the whole export frame.
	if (!sourceIsReadable({ source })) return false;
	ctx.save();
	ctx.globalAlpha = opacity;
	ctx.translate(canvasSize.width / 2 + transform.position.x, canvasSize.height / 2 + transform.position.y);
	ctx.rotate((transform.rotate * Math.PI) / 180);
	ctx.scale(scaledWidth < 0 ? -1 : 1, scaledHeight < 0 ? -1 : 1);
	try {
		ctx.drawImage(source, -absWidth / 2, -absHeight / 2, absWidth, absHeight);
	} catch {
		ctx.restore();
		return false;
	}
	ctx.restore();
	return true;
}

function drawCanvasOverlayNode({
	node,
	ctx,
	canvasSize,
	failedIds,
}: {
	node: AnyBaseNode;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	canvasSize: TCanvasSize;
	failedIds: Set<string>;
}): void {
	if (!node.resolved) return;
	if (node instanceof TextNode || node instanceof CaptionNode) {
		drawOverlayNode({ node, ctx });
		return;
	}
	if (node instanceof GraphicNode) {
		const resolved = node.resolved;
		try {
			const source = node.getSource({ resolvedParams: resolved.resolvedParams });
			const drew = drawPlacedSource({
				ctx,
				source,
				sourceWidth: DEFAULT_GRAPHIC_SOURCE_SIZE,
				sourceHeight: DEFAULT_GRAPHIC_SOURCE_SIZE,
				canvasSize,
				transform: resolved.transform,
				opacity: resolved.opacity,
			});
			if (!drew && node.params.elementId) failedIds.add(node.params.elementId);
		} catch {
			if (node.params.elementId) failedIds.add(node.params.elementId);
		}
		return;
	}
	if (node instanceof StickerNode) {
		const resolved = node.resolved;
		try {
			const drew = drawPlacedSource({
				ctx,
				source: resolved.source,
				sourceWidth: resolved.sourceWidth,
				sourceHeight: resolved.sourceHeight,
				canvasSize,
				transform: resolved.transform,
				opacity: resolved.opacity,
			});
			if (!drew && node.params.elementId) failedIds.add(node.params.elementId);
		} catch {
			if (node.params.elementId) failedIds.add(node.params.elementId);
		}
	}
}

/** The preview's own texture-cache key: params + resolved fully determine
 *  the raster (frame-descriptor.ts says so in as many words). */
function overlayHash(nodes: AnyBaseNode[]): string {
	if (nodes.length === 0) return "";
	return JSON.stringify(
		nodes.map((node) => ({
			p: (node as { params?: unknown }).params,
			r: node.resolved,
		})),
	);
}

function pngDataUrlPayload({ dataUrl }: { dataUrl: string }): string {
	return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

async function toPngBase64(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<string> {
	if (canvas instanceof HTMLCanvasElement) {
		return pngDataUrlPayload({ dataUrl: canvas.toDataURL("image/png") });
	}
	// Headless tests have no document. WKWebView does, and convertToBlob
	// there throws SecurityError, so copy through an HTML canvas first.
	if (typeof document !== "undefined") {
		const html = document.createElement("canvas");
		html.width = canvas.width;
		html.height = canvas.height;
		const ctx = html.getContext("2d");
		if (!ctx) throw new Error("2d context unavailable");
		ctx.drawImage(canvas, 0, 0);
		return pngDataUrlPayload({ dataUrl: html.toDataURL("image/png") });
	}
	const blob = await canvas.convertToBlob({ type: "image/png" });
	const buffer = await blob.arrayBuffer();
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

export interface RenderOverlayFramesParams {
	tracks: SceneTracks;
	mediaAssets: MediaAsset[];
	/** EXPORT resolution — not the preview's canvas size. The drawing code
	 *  scales every dimension off this (`fontSize × height / 90`), so
	 *  rendering here at the output size is what makes the exported result
	 *  match the preview shape-for-shape at any resolution. */
	canvasSize: TCanvasSize;
	fps: FrameRate;
	durationTicks: number;
	ticksPerSecond: number;
	/** Reports 0..1 while sampling, for the export sheet's progress bar. */
	onProgress?: (fraction: number) => void;
	/**
	 * Changes when the host's DOM/WebGL overlay changes. Sampled every output
	 * frame; identical keys collapse into one PNG. Return "" when there is
	 * nothing extra to paint.
	 */
	extraHash?: (args: { timeSeconds: number }) => string;
	/**
	 * Paints HTML/WebGL templates onto the frame after canvas graphics, in
	 * the same place `HtmlMotionLayer` sits above the preview. `captured`
	 * ids are removed from the omission list. `missed` ids were on screen
	 * for this sample and produced no pixels.
	 */
	paintExtras?: (args: OverlayPaintArgs) => Promise<{
		captured: readonly string[];
		missed: readonly string[];
	}>;
	/**
	 * Writes one finished PNG out of the JS heap (sandbox file) and returns
	 * the frame to keep. Without it, every PNG stays inline as base64.
	 */
	spillFrame?: (frame: OverlayFrame) => Promise<OverlayFrame>;
}

export async function renderOverlayFrames({
	tracks,
	mediaAssets,
	canvasSize,
	fps,
	durationTicks,
	ticksPerSecond,
	onProgress,
	extraHash,
	paintExtras,
	spillFrame,
}: RenderOverlayFramesParams): Promise<OverlayRenderResult> {
	const failedIds = new Set<string>();
	// Every HTML template starts omitted. A sample that actually paints it
	// removes it. One that never produces pixels stays on the list.
	for (const id of htmlTemplateElementIds({ tracks })) failedIds.add(id);
	const surface = createCanvas({
		width: canvasSize.width,
		height: canvasSize.height,
	});
	if (!surface) {
		return { frames: [], uncapturedElementIds: [...failedIds] };
	}

	const durationSeconds = durationTicks / ticksPerSecond;
	const frameSeconds = fps.denominator / fps.numerator;
	const frameCount = Math.max(1, Math.ceil(durationSeconds / frameSeconds));

	// A renderer instance purely as the resolve context (it carries the
	// width/height the resolvers scale against). Nothing is composited
	// through it here — the 2D draws above are the whole output.
	const renderer = new CanvasRenderer({
		width: canvasSize.width,
		height: canvasSize.height,
		fps,
	});
	// OVERLAY TRACKS ONLY. Resolving the full scene would resolve VideoNodes
	// too — i.e. decode a video frame per sample, thousands of times, for
	// pixels this pass never draws. HTML templates are excluded: their
	// canvas render is a no-op and the host paints them via `paintExtras`.
	const overlayOnlyTracks = canvasOverlayTracks({ tracks });
	const tree = buildScene({
		tracks: overlayOnlyTracks,
		mediaAssets,
		duration: durationTicks,
		canvasSize,
		// Transparent everywhere the overlay does not paint — the exporter
		// composites this OVER the video, so the scene background must not
		// contribute. (No background node is emitted for a color background.)
		background: { type: "color", color: "#000000" },
		isPreview: false,
	});

	const frames: OverlayFrame[] = [];
	let openFrame: { startTicks: number; hash: string; pngBase64: string } | null = null;

	const flush = async (endTicks: number) => {
		if (!openFrame || openFrame.hash === "" || openFrame.pngBase64 === "") return;
		if (endTicks <= openFrame.startTicks) return;
		const frame: OverlayFrame = {
			startTicks: openFrame.startTicks,
			endTicks,
			pngBase64: openFrame.pngBase64,
		};
		frames.push(spillFrame ? await spillFrame(frame) : frame);
	};

	const noteUnencoded = () => {
		for (const track of overlayOnlyTracks.overlay) {
			for (const element of track.elements) {
				if (element.type === "graphic" || element.type === "sticker") failedIds.add(element.id);
			}
		}
		for (const id of htmlTemplateElementIds({ tracks })) failedIds.add(id);
	};

	for (let index = 0; index < frameCount; index++) {
		const timeSeconds = index * frameSeconds;
		const timeTicks = Math.round(timeSeconds * ticksPerSecond);
		try {
			await resolveRenderTree({ node: tree, renderer, time: timeTicks });
		} catch {
			for (const track of overlayOnlyTracks.overlay) {
				for (const element of track.elements) {
					if (element.type === "graphic" || element.type === "sticker") {
						failedIds.add(element.id);
					}
				}
			}
		}
		const nodes = collectOverlayNodes(tree).filter((node) => node.resolved);
		const extra = extraHash?.({ timeSeconds }) ?? "";
		const nodeHash = overlayHash(nodes);
		const hash = nodeHash === "" && extra === "" ? "" : `${nodeHash}|${extra}`;

		if (!openFrame || hash !== openFrame.hash) {
			let pngBase64 = "";
			let encodeFailed = false;
			if (hash !== "") {
				try {
					surface.ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
					// Tree order matches the preview. The host paints HTML last,
					// which is where HtmlMotionLayer sits (above the canvas).
					for (const node of nodes) {
						drawCanvasOverlayNode({
							node,
							ctx: surface.ctx,
							canvasSize,
							failedIds,
						});
					}
					// An empty extra hash means the host has nothing new to paint
					// (no template is on screen). Skipping the DOM capture keeps
					// a long timeline from re-rendering React on every text frame.
					const captured: string[] = [];
					if (paintExtras && (!extraHash || extra !== "")) {
						const painted = await paintExtras({
							ctx: surface.ctx,
							timeSeconds,
							canvasSize,
						});
						captured.push(...painted.captured);
					}
					pngBase64 = await toPngBase64(surface.canvas);
					for (const id of captured) failedIds.delete(id);
				} catch {
					// One bad frame must not abort the export. Templates that
					// never made it into a PNG stay on the omission list.
					encodeFailed = true;
					pngBase64 = "";
					if (frames.length === 0) noteUnencoded();
				}
			}
			// Identical pixels share one PNG, even when the sample bucket
			// changed. A static title over a long clip stays one image.
			if (encodeFailed) {
				if (openFrame) openFrame.hash = hash;
				else openFrame = { startTicks: timeTicks, hash, pngBase64: "" };
			} else if (openFrame && pngBase64 === openFrame.pngBase64) {
				openFrame.hash = hash;
			} else {
				await flush(timeTicks);
				openFrame = { startTicks: timeTicks, hash, pngBase64 };
			}
		}
		onProgress?.((index + 1) / frameCount);
	}
	await flush(durationTicks);

	return { frames, uncapturedElementIds: [...failedIds] };
}

/**
 * Paints one overlay still onto `ctx`. Text, captions, stickers and shapes
 * use the same 2D path as export. `paintExtras` is the HTML/WebGL template
 * layer. Nothing here touches the live preview compositor.
 */
export async function paintOverlaySnapshot({
	tracks,
	mediaAssets,
	canvasSize,
	fps,
	timeSeconds,
	ticksPerSecond,
	durationTicks,
	ctx,
	paintExtras,
}: {
	tracks: SceneTracks;
	mediaAssets: MediaAsset[];
	canvasSize: TCanvasSize;
	fps: FrameRate;
	timeSeconds: number;
	ticksPerSecond: number;
	durationTicks: number;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	paintExtras?: RenderOverlayFramesParams["paintExtras"];
}): Promise<{ captured: readonly string[]; missed: readonly string[] }> {
	const renderer = new CanvasRenderer({
		width: canvasSize.width,
		height: canvasSize.height,
		fps,
	});
	const overlayOnlyTracks = canvasOverlayTracks({ tracks });
	const tree = buildScene({
		tracks: overlayOnlyTracks,
		mediaAssets,
		duration: durationTicks,
		canvasSize,
		background: { type: "color", color: "#000000" },
		isPreview: false,
	});
	const timeTicks = Math.round(Math.max(0, timeSeconds) * ticksPerSecond);
	await resolveRenderTree({ node: tree, renderer, time: timeTicks });
	const nodes = collectOverlayNodes(tree).filter((node) => node.resolved);
	const failedIds = new Set<string>();
	for (const node of nodes) {
		drawCanvasOverlayNode({ node, ctx, canvasSize, failedIds });
	}
	if (!paintExtras) return { captured: [], missed: [] };
	return paintExtras({ ctx, timeSeconds, canvasSize });
}
