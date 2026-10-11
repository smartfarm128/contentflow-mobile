/**
 * Live preview rendering for the mobile editor — closes the "chrome-only
 * placeholder, does not render frame content" gap PreviewStage's own header
 * disclosed (and the founder hit on device: playback ran over a black
 * preview, 2026-08-18).
 *
 * Same architecture as apps/web's preview (apps/web/src/preview/components/
 * index.tsx, RenderTreeController + PreviewCanvas), deliberately minus the
 * web-only chrome (zoom/pan viewport, overlay handles, context menus):
 *   1. a scene-sync effect maps live engine state -> buildScene() ->
 *      editor.renderer.setRenderTree()
 *   2. a CanvasRenderer draws the tree into its output canvas (wgpu/wasm
 *      compositor underneath — WebGPU preferred, WebGL2 fallback)
 *   3. a rAF loop renders the frame under the playhead, skipping when
 *      neither the frame index nor the tree changed (same guard as web).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	NO_SNAP,
	SNAP_CAPTURE_PX,
	SNAP_RELEASE_PX,
	pulseSnapHaptic,
	snapToCenterAxes,
	type AxisSnapFlags,
} from "../../editor/axis-snap";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { TICKS_PER_SECOND, type MediaTime } from "@kneecap/editor-core";
import { useEditor } from "@kneecap/editor-core/react";
import { isVisualElement, type TimelineElement } from "@kneecap/editor-core/timeline";
import type { ParamValues } from "@kneecap/editor-core/params";
import {
	clipLocalTime,
	hasClipKeyframes,
	resolveClipValuesAtTime,
	snapLocalTimeToFrame,
	upsertClipAnimationValues,
	type ClipKeyframeValues,
} from "../../editor/keyframes";
import { useSelectedElement } from "../../editor/use-live-editor";
import { CanvasRenderer } from "@kneecap/editor-core/services/renderer/canvas-renderer";
import { buildScene } from "@kneecap/editor-core/services/renderer/scene-builder";
import type { RootNode } from "@kneecap/editor-core/services/renderer/nodes/root-node";
import { initializeGpu } from "opencut-wasm";
import type { ElementRef } from "@kneecap/editor-core/timeline";
import { getVisibleElementsWithBounds, type ElementBounds, type ElementWithBounds } from "@kneecap/editor-core/preview/element-bounds";
import { selectElement } from "../../editor/actions";
import { isHtmlTemplateGraphic } from "../../motion-templates/engine-bridge";

/** Same contract as apps/web's `initializeGpuRenderer()`: init once per
 *  process, NEVER reject — a GPU-less environment degrades (the compositor
 *  falls back off the wgpu path) instead of crashing. Constructing
 *  `CanvasRenderer` before this resolves was CRITICAL finding #1 of the
 *  2026-08-18 test sweep: `initializeGpu()` had never been called on the
 *  mobile shell, the first render threw "GPU context not initialized"
 *  inside React render, and the entire app unmounted to a black screen. */
let gpuInitPromise: Promise<boolean> | null = null;
export function ensurePreviewGpu(): Promise<boolean> {
	return ensureGpu();
}
function ensureGpu(): Promise<boolean> {
	if (!gpuInitPromise) {
		gpuInitPromise = initializeGpu()
			.then(() => true)
			.catch((error: unknown) => {
				console.warn(
					`GPU renderer unavailable: ${error instanceof Error ? error.message : String(error)}`,
				);
				return false;
			});
	}
	return gpuInitPromise;
}


/** Smallest a motion-graphic template may be pinched/dragged to, as a
 *  fraction of the canvas. The largest is 1: at scale 1 a template exactly
 *  fills the frame, so anything bigger just gets cropped. */
const TEMPLATE_MIN_SCALE = 0.15;

function isTemplateElement(element: TimelineElement): boolean {
	return element.type === "graphic" && isHtmlTemplateGraphic({ definitionId: element.definitionId });
}

/** Engine bounds for a graphic assume a square 512px source contain-fitted
 *  to the canvas; an HTML template is drawn at canvas width x height times
 *  its scale (HtmlMotionLayer). Stretch the square to the drawn box so taps
 *  and the selection frame match the pixels. */
function templateBounds({
	bounds,
	canvasWidth,
	canvasHeight,
}: {
	bounds: ElementBounds;
	canvasWidth: number;
	canvasHeight: number;
}): ElementBounds {
	const side = Math.min(canvasWidth, canvasHeight);
	return {
		...bounds,
		width: (bounds.width * canvasWidth) / side,
		height: (bounds.height * canvasHeight) / side,
	};
}

function pointInRotatedBounds(px: number, py: number, bounds: ElementBounds): boolean {
	const rad = (-bounds.rotation * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const dx = px - bounds.cx;
	const dy = py - bounds.cy;
	const localX = dx * cos - dy * sin;
	const localY = dx * sin + dy * cos;
	return Math.abs(localX) <= bounds.width / 2 && Math.abs(localY) <= bounds.height / 2;
}
export function PreviewRenderer({
	onEditText,
	onEditCaption,
}: {
	onEditText?: (ref: ElementRef) => void;
	onEditCaption?: (ref: ElementRef) => void;
} = {}) {
	const editor = useEditor();
	const [gpuReady, setGpuReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		void ensureGpu().then((ok) => {
			if (cancelled) return;
			editor.renderer.setDegraded(!ok);
			setGpuReady(true);
		});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- editor is the process singleton.
	}, []);

	if (!gpuReady) return null;
	return <PreviewRendererInner onEditText={onEditText} onEditCaption={onEditCaption} />;
}

function PreviewRendererInner({
	onEditText,
	onEditCaption,
}: {
	onEditText?: (ref: ElementRef) => void;
	onEditCaption?: (ref: ElementRef) => void;
}) {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());
	// Render tracks = preview-overlay tracks + main-track transitions applied
	// (memoized in the manager, so this snapshot is referentially stable).
	const tracks = useEditor(
		(e) => e.timeline.getRenderTracks() ?? e.scenes.getActiveScene().tracks,
	);
	const mediaAssets = useEditor((e) => e.media.getAssets());
	const renderTree = useEditor((e) => e.renderer.getRenderTree());

	const { width, height } = activeProject.settings.canvasSize;
	const background = activeProject.settings.background;
	const fps = activeProject.settings.fps;

	// Scene sync — rebuild the render tree whenever timeline/media/canvas
	// state changes. Reference identity on `tracks`/`mediaAssets` is the
	// engine's own change signal (managers notify with fresh snapshots).
	useEffect(() => {
		const duration = editor.timeline.getTotalDuration();
		const tree = buildScene({
			tracks,
			mediaAssets,
			duration,
			canvasSize: { width, height },
			background,
			isPreview: true,
		});
		editor.renderer.setRenderTree({ renderTree: tree });
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `editor` is the process-wide singleton; the deps that matter are the state snapshots.
	}, [tracks, mediaAssets, background, width, height]);

	const renderer = useMemo(
		() => new CanvasRenderer({ width, height, fps }),
		[width, height, fps],
	);

	const mountRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const mount = mountRef.current;
		if (!mount) return;
		const outputCanvas = renderer.getOutputCanvas();
		outputCanvas.style.display = "block";
		outputCanvas.style.width = "100%";
		outputCanvas.style.height = "100%";
		mount.appendChild(outputCanvas);
		return () => {
			if (outputCanvas.parentElement === mount) {
				mount.removeChild(outputCanvas);
			}
		};
	}, [renderer]);

	const lastFrameRef = useRef(-1);
	const lastTreeRef = useRef<RootNode | null>(null);
	const renderingRef = useRef(false);

	const renderFrame = useCallback(() => {
		if (!renderTree || renderingRef.current) return;
		const renderTime = Math.min(
			editor.playback.getCurrentTime(),
			editor.timeline.getLastFrameTime(),
		);
		const ticksPerFrame = Math.round(
			(TICKS_PER_SECOND * renderer.fps.denominator) / renderer.fps.numerator,
		);
		const frame = Math.floor(renderTime / ticksPerFrame);
		if (frame === lastFrameRef.current && renderTree === lastTreeRef.current) return;
		renderingRef.current = true;
		lastFrameRef.current = frame;
		lastTreeRef.current = renderTree;
		renderer
			.render({ node: renderTree, time: renderTime })
			.catch((error: unknown) => {
				// A single bad frame must not kill the loop; log and move on.
				console.error("preview render failed:", error);
			})
			.finally(() => {
				renderingRef.current = false;
			});
	}, [editor.playback, editor.timeline, renderTree, renderer]);

	useEffect(() => {
		let rafId: number;
		const tick = () => {
			renderFrame();
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	}, [renderFrame]);

	const gestureHandlers = usePreviewTransformGesture({
		mountRef,
		canvasWidth: width,
		canvasHeight: height,
		tracks,
		mediaAssets,
		onEditText,
		onEditCaption,
	});

	const { snapGuides, startResize, ...pointerHandlers } = gestureHandlers;

	// Visible edges for a selected motion-graphic template — the frame the
	// user resizes against (founder, 2026-09-30: "soooo hard to resize it to
	// fit on the screen"). Read from the render tracks so it follows the
	// live drag preview, not the committed params.
	const [selectedRef] = useSelectedElement();
	const templateFrame = useMemo(() => {
		if (!selectedRef) return null;
		const hit = getVisibleElementsWithBounds({
			tracks,
			currentTime: editor.playback.getCurrentTime(),
			canvasSize: { width, height },
			mediaAssets,
		}).find((item: ElementWithBounds) => item.elementId === selectedRef.elementId);
		if (!hit || !isTemplateElement(hit.element)) return null;
		return templateBounds({ bounds: hit.bounds, canvasWidth: width, canvasHeight: height });
		// eslint-disable-next-line react-hooks/exhaustive-deps -- editor is the process singleton; tracks change on every drag frame.
	}, [selectedRef, tracks, mediaAssets, width, height]);

	return (
		<div
			ref={mountRef}
			className="cc-preview-stage__render"
			style={{ touchAction: "none" }}
			{...pointerHandlers}
		>
			{/* The detent has to be SEEN, not just felt: without a line on
			    screen a snapped element just looks like it stopped tracking
			    the finger. Drawn only while a drag holds the axis, and marked
			    inert so it can never intercept the gesture that spawned it. */}
			{snapGuides.x && (
				<div
					className="cc-preview-guide cc-preview-guide--v"
					aria-hidden="true"
				/>
			)}
			{snapGuides.y && (
				<div
					className="cc-preview-guide cc-preview-guide--h"
					aria-hidden="true"
				/>
			)}
			{templateFrame && (
				<div
					className="cc-preview-frame"
					style={{
						left: `${((templateFrame.cx - templateFrame.width / 2) / width) * 100}%`,
						top: `${((templateFrame.cy - templateFrame.height / 2) / height) * 100}%`,
						width: `${(templateFrame.width / width) * 100}%`,
						height: `${(templateFrame.height / height) * 100}%`,
						transform: templateFrame.rotation ? `rotate(${templateFrame.rotation}deg)` : undefined,
					}}
				>
					{(["nw", "ne", "sw", "se"] as const).map((corner) => (
						<div
							key={corner}
							className={`cc-preview-frame__handle cc-preview-frame__handle--${corner}`}
							onPointerDown={startResize}
							aria-label="Resize"
							role="slider"
							aria-valuenow={Math.round((templateFrame.width / width) * 100)}
							tabIndex={-1}
						/>
					))}
				</div>
			)}
		</div>
	);
}

/**
 * SELECTION-GATED manipulation on the preview (round 23, founder: "maybe
 * this is bc video is hyper sensitive, how about these things are only
 * adjustable if they are selected in the timeline") — this supersedes
 * round 18's direct-grab hit-testing, which made the full-frame video
 * swallow every touch and left text/captions practically unreachable.
 *
 * The rule is one line: preview drags and pinches apply to the element
 * currently selected in the TIMELINE, and only then. One finger moves
 * (`transform.positionX/Y`, canvas units), two fingers pinch to scale
 * (`transform.scaleX/Y`) anywhere on the preview. Nothing selected →
 * touches do nothing at all (stage tap-to-play was REMOVED 2026-08-22:
 * the toggle also fired on the pointer-up ending a gesture — releasing a
 * caption resize started playback; play/pause is the PlaybackBar button
 * only).
 *
 * CAPTIONS MOVE AS ONE (round 23, founder: "if i can move one caption it
 * should move all of it around to same position and sizing — sync all
 * caption sizing and positioning"): when the selected element is a
 * caption, the session fans the same transform out to EVERY caption
 * element, and the commit lands them all in one undo step.
 *
 * Mid-gesture frames ride the engine's preview overlay
 * (`timeline.previewElements`); release commits ONE undoable
 * TracksSnapshotCommand (`timeline.commitPreview`). Tap semantics: only
 * real drags swallow the up-event; plain taps bubble but nothing above
 * listens anymore (see the stage-tap removal note in the header).
 */
const DRAG_SLOP_PX = 6;

/** One element a preview gesture writes to: the selection, or every caption
 *  when a caption is selected (they move as one). Round 47: a target that
 *  already has clip keyframes is `keyed` — the gesture then writes a
 *  keyframe at the playhead (CapCut's auto-add once a clip is keyed) instead
 *  of the base params, which the animation would override anyway. */
interface GestureTarget {
	trackId: string;
	elementId: string;
	/** PRE-gesture element: every frame's params/animations build from it. */
	element: TimelineElement;
	keyed: boolean;
	/** Frame-snapped clip-local playhead at gesture start. */
	localTime: MediaTime;
	/** The keyframe group's values at `localTime` — the drag anchors here
	 *  (so a keyed clip is grabbed where it IS at this time, not at its base
	 *  params) and rotate/opacity ride along unchanged so the keyframe the
	 *  drag writes is complete. */
	baseValues: ClipKeyframeValues;
}

function usePreviewTransformGesture({
	mountRef,
	canvasWidth,
	canvasHeight,
	tracks,
	mediaAssets,
	onEditText,
	onEditCaption,
}: {
	mountRef: RefObject<HTMLDivElement | null>;
	canvasWidth: number;
	canvasHeight: number;
	tracks: any;
	mediaAssets: any;
	onEditText?: (ref: ElementRef) => void;
	onEditCaption?: (ref: ElementRef) => void;
}) {
	const editor = useEditor();
	const [selectedRef, selectedElement] = useSelectedElement();
	const tapRef = useRef<{ time: number; x: number; y: number } | null>(null);
	const lastTapTimeRef = useRef<number>(0);
	/** Which centre lines to draw. React state (not the session ref) because
	 *  this one piece of gesture state has to reach the render. */
	const [snapGuides, setSnapGuides] = useState<AxisSnapFlags>(NO_SNAP);

	// Anchor values are the element's transform at the LAST pointer-topology
	// change (gesture start, finger added, finger lifted); deltas are always
	// measured from the geometry captured at that same moment, so adding or
	// removing a finger never makes the element jump.
	const sessionRef = useRef<{
		pointers: Map<number, { x: number; y: number }>;
		startCentroid: { x: number; y: number };
		startDistance: number | null;
		anchorPositionX: number;
		anchorPositionY: number;
		anchorScaleX: number;
		anchorScaleY: number;
		dragging: boolean;
		/** Which axes are currently held by the centre-line detent. Lives on
		 *  the session because the snap decision is hysteretic: it depends on
		 *  whether the axis was ALREADY snapped a frame ago. */
		snapped: AxisSnapFlags;
		/** The selection alone, or every caption in the scene when a caption
		 *  is selected — the shared transform fans out to all of them per
		 *  frame, each written its own way (params vs keyframe). */
		targets: GestureTarget[];
		/** Corner-handle resize: one finger scales about this point (the
		 *  element's on-screen centre) instead of moving the element. */
		pivot: { x: number; y: number } | null;
		/** Motion-graphic template: keep it between TEMPLATE_MIN_SCALE and
		 *  full-frame, and fully on the canvas. */
		fitToCanvas: boolean;
	} | null>(null);

	const centroidAndDistance = (pointers: Map<number, { x: number; y: number }>) => {
		const points = [...pointers.values()];
		const centroid = {
			x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
			y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
		};
		const distance =
			points.length >= 2
				? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
				: null;
		return { centroid, distance };
	};

	const pxToCanvas = () => {
		const rect = mountRef.current?.getBoundingClientRect();
		// The mount is rendered at the canvas's own aspect ratio (PreviewStage
		// sizes it), so one uniform factor maps CSS px -> canvas units.
		return rect && rect.width > 0 ? canvasWidth / rect.width : 0;
	};

	type Session = NonNullable<typeof sessionRef.current>;

	/**
	 * The element's effective transform under the current pointer deltas,
	 * with the centre-axis detent applied.
	 *
	 * The snap is applied HERE rather than at commit time on purpose: the
	 * whole point is that the element visibly leaves the finger and sits on
	 * the axis during the drag. Snapping only on release would land in the
	 * same place while showing the user nothing.
	 */
	/** Pointer geometry for a session — for a corner-handle resize the
	 *  centroid is pinned (no move) and the distance is finger-to-pivot. */
	const sessionGeometry = (session: Session) => {
		if (!session.pivot) return centroidAndDistance(session.pointers);
		const [point] = [...session.pointers.values()];
		return {
			centroid: session.startCentroid,
			distance: point ? Math.hypot(point.x - session.pivot.x, point.y - session.pivot.y) : null,
		};
	};

	const currentTransform = (session: Session) => {
		const scale = pxToCanvas();
		const { centroid, distance } = sessionGeometry(session);
		const factor =
			distance !== null && session.startDistance && session.startDistance > 0
				? distance / session.startDistance
				: 1;
		const rawX = session.anchorPositionX + (centroid.x - session.startCentroid.x) * scale;
		const rawY = session.anchorPositionY + (centroid.y - session.startCentroid.y) * scale;
		// Thresholds are authored in CSS px and converted with the same
		// px -> canvas factor the drag itself uses, so the detent is the same
		// physical size on any preview size or project resolution.
		const snap = snapToCenterAxes({
			x: rawX,
			y: rawY,
			wasSnapped: session.snapped,
			capture: SNAP_CAPTURE_PX * scale,
			release: SNAP_RELEASE_PX * scale,
		});
		const next = {
			positionX: snap.x,
			positionY: snap.y,
			scaleX: session.anchorScaleX * factor,
			scaleY: session.anchorScaleY * factor,
			snapped: snap.snapped,
		};
		if (!session.fitToCanvas) return next;
		// Boundaries: never bigger than the frame, never partly off it.
		const clamp = ({ v, lo, hi }: { v: number; lo: number; hi: number }) => Math.min(hi, Math.max(lo, v));
		const scaleX = clamp({ v: next.scaleX, lo: TEMPLATE_MIN_SCALE, hi: 1 });
		const scaleY = clamp({ v: next.scaleY, lo: TEMPLATE_MIN_SCALE, hi: 1 });
		const maxX = (canvasWidth * (1 - scaleX)) / 2;
		const maxY = (canvasHeight * (1 - scaleY)) / 2;
		return {
			...next,
			scaleX,
			scaleY,
			positionX: clamp({ v: next.positionX, lo: -maxX, hi: maxX }),
			positionY: clamp({ v: next.positionY, lo: -maxY, hi: maxY }),
		};
	};

	/** Re-anchor after a finger joins/leaves: bank the current transform and
	 *  restart deltas from the new pointer geometry. */
	const reanchor = (session: Session) => {
		const current = currentTransform(session);
		session.anchorPositionX = current.positionX;
		session.anchorPositionY = current.positionY;
		session.anchorScaleX = current.scaleX;
		session.anchorScaleY = current.scaleY;
		// A second finger turns a corner-handle resize into a normal pinch.
		if (session.pivot && session.pointers.size > 1) session.pivot = null;
		const { centroid, distance } = sessionGeometry(session);
		session.startCentroid = centroid;
		session.startDistance = distance;
	};

	const applySessionUpdate = () => {
		const session = sessionRef.current;
		if (!session || session.pointers.size === 0 || pxToCanvas() === 0) return;
		const current = currentTransform(session);
		// Feedback fires on the RISING edge only — a tick every frame while
		// the element rides the line would be a buzz, not a detent.
		if (
			(current.snapped.x && !session.snapped.x) ||
			(current.snapped.y && !session.snapped.y)
		) {
			pulseSnapHaptic();
		}
		session.snapped = current.snapped;
		setSnapGuides(current.snapped);
		const transformPatch: ParamValues = {
			"transform.positionX": current.positionX,
			"transform.positionY": current.positionY,
			"transform.scaleX": current.scaleX,
			"transform.scaleY": current.scaleY,
		};
		editor.timeline.previewElements({
			updates: session.targets.map((t) => ({
				trackId: t.trackId,
				elementId: t.elementId,
				updates: t.keyed
					? {
							// Auto-keyframe: the whole group at the playhead, built
							// from the PRE-gesture animations so re-writing the same
							// time every frame replaces one key instead of stacking.
							animations: upsertClipAnimationValues({
								element: t.element,
								localTime: t.localTime,
								values: {
									...t.baseValues,
									"transform.positionX": current.positionX,
									"transform.positionY": current.positionY,
									"transform.scaleX": current.scaleX,
									"transform.scaleY": current.scaleY,
								},
							}),
						}
					: { params: { ...t.element.params, ...transformPatch } },
			})),
		});
	};

	const endSession = (commit: boolean) => {
		const session = sessionRef.current;
		if (!session) return null;
		sessionRef.current = null;
		setSnapGuides(NO_SNAP);
		if (session.dragging && commit) {
			editor.timeline.commitPreview();
		} else if (session.dragging) {
			editor.timeline.discardPreview();
		}
		return session;
	};

	/** Snapshot one element as a gesture target at the current playhead. */
	const makeTarget = ({ trackId, element }: { trackId: string; element: TimelineElement }): GestureTarget => {
		const localTime = snapLocalTimeToFrame({
			localTime: clipLocalTime({ element, timelineTime: editor.playback.getCurrentTime() }),
			fps: editor.project.getActive().settings.fps,
			duration: element.duration,
		});
		return {
			trackId,
			elementId: element.id,
			element,
			keyed: hasClipKeyframes({ animations: element.animations }),
			localTime,
			baseValues: resolveClipValuesAtTime({ element, localTime }),
		};
	};

	/** All caption elements in the active scene — the "captions move as one"
	 *  fan-out list. */
	const collectCaptionFanout = (): GestureTarget[] => {
		const tracks = editor.scenes.getActiveScene().tracks;
		const out: GestureTarget[] = [];
		for (const track of tracks.overlay) {
			if (track.type !== "caption") continue;
			for (const element of track.elements) {
				if (element.type === "caption") {
					out.push(makeTarget({ trackId: track.id, element }));
				}
			}
		}
		return out;
	};

	const openSession = ({
		pointers,
		element,
		target,
		isCaption,
		pivot = null,
	}: {
		pointers: Map<number, { x: number; y: number }>;
		element: TimelineElement;
		target: { trackId: string; elementId: string };
		isCaption: boolean;
		pivot?: { x: number; y: number } | null;
	}) => {
		const { centroid, distance: pinchDistance } = centroidAndDistance(pointers);
		const [first] = [...pointers.values()];
		const distance = pivot && first ? Math.hypot(first.x - pivot.x, first.y - pivot.y) : pinchDistance;
		const targets = isCaption ? collectCaptionFanout() : [];
		if (!targets.some((t) => t.elementId === target.elementId)) {
			targets.unshift(makeTarget({ trackId: target.trackId, element }));
		}
		const primary = targets.find((t) => t.elementId === target.elementId) ?? targets[0];
		// Anchor on the RESOLVED values: for a keyed clip that is where the
		// element is at the playhead (grabbing it must not snap it back to its
		// base params); for an un-keyed clip it equals the params/defaults.
		sessionRef.current = {
			pointers,
			startCentroid: centroid,
			startDistance: distance,
			anchorPositionX: primary.baseValues["transform.positionX"],
			anchorPositionY: primary.baseValues["transform.positionY"],
			anchorScaleX: primary.baseValues["transform.scaleX"],
			anchorScaleY: primary.baseValues["transform.scaleY"],
			dragging: false,
			snapped: NO_SNAP,
			targets,
			pivot,
			fitToCanvas: isTemplateElement(element),
		};
	};

	const selectionIsManipulable =
		selectedRef !== null &&
		selectedElement !== null &&
		isVisualElement(selectedElement);

	return {
		snapGuides,
		/** Corner handle of the selection frame: one-finger resize about the
		 *  element's centre. */
		startResize: (event: ReactPointerEvent<HTMLDivElement>) => {
			event.stopPropagation();
			if (sessionRef.current || !selectedRef || !selectedElement) return;
			const frame = event.currentTarget.parentElement?.getBoundingClientRect();
			if (!frame) return;
			const point = { x: event.clientX, y: event.clientY };
			openSession({
				pointers: new Map([[event.pointerId, point]]),
				element: selectedElement,
				target: selectedRef,
				isCaption: false,
				pivot: { x: frame.left + frame.width / 2, y: frame.top + frame.height / 2 },
			});
			const session = sessionRef.current as Session | null;
			if (session) session.dragging = true;
			try {
				mountRef.current?.setPointerCapture(event.pointerId);
			} catch {
				// Capture is an optimization; moves still bubble to the mount.
			}
		},
		onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
			tapRef.current = { time: Date.now(), x: event.clientX, y: event.clientY };
			const point = { x: event.clientX, y: event.clientY };
			const existing = sessionRef.current;
			if (existing) {
				existing.pointers.set(event.pointerId, point);
				reanchor(existing);
				return;
			}

			// Selection-gated: a touch only manipulates the element selected
			// in the timeline. No selection → the touch is fully inert (the
			// stage has no tap handler anymore — see the header note).
			if (selectionIsManipulable && selectedRef && selectedElement) {
				openSession({
					pointers: new Map([[event.pointerId, point]]),
					element: selectedElement,
					target: selectedRef,
					isCaption: selectedElement.type === "caption",
				});
			}
		},
		onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
			const session = sessionRef.current;
			if (!session || !session.pointers.has(event.pointerId)) return;
			session.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
			if (!session.dragging) {
				const { centroid } = centroidAndDistance(session.pointers);
				const moved = Math.hypot(
					centroid.x - session.startCentroid.x,
					centroid.y - session.startCentroid.y,
				);
				if (moved < DRAG_SLOP_PX && session.pointers.size < 2) return;
				session.dragging = true;
				try {
					event.currentTarget.setPointerCapture(event.pointerId);
				} catch {
					// Defensive: an invalid/stale pointerId (synthetic events,
					// odd webview states) must not kill the drag — capture is
					// an optimization, not a correctness requirement.
				}
			}
			applySessionUpdate();
		},
		onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => {
			const tap = tapRef.current;
			tapRef.current = null;
			if (tap) {
				const elapsed = Date.now() - tap.time;
				const moved = Math.hypot(event.clientX - tap.x, event.clientY - tap.y);
				if (elapsed < 350 && moved < DRAG_SLOP_PX) {
					const mount = mountRef.current;
					if (mount) {
						const rect = mount.getBoundingClientRect();
						const canvasX = ((event.clientX - rect.left) / rect.width) * canvasWidth;
						const canvasY = ((event.clientY - rect.top) / rect.height) * canvasHeight;
						const currentTime = editor.playback.getCurrentTime();
						const visibleWithBounds = getVisibleElementsWithBounds({
							tracks,
							currentTime,
							canvasSize: { width: canvasWidth, height: canvasHeight },
							mediaAssets,
						});
						const hit = visibleWithBounds.find((item: ElementWithBounds) =>
							pointInRotatedBounds(
								canvasX,
								canvasY,
								isTemplateElement(item.element)
									? templateBounds({ bounds: item.bounds, canvasWidth, canvasHeight })
									: item.bounds,
							),
						);
						if (hit) {
							const isAlreadySelected = selectedRef?.elementId === hit.elementId;
							const isDoubleTap = Date.now() - lastTapTimeRef.current < 350;
							lastTapTimeRef.current = Date.now();

							selectElement({ editor, ref: { trackId: hit.trackId, elementId: hit.elementId } });

							if (hit.element.type === "text" && (isAlreadySelected || isDoubleTap)) {
								onEditText?.({ trackId: hit.trackId, elementId: hit.elementId });
							} else if (hit.element.type === "caption" && (isAlreadySelected || isDoubleTap)) {
								onEditCaption?.({ trackId: hit.trackId, elementId: hit.elementId });
							}
							event.stopPropagation();
							endSession(false);
							return;
						} else {
							selectElement({ editor, ref: null });
						}
					}
				}
			}

			const session = sessionRef.current;
			if (!session || !session.pointers.has(event.pointerId)) return;
			session.pointers.delete(event.pointerId);
			if (session.pointers.size > 0) {
				reanchor(session);
				return;
			}
			const ended = endSession(true);
			if (ended?.dragging) {
				event.stopPropagation();
			}
		},
		onPointerCancel: () => {
			endSession(false);
		},
	};
}
