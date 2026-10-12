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
 *   - the rest of the tree (CSS, text) is captured through an SVG
 *     `foreignObject`
 *
 * A clip that produces no visible pixels is returned as uncaptured. The
 * omission list names it. Samples are capped (8 fps, 24 unique frames over
 * the whole timeline) so a long animation does not hold a PNG per output
 * frame in memory.
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

const MAX_HTML_FPS = 8;
const MAX_HTML_FRAMES = 24;

export function htmlOverlayStepSeconds({ durationSeconds }: { durationSeconds: number }): number {
	const duration = Math.max(durationSeconds, 0.1);
	return Math.max(1 / MAX_HTML_FPS, duration / MAX_HTML_FRAMES);
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

function canvasHasPixels({
	source,
	width,
	height,
}: {
	source: CanvasImageSource;
	width: number;
	height: number;
}): boolean {
	const probe = document.createElement("canvas");
	probe.width = Math.max(1, Math.min(64, Math.round(width)));
	probe.height = Math.max(1, Math.min(64, Math.round(height)));
	const ctx = probe.getContext("2d");
	if (!ctx) return false;
	try {
		ctx.drawImage(source, 0, 0, probe.width, probe.height);
	} catch {
		return false;
	}
	const data = ctx.getImageData(0, 0, probe.width, probe.height).data;
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

function paintClip({
	clip,
	node,
	ctx,
	dom,
	drewCanvas,
}: {
	clip: TemplateClipBox;
	node: HTMLElement;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	dom: HTMLCanvasElement | null;
	drewCanvas: boolean;
}): void {
	ctx.save();
	ctx.globalAlpha = clip.opacity;
	ctx.translate(clip.left + clip.width / 2, clip.top + clip.height / 2);
	ctx.rotate((clip.rotation * Math.PI) / 180);
	if (drewCanvas) {
		for (const canvas of node.querySelectorAll("canvas")) {
			const box = canvas.getBoundingClientRect();
			const nodeBox = node.getBoundingClientRect();
			if (box.width < 1 || box.height < 1) continue;
			try {
				ctx.drawImage(
					canvas,
					box.left - nodeBox.left - clip.width / 2,
					box.top - nodeBox.top - clip.height / 2,
					box.width,
					box.height,
				);
			} catch {
				// A tainted canvas is reported by the pixel check below.
			}
		}
	}
	if (dom) ctx.drawImage(dom, -clip.width / 2, -clip.height / 2, clip.width, clip.height);
	ctx.restore();
}

export function createHtmlOverlayPainter({
	tracks,
	durationSeconds,
}: {
	tracks: SceneTracks;
	durationSeconds: number;
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
	const step = htmlOverlayStepSeconds({ durationSeconds });
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
	// force a new PNG. While a template is visible, the bucket is the sample
	// key (8 fps, 24 frames across the timeline).
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
		const plate = document.createElement("canvas");
		plate.width = Math.max(1, Math.round(canvasSize.width));
		plate.height = Math.max(1, Math.round(canvasSize.height));
		const plateCtx = plate.getContext("2d");
		const misses: string[] = [];
		const captured: string[] = [];
		if (!plateCtx) return { canvas: plate, misses: clips.map((clip) => clip.id), captured };
		for (const clip of clips) {
			const node = host.querySelector(`[data-html-template-clip="${clip.id}"]`);
			if (!(node instanceof HTMLElement)) {
				misses.push(clip.id);
				continue;
			}
			const canvases = [...node.querySelectorAll("canvas")].filter(
				(canvas) => canvas.width >= 1 && canvas.height >= 1,
			);
			let drewCanvas = false;
			for (const canvas of canvases) {
				if (canvasHasPixels({ source: canvas, width: canvas.width, height: canvas.height })) {
					drewCanvas = true;
					break;
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
				dom = await rasterizeDom({
					element: node,
					width: clip.width,
					height: clip.height,
					clearBackground: drewCanvas,
				});
			} finally {
				for (const plate of plates) plate.removeAttribute(PLATE_ATTR);
			}
			const domVisible = dom ? canvasHasPixels({ source: dom, width: dom.width, height: dom.height }) : false;
			if (!drewCanvas && !domVisible) {
				misses.push(clip.id);
				continue;
			}
			paintClip({ clip, node, ctx: plateCtx, dom: domVisible ? dom : null, drewCanvas });
			captured.push(clip.id);
		}
		return { canvas: plate, misses, captured };
	};

	return {
		hashAt,
		paint: async ({ ctx, timeSeconds, canvasSize }) => {
			const bucket = hashAt({ timeSeconds });
			if (cachedBucket !== bucket || !cachedCanvas) {
				const rendered = await renderBucket({ timeSeconds, canvasSize });
				cachedBucket = bucket;
				cachedCanvas = rendered.canvas;
				cachedMisses = rendered.misses;
				cachedCaptured = rendered.captured;
			}
			ctx.drawImage(cachedCanvas, 0, 0);
			return { missed: cachedMisses, captured: cachedCaptured };
		},
		dispose: () => {
			root.unmount();
			host.remove();
			restoreContext();
		},
	};
}
