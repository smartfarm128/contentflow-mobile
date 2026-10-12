/**
 * Paints HTML / WebGL motion templates into the export overlay.
 *
 * The preview draws these as DOM above the canvas (`HtmlMotionLayer`).
 * The native exporters already composite a full-frame PNG, so the export
 * raster is that same DOM, captured per sample:
 *
 *   - a `<canvas>` (three.js / WebGL) is drawn with `drawImage` — WebGL
 *     contexts created while this painter is alive request
 *     `preserveDrawingBuffer` so the pixels survive until we read them
 *   - CSS and text are captured through an SVG `foreignObject` where that
 *     stays origin-clean (Chromium). WebKit taints the canvas
 *     ("The operation is insecure.") so there the same tree is painted
 *     with fillRect / fillText from computed style
 *
 * A clip that produces no visible pixels is returned as uncaptured. The
 * omission list names it. One clip's failure does not abort the others.
 * Samples stay at 15 fps for as long as a template is on screen. Each PNG
 * is written to the sandbox as it is finished, so a long timeline does not
 * freeze on the last image or ride in one base64 payload.
 */
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { mediaTimeToSeconds, type SceneTracks, type TCanvasSize } from "@kneecap/editor-core";
import type { OverlayPaintArgs } from "@kneecap/editor-core/export/overlay-frames";
import {
	buildTransformFromParams,
	readOpacityFromParams,
} from "@kneecap/editor-core/rendering";
import { getHtmlTemplate } from "./registry";
import { isHtmlTemplateGraphic, templateIdFromDefinitionId } from "./engine-bridge";
import type { EditingTemplatePrimitive, HtmlTemplateComponent } from "./types";

/** Motion-graphics sample rate. Held for the whole on-screen span. */
export const HTML_OVERLAY_TARGET_FPS = 15;

export function htmlOverlayStepSeconds({
	durationSeconds,
}: {
	durationSeconds: number;
	/** Accepted so callers can pass the export size; the step does not depend on it. */
	width?: number;
	height?: number;
}): number {
	void durationSeconds;
	return 1 / HTML_OVERLAY_TARGET_FPS;
}

/**
 * WebKit (every iOS browser, and desktop Safari) marks a canvas origin-dirty
 * after drawing an SVG that contains `foreignObject`. Reading it then throws
 * SecurityError. Chromium still allows that read, so the foreignObject path
 * stays for it.
 */
function foreignObjectTaintsCanvas(): boolean {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent;
	if (/iPhone|iPad|iPod/i.test(ua)) return true;
	return /AppleWebKit/i.test(ua) && !/Chrome|Chromium|Edg\//i.test(ua);
}

interface TemplateClipBox {
	id: string;
	templateId: string;
	progress: number;
	time: number;
	values: Record<string, EditingTemplatePrimitive>;
	left: number;
	top: number;
	width: number;
	height: number;
	rotation: number;
	opacity: number;
}

function primitiveParams(params: object): Record<string, EditingTemplatePrimitive> {
	const values: Record<string, EditingTemplatePrimitive> = {};
	for (const [key, value] of Object.entries(params)) {
		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			values[key] = value;
		}
	}
	return values;
}

function clipsAtTime({
	tracks,
	timeSeconds,
	canvasSize,
}: {
	tracks: SceneTracks;
	timeSeconds: number;
	canvasSize: TCanvasSize;
}): TemplateClipBox[] {
	const clips: TemplateClipBox[] = [];
	for (const track of tracks.overlay) {
		if (track.hidden) continue;
		for (const element of track.elements) {
			if (element.type !== "graphic") continue;
			if (!isHtmlTemplateGraphic({ definitionId: element.definitionId })) continue;
			if ("hidden" in element && element.hidden) continue;
			const templateId = templateIdFromDefinitionId({ definitionId: element.definitionId });
			if (!templateId) continue;
			const startSec = mediaTimeToSeconds({ time: element.startTime });
			const durationSec = mediaTimeToSeconds({ time: element.duration });
			if (timeSeconds < startSec || timeSeconds >= startSec + durationSec) continue;
			const transform = buildTransformFromParams({ params: element.params });
			const width = canvasSize.width * transform.scaleX;
			const height = canvasSize.height * transform.scaleY;
			clips.push({
				id: element.id,
				templateId,
				progress: durationSec > 0 ? Math.max(0, Math.min(1, (timeSeconds - startSec) / durationSec)) : 0,
				time: timeSeconds,
				values: primitiveParams(element.params),
				left: canvasSize.width / 2 + transform.position.x - width / 2,
				top: canvasSize.height / 2 + transform.position.y - height / 2,
				width,
				height,
				rotation: transform.rotate,
				opacity: readOpacityFromParams({ params: element.params }),
			});
		}
	}
	return clips;
}

function TemplateStage({
	clips,
	canvasWidth,
	canvasHeight,
}: {
	clips: TemplateClipBox[];
	canvasWidth: number;
	canvasHeight: number;
}) {
	return (
		<div style={{ position: "relative", width: canvasWidth, height: canvasHeight }}>
			{clips.map((clip) => {
				const template = getHtmlTemplate(clip.templateId);
				if (!template) return null;
				const Component: HtmlTemplateComponent = template.Component;
				const merged = {
					...Object.fromEntries(template.controls.map((control) => [control.id, control.defaultValue])),
					...clip.values,
				};
				return (
					<div
						key={clip.id}
						data-html-template-clip={clip.id}
						style={{
							position: "absolute",
							left: clip.left,
							top: clip.top,
							width: clip.width,
							height: clip.height,
							opacity: clip.opacity,
						}}
					>
						<Component
							progress={clip.progress}
							time={clip.time}
							width={clip.width}
							height={clip.height}
							values={merged}
						/>
					</div>
				);
			})}
		</div>
	);
}

function nextFrame(): Promise<void> {
	return new Promise((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}

/**
 * three.js calls `getContext` without `preserveDrawingBuffer`, and the
 * buffer is cleared after composite. Forcing the flag on contexts created
 * during the export keeps `drawImage` honest.
 */
function installPreserveDrawingBuffer(): () => void {
	if (typeof HTMLCanvasElement === "undefined") return () => {};
	const prototype = HTMLCanvasElement.prototype;
	const original = prototype.getContext;
	// getContext's signature is positional; this wrapper has to match it.
	// eslint-disable-next-line opencut/prefer-object-params
	const patched = function (this: HTMLCanvasElement, type: string, options?: object) {
		if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") {
			const base = options ?? {};
			return Reflect.apply(original, this, [type, { ...base, preserveDrawingBuffer: true }]);
		}
		return Reflect.apply(original, this, [type, options]);
	};
	prototype.getContext = patched as typeof prototype.getContext;
	return () => {
		prototype.getContext = original;
	};
}

/**
 * Draw `source` into a tiny 2D canvas and read it back. Returns null when
 * WebKit refuses the read (tainted canvas, SecurityError "The operation
 * is insecure.") so the caller can skip that source instead of poisoning
 * the export canvas.
 */
function readProbe({
	source,
	width,
	height,
}: {
	source: CanvasImageSource;
	width: number;
	height: number;
}): Uint8ClampedArray | null {
	const probe = document.createElement("canvas");
	probe.width = Math.max(1, Math.min(64, Math.round(width)));
	probe.height = Math.max(1, Math.min(64, Math.round(height)));
	const ctx = probe.getContext("2d");
	if (!ctx) return null;
	try {
		ctx.drawImage(source, 0, 0, probe.width, probe.height);
		return ctx.getImageData(0, 0, probe.width, probe.height).data;
	} catch {
		return null;
	}
}

function canvasReadAllowed({ canvas }: { canvas: HTMLCanvasElement }): boolean {
	const ctx = canvas.getContext("2d");
	if (!ctx) return false;
	try {
		ctx.getImageData(0, 0, 1, 1);
		return true;
	} catch {
		return false;
	}
}

function canvasHasPixels({
	source,
	width,
	height,
}: {
	source: CanvasImageSource;
	width: number;
	height: number;
}): boolean {
	const data = readProbe({ source, width, height });
	if (!data) return false;
	for (let i = 3; i < data.length; i += 16) {
		if ((data[i] ?? 0) > 12) return true;
	}
	return false;
}

const PLATE_ATTR = "data-export-plate";

/**
 * A full-bleed ancestor of a captured `<canvas>` is the plate behind the
 * shader (ShaderAnimation's root is `#000`). Clearing it on the clone keeps
 * that plate from covering the WebGL pixels. Text nodes are smaller than
 * the clip, so their styles stay.
 */
function markCanvasPlates({ node }: { node: HTMLElement }): HTMLElement[] {
	const nodeBox = node.getBoundingClientRect();
	const plates: HTMLElement[] = [];
	if (nodeBox.width < 1 || nodeBox.height < 1) return plates;
	for (const canvas of node.querySelectorAll("canvas")) {
		let parent = canvas.parentElement;
		while (parent && node.contains(parent)) {
			const box = parent.getBoundingClientRect();
			const covers =
				box.width >= nodeBox.width * 0.85 && box.height >= nodeBox.height * 0.85;
			if (covers && !parent.hasAttribute(PLATE_ATTR)) {
				parent.setAttribute(PLATE_ATTR, "true");
				plates.push(parent);
			}
			parent = parent.parentElement;
		}
	}
	return plates;
}

function clearPlate({ plate }: { plate: HTMLElement }): void {
	plate.style.background = "transparent";
	plate.style.backgroundColor = "transparent";
	plate.style.backgroundImage = "none";
	plate.removeAttribute(PLATE_ATTR);
}

function clearMarkedPlates({ element }: { element: HTMLElement }): void {
	if (element.hasAttribute(PLATE_ATTR)) clearPlate({ plate: element });
	for (const plate of element.querySelectorAll(`[${PLATE_ATTR}]`)) {
		if (plate instanceof HTMLElement) clearPlate({ plate });
	}
}

async function rasterizeDom({
	element,
	width,
	height,
	clearBackground,
}: {
	element: HTMLElement;
	width: number;
	height: number;
	clearBackground: boolean;
}): Promise<HTMLCanvasElement | null> {
	const clone = element.cloneNode(true);
	if (!(clone instanceof HTMLElement)) return null;
	for (const canvas of clone.querySelectorAll("canvas")) canvas.remove();
	if (clearBackground) clearMarkedPlates({ element: clone });
	const xhtml = new XMLSerializer().serializeToString(clone);
	const w = Math.max(1, Math.round(width));
	const h = Math.max(1, Math.round(height));
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
		`<foreignObject width="100%" height="100%">` +
		`<div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px">${xhtml}</div>` +
		`</foreignObject></svg>`;
	const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
	try {
		const image = new Image();
		image.src = url;
		await image.decode();
		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		ctx.drawImage(image, 0, 0, w, h);
		return canvas;
	} catch {
		return null;
	} finally {
		URL.revokeObjectURL(url);
	}
}

function cssColorIsVisible({ color }: { color: string }): boolean {
	if (!color || color === "transparent") return false;
	const match = /rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*([\d.]+)\s*)?\)/.exec(color);
	if (!match) return true;
	const alpha = match[1] === undefined ? 1 : Number(match[1]);
	return alpha > 0.004;
}

function paintText({
	ctx,
	style,
	text,
	x,
	y,
	height,
}: {
	ctx: CanvasRenderingContext2D;
	style: CSSStyleDeclaration;
	text: string;
	x: number;
	y: number;
	height: number;
}): void {
	ctx.save();
	ctx.fillStyle = style.color;
	const font = style.font && style.font !== "" ? style.font : `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
	ctx.font = font;
	ctx.textBaseline = "middle";
	ctx.textAlign = "left";
	const spacing = Number.parseFloat(style.letterSpacing);
	const baseline = y + height / 2;
	if (Number.isFinite(spacing) && spacing !== 0 && text.length > 1) {
		let cursor = x;
		for (const char of text) {
			ctx.fillText(char, cursor, baseline);
			cursor += ctx.measureText(char).width + spacing;
		}
	} else {
		ctx.fillText(text, x, baseline);
	}
	ctx.restore();
}

/**
 * Paint a laid-out DOM tree with the 2D context. WebKit can read this;
 * nothing here is an SVG foreignObject or a cross-origin image. Positions
 * come from getBoundingClientRect, so flex/absolute layout matches preview.
 */
function paintDomDirect({
	element,
	skipPlates,
}: {
	element: HTMLElement;
	skipPlates: boolean;
}): HTMLCanvasElement | null {
	const root = element.getBoundingClientRect();
	const width = Math.max(1, Math.round(root.width));
	const height = Math.max(1, Math.round(root.height));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;

	const paintElement = ({ node }: { node: Element }) => {
		if (node instanceof HTMLCanvasElement) return;
		if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) return;
		const style = getComputedStyle(node);
		if (style.display === "none" || style.visibility === "hidden") return;
		const opacity = Number.parseFloat(style.opacity);
		ctx.save();
		if (Number.isFinite(opacity) && opacity < 1) ctx.globalAlpha *= Math.max(0, opacity);
		const rect = node.getBoundingClientRect();
		const x = rect.left - root.left;
		const y = rect.top - root.top;
		const plate = node instanceof HTMLElement && node.hasAttribute(PLATE_ATTR);
		if (!(skipPlates && plate) && rect.width >= 1 && rect.height >= 1 && cssColorIsVisible({ color: style.backgroundColor })) {
			ctx.fillStyle = style.backgroundColor;
			ctx.fillRect(x, y, rect.width, rect.height);
		}
		for (const child of node.childNodes) {
			if (child.nodeType !== Node.TEXT_NODE) continue;
			const text = child.textContent ?? "";
			if (text.trim().length === 0) continue;
			paintText({ ctx, style, text, x, y, height: rect.height });
		}
		for (const child of node.children) paintElement({ node: child });
		ctx.restore();
	};

	paintElement({ node: element });
	return canvas;
}

function activeDurationSeconds({ tracks }: { tracks: SceneTracks }): number {
	let start = Number.POSITIVE_INFINITY;
	let end = 0;
	for (const track of tracks.overlay) {
		if (track.hidden) continue;
		for (const element of track.elements) {
			if (element.type !== "graphic") continue;
			if (!isHtmlTemplateGraphic({ definitionId: element.definitionId })) continue;
			if ("hidden" in element && element.hidden) continue;
			const startSec = mediaTimeToSeconds({ time: element.startTime });
			const durationSec = mediaTimeToSeconds({ time: element.duration });
			start = Math.min(start, startSec);
			end = Math.max(end, startSec + durationSec);
		}
	}
	if (!Number.isFinite(start)) return 0.1;
	return Math.max(0.1, end - start);
}

function blitClip({
	clip,
	source,
	ctx,
}: {
	clip: TemplateClipBox;
	source: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}): void {
	ctx.save();
	// The clip node's own opacity is already in the local raster.
	ctx.translate(clip.left + clip.width / 2, clip.top + clip.height / 2);
	ctx.rotate((clip.rotation * Math.PI) / 180);
	ctx.drawImage(source, -clip.width / 2, -clip.height / 2, clip.width, clip.height);
	ctx.restore();
}

export function createHtmlOverlayPainter({
	tracks,
	durationSeconds,
	width = 1280,
	height = 720,
}: {
	tracks: SceneTracks;
	durationSeconds: number;
	/** Export width. The sample step is chosen from this and the on-screen span. */
	width?: number;
	/** Export height. */
	height?: number;
}): {
	hashAt: (args: { timeSeconds: number }) => string;
	paint: (args: OverlayPaintArgs) => Promise<{ captured: string[]; missed: string[] }>;
	dispose: () => void;
} {
	const templateIds: string[] = [];
	for (const track of tracks.overlay) {
		for (const element of track.elements) {
			if (element.type !== "graphic") continue;
			if (!isHtmlTemplateGraphic({ definitionId: element.definitionId })) continue;
			templateIds.push(element.id);
		}
	}
	const span = Math.min(Math.max(durationSeconds, 0.1), activeDurationSeconds({ tracks }));
	const step = htmlOverlayStepSeconds({ durationSeconds: span, width, height });
	const activeAt = ({ timeSeconds }: { timeSeconds: number }) =>
		clipsAtTime({
			tracks,
			timeSeconds,
			canvasSize: { width: 1, height: 1 },
		}).length > 0;
	if (templateIds.length === 0 || typeof document === "undefined") {
		return {
			hashAt: () => (templateIds.length === 0 ? "" : "no-document"),
			paint: async () => ({
				captured: [],
				missed: typeof document === "undefined" ? templateIds : [],
			}),
			dispose: () => {},
		};
	}

	const restoreContext = installPreserveDrawingBuffer();
	const host = document.createElement("div");
	host.setAttribute("data-html-export-host", "true");
	host.style.position = "fixed";
	host.style.left = "-16000px";
	host.style.top = "0";
	host.style.overflow = "hidden";
	host.style.pointerEvents = "none";
	document.body.appendChild(host);
	const root: Root = createRoot(host);
	let cachedBucket = "";
	let cachedCanvas: HTMLCanvasElement | null = null;
	let cachedMisses: string[] = [];
	let cachedCaptured: string[] = [];

	// Empty when nothing is on screen, so a gap between templates does not
	// force a new PNG. While a template is visible, the bucket advances at
	// 15 fps for the whole on-screen span.
	const hashAt = ({ timeSeconds }: { timeSeconds: number }) =>
		activeAt({ timeSeconds }) ? String(Math.floor(timeSeconds / step)) : "";

	const renderBucket = async ({
		timeSeconds,
		canvasSize,
	}: {
		timeSeconds: number;
		canvasSize: TCanvasSize;
	}): Promise<{ canvas: HTMLCanvasElement; misses: string[]; captured: string[] }> => {
		const clips = clipsAtTime({ tracks, timeSeconds, canvasSize });
		host.style.width = `${canvasSize.width}px`;
		host.style.height = `${canvasSize.height}px`;
		flushSync(() => {
			root.render(
				<TemplateStage clips={clips} canvasWidth={canvasSize.width} canvasHeight={canvasSize.height} />,
			);
		});
		// useEffect (the WebGL render) runs after flushSync. A timeout lets
		// that effect flush, then two frames let the canvas present.
		await new Promise((resolve) => setTimeout(resolve, 0));
		await nextFrame();
		await nextFrame();
		if (document.fonts?.ready) await document.fonts.ready;
		const plate = document.createElement("canvas");
		plate.width = Math.max(1, Math.round(canvasSize.width));
		plate.height = Math.max(1, Math.round(canvasSize.height));
		const plateCtx = plate.getContext("2d");
		const misses: string[] = [];
		const captured: string[] = [];
		if (!plateCtx) return { canvas: plate, misses: clips.map((clip) => clip.id), captured };
		for (const clip of clips) {
			try {
				const node = host.querySelector(`[data-html-template-clip="${clip.id}"]`);
				if (!(node instanceof HTMLElement)) {
					misses.push(clip.id);
					continue;
				}
				const local = document.createElement("canvas");
				const localWidth = Math.max(1, Math.round(clip.width));
				const localHeight = Math.max(1, Math.round(clip.height));
				local.width = localWidth;
				local.height = localHeight;
				const localCtx = local.getContext("2d");
				if (!localCtx) {
					misses.push(clip.id);
					continue;
				}
				const nodeBox = node.getBoundingClientRect();
				const canvases = [...node.querySelectorAll("canvas")].filter(
					(canvas) => canvas.width >= 1 && canvas.height >= 1,
				);
				let drewCanvas = false;
				for (const canvas of canvases) {
					// Probing reads pixels. A tainted canvas returns no probe
					// and is not drawn, so it cannot mark the export canvas dirty.
					if (!canvasHasPixels({ source: canvas, width: canvas.width, height: canvas.height })) continue;
					const box = canvas.getBoundingClientRect();
					if (box.width < 1 || box.height < 1) continue;
					try {
						localCtx.drawImage(
							canvas,
							box.left - nodeBox.left,
							box.top - nodeBox.top,
							box.width,
							box.height,
						);
						drewCanvas = true;
					} catch {
						// This canvas stays out. Another one in the clip may still draw.
					}
				}
				// A template that owns a canvas (three.js, a 2D effect) is only
				// captured when that canvas has pixels. The CSS plate behind it
				// is not a substitute — otherwise a blank shader exports as a
				// black rectangle and never shows up as an omission.
				if (canvases.length > 0 && !drewCanvas) {
					misses.push(clip.id);
					continue;
				}
				const plates = drewCanvas ? markCanvasPlates({ node }) : [];
				let dom: HTMLCanvasElement | null = null;
				try {
					if (!foreignObjectTaintsCanvas()) {
						dom = await rasterizeDom({
							element: node,
							width: clip.width,
							height: clip.height,
							clearBackground: drewCanvas,
						});
						if (dom && !canvasHasPixels({ source: dom, width: dom.width, height: dom.height })) dom = null;
					}
					if (!dom) {
						dom = paintDomDirect({ element: node, skipPlates: drewCanvas });
						if (dom && !canvasHasPixels({ source: dom, width: dom.width, height: dom.height })) dom = null;
					}
				} finally {
					for (const plateNode of plates) plateNode.removeAttribute(PLATE_ATTR);
				}
				if (dom) {
					try {
						localCtx.drawImage(dom, 0, 0, localWidth, localHeight);
					} catch {
						dom = null;
					}
				}
				if (!drewCanvas && !dom) {
					misses.push(clip.id);
					continue;
				}
				blitClip({ clip, source: local, ctx: plateCtx });
				captured.push(clip.id);
			} catch {
				misses.push(clip.id);
			}
		}
		return { canvas: plate, misses, captured };
	};

	return {
		hashAt,
		paint: async ({ ctx, timeSeconds, canvasSize }) => {
			try {
				const bucket = hashAt({ timeSeconds });
				if (cachedBucket !== bucket || !cachedCanvas) {
					const rendered = await renderBucket({ timeSeconds, canvasSize });
					cachedBucket = bucket;
					cachedCanvas = rendered.canvas;
					cachedMisses = rendered.misses;
					cachedCaptured = rendered.captured;
				}
				if (cachedCanvas && canvasReadAllowed({ canvas: cachedCanvas })) {
					ctx.drawImage(cachedCanvas, 0, 0);
				} else {
					return { missed: templateIds, captured: [] };
				}
				return { missed: cachedMisses, captured: cachedCaptured };
			} catch {
				// The whole painter failed. Every template stays on the
				// omission list; stickers and shapes already on the overlay
				// canvas are left alone.
				return { missed: templateIds, captured: [] };
			}
		},
		dispose: () => {
			root.unmount();
			host.remove();
			restoreContext();
		},
	};
}
