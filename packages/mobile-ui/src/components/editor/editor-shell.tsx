import { useEffect, useMemo, useState } from "react";
import { TICKS_PER_SECOND, type EditorCore, type NativeImportProgress } from "@kneecap/editor-core";
import { cn } from "../../lib/cn";
import { isVisualElement, type ElementRef, type TimelineElement, type VisualElement } from "@kneecap/editor-core/timeline";
import { mediaTime, mediaTimeToSeconds, type MediaTime } from "@kneecap/editor-core/wasm";
import { TopBar } from "./top-bar";
import { PlaybackBar } from "./playback-bar";
import { PreviewStage } from "./preview-stage";
import { PreviewRenderer } from "./preview-renderer";
import { BottomToolbar } from "../bottom-toolbar";
import { SubToolbar } from "../sub-toolbar";
import { PRIMARY_TOOLBAR_ITEMS, CONTEXTUAL_BACK_ID, buildContextualItems, editSheetFor, type PrimaryToolId } from "./toolbar-defs";
import { TimelineView } from "../timeline/timeline-view";
import { EditPanel } from "../panels/edit-panel";
import { AudioPanel } from "../panels/audio-panel";
import { TextPanel } from "../panels/text-panel";
import { StickersPanel } from "../panels/stickers-panel";
import { OverlayPanel } from "../panels/overlay-panel";
import { EffectsPanel } from "../panels/effects-panel";
import { MasksPanel } from "../panels/masks-panel";
import { FiltersPanel } from "../panels/filters-panel";
import { AdjustPanel } from "../panels/adjust-panel";
import { CaptionsPanel } from "../panels/captions-panel";
import { ExportSheet } from "../panels/export-sheet";
import { KeyframeGraphSheet } from "../panels/keyframe-graph-sheet";
import { MotionTemplatesPanel } from "../panels/motion-templates-panel";
import { AIDirectorPanel } from "../panels/ai-director-panel";
import { VoiceoverPanel } from "../panels/voiceover-panel";
import { StockMediaPanel } from "../panels/stock-media-panel";
import { HtmlMotionLayer } from "../../motion-templates/html-motion-layer";
import { KeyframeControl } from "../timeline/keyframe-control";
import { getClipKeyframeEasing } from "../../editor/keyframes";
import {
	useLiveEditor,
	useSelectedElement,
	useCurrentTimeSeconds,
	useIsPlaying,
	useProjectDurationSeconds,
	useSceneTransitions,
} from "../../editor/use-live-editor";
import { bootstrapDemoProject } from "../../editor/demo-project";
import { useTimelineProjectVM } from "../../editor/use-timeline-project-vm";
import {
	splitAtPlayhead,
	deleteSelected,
	duplicateSelected,
	setRetime,
	setElementParam,
	toggleReversed,
	selectElement,
	insertTextElement,
	importAndPlaceOverlay,
	setMainTrackTransition,
	togglePlayback,
	seekToSeconds,
	importAndPlaceMedia,
	describeImportProgress,
	setProjectResolution,
	setProjectBackground,
	commitElementTrim,
	scrubElementTrim,
	commitElementMove,
	commitMainTrackReorder,
	cutDeadSpace,
	describeDeadSpaceCut,
	readClipKeyframeState,
	toggleClipKeyframeAtPlayhead,
	seekToClipKeyframe,
	seekToClipKeyframeTime,
	setClipKeyframeEasing,
} from "../../editor/actions";
import { CC_ICON_STROKE } from "../../tokens";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import { ProgressOverlay } from "../progress-overlay";
import { KeyVaultSheet } from "../panels/key-vault-sheet";

export type SheetId = PrimaryToolId | "export" | "graph" | "vault";

export interface EditorShellProps {
	className?: string;
	/** Back (top-left arrow) tap handler — `TopBar` has always rendered that
	 *  arrow, but nothing here ever wired it to anything (dead button; the
	 *  M8 dev harness page never needed a "back" destination). Optional and
	 *  undefined by default so the dev harness's existing bare `<EditorShell
	 *  />` keeps behaving exactly as before. The real app (apps/mobile)
	 *  passes its own "back to project list" callback. */
	onBack?: () => void;
	/** Runs once on mount, before the shell renders live editor chrome —
	 *  defaults to the M8 dev-harness demo project (`bootstrapDemoProject`,
	 *  text/sticker/graphic/library-audio elements pre-inserted) so every
	 *  existing caller of bare `<EditorShell />` (the `/dev/mobile-editor`
	 *  page) keeps working unchanged. The real app already creates or loads
	 *  a REAL project via `ProjectManager` (`editor.project.createNewProject`
	 *  / `.loadProject`) before ever mounting this component, so it passes a
	 *  no-op here instead — bootstrapping the demo project on top of an
	 *  already-active real one would be wrong, not just redundant. */
	bootstrap?: () => Promise<unknown>;
	/** Opens directly into a tool sheet on mount (e.g. from Home tools shortcuts). */
	initialSheet?: SheetId;
	/** Non-null while the host is still importing the media a new project
	 *  will be created from (Start Creating): the shell shows the import
	 *  progress instead of editor chrome until it clears. */
	preparing?: NativeImportProgress | null;
}

const AUDIBLE_ELEMENT_TYPES = new Set(["video", "audio"]);

/** Shown when Split was tapped but the playhead isn't strictly inside the
 *  clip — on its edge or outside it — so there is nothing to cut. */
const SPLIT_NOOP_NOTICE = "Move the playhead inside the clip to split it.";

function formatKeyframeTime(time: MediaTime): string {
	return `${mediaTimeToSeconds({ time }).toFixed(2)}s`;
}

const VISUAL_ONLY_SHEETS = new Set<SheetId>(["effects", "filters", "adjust", "masks"]);

function formatTimecode(seconds: number): string {
	const clamped = Math.max(0, seconds);
	const mm = Math.floor(clamped / 60);
	const ss = Math.floor(clamped % 60);
	return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** CapCut's top-bar pill reads "AI UHD" when AI-upscaled export is armed;
 *  kneecap has no upscaler, so the pill honestly shows the project's real
 *  export resolution class and opens the export sheet where it's changed. */
function resolutionLabelFor({ width, height }: { width: number; height: number }): string {
	const shortEdge = Math.min(width, height);
	if (shortEdge >= 2160) return "4K";
	if (shortEdge >= 1440) return "2K";
	if (shortEdge >= 1080) return "1080p";
	if (shortEdge >= 720) return "720p";
	return `${shortEdge}p`;
}

const RATIO_PRESETS: { label: string; width: number; height: number }[] = [
	{ label: "9:16", width: 1080, height: 1920 },
	{ label: "16:9", width: 1920, height: 1080 },
	{ label: "1:1", width: 1080, height: 1080 },
	{ label: "4:5", width: 1080, height: 1350 },
	{ label: "3:4", width: 1080, height: 1440 },
];

const BACKGROUND_PRESETS = ["#000000", "#FFFFFF", "#101010", "#1E3A5F", "#4A1942", "#0F3D2E", "#5C1A1A"];

/**
 * M8 editor chrome — composes the top bar, preview placeholder, playback
 * controls, M7's timeline surface, primary + contextual toolbars, and every
 * v1 panel/export sheet into one mountable component. This is what the M8
 * dev harness page renders; it is also the shape a real mobile screen route
 * would compose (same components, same wiring), not harness-only
 * scaffolding.
 *
 * Fixer pass: `TimelineView` (M7) is now mounted here, fed by
 * `useTimelineProjectVM()` — a live mapping of the real `EditorCore` scene
 * graph, not `mock-data.ts`'s synthetic stress project. This is the first
 * place in the repo where a real project's timeline, panels/export chrome,
 * and preview all compose together. Scrubbing the real timeline calls
 * `editor.playback.seek()` through `seekToSeconds`. Trim/reorder gestures
 * inside `TimelineView` still do not write back to editor-core commands —
 * that gap was already disclosed in timeline-view.tsx's own
 * `handleTrimCommit` comment and is unrelated to the mounting gap this pass
 * closes; it needs its own follow-up wiring pass.
 *
 * Structural-gap fixer pass (kneecap "close the mobile shipping gap"): this
 * is now ALSO what `apps/mobile` mounts as the real app's editor screen, not
 * only the dev harness — see `bootstrap`/`onBack` above for the two knobs
 * that made that possible without forking the component.
 */
export function EditorShell({ className, onBack, bootstrap, initialSheet, preparing = null }: EditorShellProps) {
	const editor = useLiveEditor();
	const [ready, setReady] = useState(false);
	const [activeSheet, setActiveSheet] = useState<SheetId | null>(initialSheet ?? null);
	/**
	 * Fullscreen preview is an IN-APP expansion, not the Fullscreen API.
	 * `Element.requestFullscreen` is unimplemented in WKWebView for anything
	 * but a <video>, so on iOS — half this app's target — the real API
	 * cannot expand a composited canvas at all. A layout state works
	 * identically on both platforms, keeps the playback bar reachable so
	 * there is always a way back out, and is what CapCut itself does.
	 */
	const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
	/** Transient error strip for chrome-level actions that have no panel of
	 *  their own to show failure in (the timeline's "+" import button —
	 *  panels like Export/Captions render their own error states). A failed
	 *  bridge call must degrade to a message, never an unhandled rejection:
	 *  on the founder's iPhone a dead pickMedia call surfaced as a
	 *  whole-app death screen (2026-08-18). */
	const [chromeError, setChromeError] = useState<string | null>(null);
	/** Non-null while the "+" import flow is in flight — from the tap that
	 *  opens the picker until every picked asset's native proxy transcode
	 *  lands (or the picker is cancelled). Drives the same ProgressOverlay
	 *  the export sheet uses; without it the seconds of native transcode
	 *  after picking looked like a dead button (founder's device,
	 *  2026-08-19). */
	const [importProgress, setImportProgress] = useState<{
		percent: number;
		label: string;
	} | null>(null);
	const timelineProject = useTimelineProjectVM();

	// Engine-backed transitions -> the TimelineView's Record<afterClipId, vm>
	// shape (ticks -> seconds). Memoized on the stable engine array.
	const sceneTransitions = useSceneTransitions();
	const transitionsVM = useMemo(() => {
		const vm: Record<string, { kind: string; durationSec: number }> = {};
		for (const transition of sceneTransitions) {
			vm[transition.afterElementId] = {
				kind: transition.kind,
				durationSec: transition.duration / TICKS_PER_SECOND,
			};
		}
		return vm;
	}, [sceneTransitions]);

	const reportChromeError = (error: unknown) => {
		setChromeError(error instanceof Error ? error.message : String(error));
	};

	/** Neutral (non-error) chrome strip — "nothing to cut" is a RESULT, not a
	 *  failure, and the red error treatment reads as a crash. */
	const [chromeNotice, setChromeNotice] = useState<string | null>(null);
	/** Non-null while a clip's audio is being decoded and measured. The first
	 *  analysis of a long clip is seconds of silent work; without this the
	 *  verb looks dead, exactly like the import flow did before its overlay. */
	const [deadSpaceProgress, setDeadSpaceProgress] = useState<{
		percent: number;
	} | null>(null);

	const runSplit = ({ ref }: { ref: ElementRef }) => {
		setChromeNotice(splitAtPlayhead({ editor, ref }) ? null : SPLIT_NOOP_NOTICE);
	};

	const runCutDeadSpace = ({ ref }: { ref: ElementRef }) => {
		if (deadSpaceProgress) return; // one analysis at a time
		setChromeError(null);
		setChromeNotice(null);
		setDeadSpaceProgress({ percent: 0 });
		cutDeadSpace({
			editor,
			ref,
			onProgress: ({ fraction }) =>
				setDeadSpaceProgress({
					percent: fraction === null ? 0 : Math.round(fraction * 100),
				}),
		})
			.then((outcome) => setChromeNotice(describeDeadSpaceCut({ outcome })))
			.catch(reportChromeError)
			.finally(() => setDeadSpaceProgress(null));
	};

	/** Shared picker→custody→proxy import flow with the ProgressOverlay —
	 *  the "+" button (main track) and the Overlay panel (PiP tracks) run
	 *  the EXACT same mechanism, differing only in where clips land. */
	const runMediaImport = (
		importer: (args: {
			editor: EditorCore;
			onProgress: (p: NativeImportProgress) => void;
		}) => Promise<number>,
	) => {
		if (importProgress) return; // one import at a time
		setChromeError(null);
		// Indeterminate 0% while the OS picker is up; the picker sheet
		// covers it, and a cancelled pick clears it in `finally`.
		setImportProgress({ percent: 0, label: "Choosing media…" });
		importer({
			editor,
			onProgress: (p) => {
				const { percent, label } = describeImportProgress(p);
				setImportProgress({ percent: Math.round(percent), label });
			},
		})
			.catch(reportChromeError)
			.finally(() => setImportProgress(null));
	};

	useEffect(() => {
		(bootstrap ?? bootstrapDemoProject)()
			.catch((err) => {
				console.error("Bootstrap error, proceeding to editor:", err);
			})
			.finally(() => {
				setReady(true);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `bootstrap`/`bootstrapDemoProject` are meant to run exactly once per mount (the demo bootstrap is itself idempotent via its own module-level cache — see demo-project.ts — and re-running a real caller's bootstrap on every render would be wrong, not just wasteful); depending on `bootstrap` would re-run this whenever a caller passes a fresh closure identity, which apps/mobile's own memoized `NOOP_BOOTSTRAP` avoids but nothing enforces.
	}, []);

	const [selectedRef, selectedElement] = useSelectedElement();
	const currentTimeSeconds = useCurrentTimeSeconds();
	const durationSeconds = useProjectDurationSeconds();
	const isPlaying = useIsPlaying();

	// No live chrome until a project exists: Start Creating mounts the shell
	// the moment the user taps Done, before the project is created.
	if (!ready || preparing || !editor.project.getActiveOrNull()) {
		const progress = preparing ? describeImportProgress(preparing) : null;
		return (
			<div className={cn("cc-editor-shell", className)} data-kneecap-theme="capcut-mobile">
				{progress ? (
					<ProgressOverlay percent={Math.round(progress.percent)} label={progress.label} />
				) : (
					<p className="cc-panel-note">Loading…</p>
				)}
			</div>
		);
	}

	const project = editor.project.getActive();
	const isMainTrackMuted = editor.scenes.getActiveSceneOrNull()?.tracks.main.muted ?? false;
	const background = project.settings.background;
	const backgroundColor = background.type === "color" ? background.color : "#000000";
	const visualElement: VisualElement | null =
		selectedElement && isVisualElement(selectedElement) ? selectedElement : null;

	// Round 47: keyframe chrome reads the live playhead — the shell already
	// re-renders per playback tick/seek via useCurrentTimeSeconds above.
	const keyframeState =
		selectedRef && visualElement
			? readClipKeyframeState({ editor, ref: selectedRef, element: visualElement })
			: null;
	const keyframeSegmentEasing =
		visualElement && keyframeState && keyframeState.segmentTime !== null
			? getClipKeyframeEasing({ animations: visualElement.animations, time: keyframeState.segmentTime })
			: null;
	const keyframeSegmentLabel = (() => {
		if (!keyframeState || keyframeState.segmentTime === null) return null;
		const index = keyframeState.times.indexOf(keyframeState.segmentTime);
		const next = keyframeState.times[index + 1];
		if (next === undefined) return null;
		return `${formatKeyframeTime(keyframeState.segmentTime)} → ${formatKeyframeTime(next)}`;
	})();

	const closeSheet = () => setActiveSheet(null);

	return (
		<div
			className={cn(
				"cc-editor-shell",
				isPreviewFullscreen && "cc-editor-shell--preview-fullscreen",
				activeSheet !== null && "cc-editor-shell--sheet-open",
				className,
			)}
			data-kneecap-theme="capcut-mobile"
		>
			<TopBar
				onClose={onBack}
				resolutionLabel={resolutionLabelFor(project.settings.canvasSize)}
				onOpenExportSettings={() => setActiveSheet("export")}
				onExport={() => setActiveSheet("export")}
				onOpenVault={() => setActiveSheet("vault")}
			/>
			{/* NO tap-to-play on the stage (founder, 2026-08-22): the tap fired
			    on the pointer-up that ENDED a preview gesture too — releasing
			    a caption resize/text edit started playback. Play/pause lives
			    on the PlaybackBar button ONLY (supersedes the 2026-08-20
			    tap-to-toggle round). */}
			<PreviewStage
				canvasWidth={project.settings.canvasSize.width}
				canvasHeight={project.settings.canvasSize.height}
				backgroundColor={backgroundColor}
			>
				{/* Real frame rendering (CanvasRenderer -> wgpu compositor) —
				    replaces the chrome-only text-span placeholder; the renderer
				    draws text/sticker/overlay/video elements with their actual
				    params (opacity/blendMode included), so the span's partial
				    re-implementation of that is gone with it. */}
				<PreviewRenderer
					onEditText={() => setActiveSheet("text")}
					onEditCaption={() => setActiveSheet("captions")}
				/>
				{/* Pixels only — selection/drag/resize for template clips now run
				    through PreviewRenderer's gesture system like every other
				    element type, because a template clip is a real engine
				    graphic element (see motion-templates/engine-bridge.ts). */}
				<HtmlMotionLayer
					time={currentTimeSeconds}
					canvasWidth={project.settings.canvasSize.width}
					canvasHeight={project.settings.canvasSize.height}
					isPlaying={isPlaying}
				/>
			</PreviewStage>
			<PlaybackBar
				isPlaying={isPlaying}
				onPlayPause={() => togglePlayback({ editor })}
				onUndo={() => editor.command.undo()}
				onRedo={() => editor.command.redo()}
				onPrev={() => {
					if (!timelineProject) {
						seekToSeconds({ editor, seconds: 0 });
						return;
					}
					let targetSec = 0;
					for (const track of timelineProject.tracks) {
						for (const clip of track.clips) {
							const start = clip.startSec;
							const end = clip.startSec + clip.durationSec;
							if (start < currentTimeSeconds - 0.05 && start > targetSec) {
								targetSec = start;
							}
							if (end < currentTimeSeconds - 0.05 && end > targetSec) {
								targetSec = end;
							}
						}
					}
					seekToSeconds({ editor, seconds: targetSec });
				}}
				onNext={() => {
					if (!timelineProject) {
						seekToSeconds({ editor, seconds: durationSeconds });
						return;
					}
					let targetSec = durationSeconds;
					for (const track of timelineProject.tracks) {
						for (const clip of track.clips) {
							const start = clip.startSec;
							const end = clip.startSec + clip.durationSec;
							if (start > currentTimeSeconds + 0.05 && start < targetSec) {
								targetSec = start;
							}
							if (end > currentTimeSeconds + 0.05 && end < targetSec) {
								targetSec = end;
							}
						}
					}
					seekToSeconds({ editor, seconds: targetSec });
				}}
				canUndo={editor.command.canUndo()}
				canRedo={editor.command.canRedo()}
				currentTimeSec={currentTimeSeconds}
				durationSec={durationSeconds}
				onOpenSpeed={() => setActiveSheet("edit")}
				isPreviewFullscreen={isPreviewFullscreen}
				onToggleFullscreen={() => setIsPreviewFullscreen((on) => !on)}
			/>

			{timelineProject && (
				<div className="cc-editor-shell__timeline">
					<TimelineView
						project={timelineProject}
						onTimeChange={({ timeSec }) => seekToSeconds({ editor, seconds: timeSec })}
						onSelectClip={({ clipId, trackId }) =>
							selectElement({ editor, ref: { trackId, elementId: clipId } })
						}
						selectedClipId={selectedRef?.elementId ?? null}
						onClearSelection={() => selectElement({ editor, ref: null })}
						onTrimClip={({ clipId, trackId, edge, boundarySec }) =>
							commitElementTrim({ editor, trackId, elementId: clipId, edge, boundarySec })
						}
						onTrimScrub={({ clipId, trackId, edge, boundarySec }) =>
							scrubElementTrim({ editor, trackId, elementId: clipId, edge, boundarySec })
						}
						onMoveClip={({ clipId, trackId, startSec, targetTrackId }) =>
							commitElementMove({
								editor,
								trackId,
								elementId: clipId,
								startSec,
								targetTrackId,
							})
						}
						onReorderMainTrack={({ trackId, orderedClipIds }) =>
							commitMainTrackReorder({ editor, trackId, orderedElementIds: orderedClipIds })
						}
						onKeyframeTap={({ clipId, trackId, keyframeId }) => {
							const keyframe = timelineProject.tracks
								.find((t) => t.id === trackId)
								?.clips.find((c) => c.id === clipId)
								?.keyframes?.find((k) => k.id === keyframeId);
							const ref = { trackId, elementId: clipId };
							selectElement({ editor, ref });
							if (keyframe?.timeTicks !== undefined) {
								seekToClipKeyframeTime({ editor, ref, time: mediaTime({ ticks: keyframe.timeTicks }) });
							}
						}}
						keyframeControl={
							selectedRef && visualElement && keyframeState ? (
								<KeyframeControl
									isOnKeyframe={keyframeState.onKeyframeTime !== null}
									canPrevious={keyframeState.previousTime !== null}
									canNext={keyframeState.nextTime !== null}
									onToggle={() => toggleClipKeyframeAtPlayhead({ editor, ref: selectedRef })}
									onPrevious={() => seekToClipKeyframe({ editor, ref: selectedRef, direction: "previous" })}
									onNext={() => seekToClipKeyframe({ editor, ref: selectedRef, direction: "next" })}
								/>
							) : null
						}
						transitions={transitionsVM}
						onTransitionCommit={({ afterClipId, kind, durationSec, applyToAll }) =>
							setMainTrackTransition({
								editor,
								afterElementId: afterClipId,
								kind,
								durationSec,
								applyToAll,
							})
						}
						playbackTimeSec={currentTimeSeconds}
						isPlaying={isPlaying}
						onUserScroll={() => {
							if (isPlaying) {
								togglePlayback({ editor });
							}
						}}
						onAddClip={() => runMediaImport(importAndPlaceMedia)}
						showAddAudio={!timelineProject.tracks.some((t) => t.kind === "audio")}
						onAddAudio={() => setActiveSheet("audio")}
						onAddSubtitle={() => setActiveSheet("captions")}
						onAddGraphic={() => setActiveSheet("template")}
						isMainTrackMuted={isMainTrackMuted}
						onToggleMainTrackMute={() => {
							const mainTrackId = editor.scenes.getActiveSceneOrNull()?.tracks.main.id;
							if (mainTrackId) {
								editor.timeline.toggleTrackMute({ trackId: mainTrackId });
							}
						}}
						onQuickAddAudio={() => setActiveSheet("audio")}
						onQuickAddText={() => {
							const ref = insertTextElement({ editor, content: "New text" });
							if (ref) selectElement({ editor, ref });
							setActiveSheet("text");
						}}
						onDoubleTapClip={({ kind }) => {
							if (kind === "text") {
								setActiveSheet("text");
							} else if (kind === "caption") {
								setActiveSheet("captions");
							}
						}}
					/>
				</div>
			)}

			{chromeError && (
				<button type="button" className="cc-chrome-error" onClick={() => setChromeError(null)}>
					{chromeError}
				</button>
			)}

			{chromeNotice && (
				<button
					type="button"
					className="cc-chrome-error cc-chrome-error--notice"
					onClick={() => setChromeNotice(null)}
				>
					{chromeNotice}
				</button>
			)}

			{importProgress && (
				<ProgressOverlay percent={importProgress.percent} label={importProgress.label} />
			)}

			{deadSpaceProgress && (
				<ProgressOverlay percent={deadSpaceProgress.percent} label="Listening for dead space…" />
			)}

			{selectedRef && selectedElement && (
				<SubToolbar
					items={buildContextualItems({
						type: selectedElement.type,
						hasKeyframes: (keyframeState?.times.length ?? 0) > 0,
					})}
					activeId={activeSheet}
					onSelect={(id) => {
						// Direct verbs act immediately; everything else opens a sheet.
						if (id === CONTEXTUAL_BACK_ID) {
							setActiveSheet(null);
							selectElement({ editor, ref: null });
							return;
						}
						if (id === "split") {
							runSplit({ ref: selectedRef });
							return;
						}
						if (id === "delete") {
							deleteSelected({ editor, refs: [selectedRef] });
							return;
						}
						if (id === "duplicate") {
							duplicateSelected({ editor, refs: [selectedRef] });
							return;
						}
						if (id === "cut-gaps") {
							runCutDeadSpace({ ref: selectedRef });
							return;
						}
						setActiveSheet(id === "edit" ? editSheetFor({ element: selectedElement }) : (id as SheetId));
					}}
				/>
			)}

			{/* One toolbar at a time: the clip row above replaces this one while
			    something is selected (founder, 2026-09-30). */}
			{!(selectedRef && selectedElement) && (
				<BottomToolbar items={PRIMARY_TOOLBAR_ITEMS} activeId={activeSheet} onSelect={(id) => setActiveSheet(id as SheetId)} />
			)}

			{activeSheet === "edit" && selectedRef && selectedElement && (
				<EditPanel
					elementRef={selectedRef}
					element={selectedElement}
					onClose={closeSheet}
					onSplit={() => runSplit({ ref: selectedRef })}
					onDelete={() => {
						deleteSelected({ editor, refs: [selectedRef] });
						closeSheet();
					}}
					onDuplicate={() => duplicateSelected({ editor, refs: [selectedRef] })}
					onCutDeadSpace={
						AUDIBLE_ELEMENT_TYPES.has(selectedElement.type)
							? () => {
									closeSheet();
									runCutDeadSpace({ ref: selectedRef });
								}
							: undefined
					}
					onSetSpeed={({ rate, maintainPitch }) => setRetime({ editor, ref: selectedRef, rate, maintainPitch })}
					onSetVolume={(db) => setElementParam({ editor, ref: selectedRef, key: "volume", value: db })}
					onToggleReverse={() => toggleReversed({ editor, ref: selectedRef })}
				/>
			)}

			{activeSheet === "audio" && (
				<AudioPanel editor={editor} onClose={closeSheet} onInserted={(ref) => selectElement({ editor, ref })} />
			)}

			{activeSheet === "text" && (
				<TextPanel
					editor={editor}
					elementRef={selectedElement?.type === "text" ? selectedRef : null}
					element={selectedElement?.type === "text" ? selectedElement : null}
					onClose={closeSheet}
					onAddText={() => {
						const ref = insertTextElement({ editor, content: "New text" });
						if (ref) selectElement({ editor, ref });
					}}
				/>
			)}

			{activeSheet === "stickers" && (
				<StickersPanel editor={editor} onClose={closeSheet} onInserted={(ref) => selectElement({ editor, ref })} />
			)}

			{activeSheet === "overlay" && (
				<OverlayPanel
					editor={editor}
					elementRef={selectedRef}
					element={visualElement}
					onClose={closeSheet}
					onAddOverlay={() => {
						// Overlay = picture-in-picture MEDIA (founder, 2026-08-23:
						// "overlay doesn't mean overlay shape") — the same
						// import mechanism as the "+" button, landing on an
						// overlay track. Close the sheet so the OS picker and
						// the ProgressOverlay aren't buried under it.
						closeSheet();
						runMediaImport(importAndPlaceOverlay);
					}}
				/>
			)}

			{activeSheet === "effects" && selectedRef && visualElement && (
				<EffectsPanel editor={editor} elementRef={selectedRef} element={visualElement} onClose={closeSheet} />
			)}

			{activeSheet === "filters" && selectedRef && visualElement && (
				<FiltersPanel editor={editor} elementRef={selectedRef} element={visualElement} onClose={closeSheet} />
			)}

			{activeSheet === "masks" && selectedRef && visualElement && (
				<MasksPanel editor={editor} elementRef={selectedRef} element={visualElement} onClose={closeSheet} />
			)}

			{activeSheet === "adjust" && selectedRef && visualElement && (
				<AdjustPanel editor={editor} elementRef={selectedRef} element={visualElement} onClose={closeSheet} />
			)}

			{activeSheet && VISUAL_ONLY_SHEETS.has(activeSheet) && !visualElement && (
				<PanelSelectPrompt onClose={closeSheet} />
			)}

			{/* Fixer pass: the Edit sheet had no fallback when opened with
			    nothing selected — unlike VISUAL_ONLY_SHEETS above, it rendered
			    a totally empty sheet body (reproduced live: opening Edit with
			    no selection showed no content and no prompt). The bottom
			    toolbar's Edit item is reachable at any time regardless of
			    selection (it isn't gated the way the contextual SubToolbar's
			    own "Edit" chip is, which only renders when something is
			    selected), so this state IS reachable in the real UI, not just
			    hypothetically. */}
			{activeSheet === "edit" && !(selectedRef && selectedElement) && (
				<PanelSelectPrompt onClose={closeSheet} message="Select an element on the timeline first." />
			)}

			{activeSheet === "captions" && (
				<CaptionsPanel
					editor={editor}
					onClose={closeSheet}
					onInserted={(ref) => selectElement({ editor, ref })}
					selectedCaption={
						selectedRef && selectedElement?.type === "caption"
							? { ref: selectedRef, element: selectedElement }
							: null
					}
				/>
			)}

			{activeSheet === "ratio" && (
				<PanelSheet onScrimClick={closeSheet} header={<SheetHeader onClose={closeSheet} />}>
					<p className="cc-sheet-title">Aspect ratio</p>
					<div className="cc-ratio-grid">
						{RATIO_PRESETS.map((preset) => {
							const active =
								project.settings.canvasSize.width === preset.width &&
								project.settings.canvasSize.height === preset.height;
							return (
								<button
									key={preset.label}
									type="button"
									className={cn("cc-ratio-grid__item", active && "cc-ratio-grid__item--active")}
									onClick={() => setProjectResolution({ editor, canvasSize: { width: preset.width, height: preset.height } })}
								>
									<span
										className="cc-ratio-grid__shape"
										style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
									/>
									{preset.label}
								</button>
							);
						})}
					</div>
				</PanelSheet>
			)}

			{activeSheet === "background" && (
				<PanelSheet onScrimClick={closeSheet} header={<SheetHeader onClose={closeSheet} />}>
					<p className="cc-sheet-title">Background</p>
					<div className="cc-ratio-grid">
						{BACKGROUND_PRESETS.map((color) => (
							<button
								key={color}
								type="button"
								className={cn(
									"cc-swatch",
									backgroundColor.toLowerCase() === color.toLowerCase() && "cc-swatch--active",
								)}
								style={{ background: color }}
								onClick={() => setProjectBackground({ editor, color })}
								aria-label={`Background ${color}`}
							/>
						))}
					</div>
				</PanelSheet>
			)}

			{activeSheet === "template" && (
				<MotionTemplatesPanel
					currentTimeSeconds={currentTimeSeconds}
					onClose={closeSheet}
				/>
			)}

			{activeSheet === "stock" && (
				<StockMediaPanel
					editor={editor}
					currentTimeSeconds={currentTimeSeconds}
					onClose={closeSheet}
					onOpenVault={() => setActiveSheet("vault")}
				/>
			)}

			{activeSheet === "voiceover" && (
				<VoiceoverPanel
					editor={editor}
					currentTimeSeconds={currentTimeSeconds}
					onClose={closeSheet}
					onOpenVault={() => setActiveSheet("vault")}
				/>
			)}

			{activeSheet === "ai" && (
				<AIDirectorPanel
					editor={editor}
					onClose={closeSheet}
					onOpenVault={() => setActiveSheet("vault")}
				/>
			)}

			{activeSheet === "transcript" && (
				<PanelSheet onScrimClick={closeSheet} header={<SheetHeader onClose={closeSheet} />}>
					<p className="cc-sheet-title">Transcript</p>
					<p className="cc-panel-note">
						Transcript editing: use Captions for on-device auto-captions, or ask AI Director to summarize and cut.
					</p>
				</PanelSheet>
			)}

			{activeSheet === "graph" && selectedRef && visualElement && (
				<KeyframeGraphSheet
					current={keyframeSegmentEasing}
					segmentLabel={keyframeSegmentLabel}
					onSelect={(easing) => {
						if (keyframeState && keyframeState.segmentTime !== null) {
							setClipKeyframeEasing({ editor, ref: selectedRef, time: keyframeState.segmentTime, easing });
						}
					}}
					onClose={closeSheet}
				/>
			)}

			{activeSheet === "export" && <ExportSheet editor={editor} onClose={closeSheet} />}

			{activeSheet === "vault" && <KeyVaultSheet onClose={closeSheet} />}
		</div>
	);
}

function PanelSelectPrompt({ onClose, message }: { onClose: () => void; message?: string }) {
	return (
		<div className="cc-sheet-scrim" onClick={onClose} aria-hidden="true">
			<p className="cc-panel-note">{message ?? "Select a text, sticker, or overlay element first."}</p>
		</div>
	);
}
