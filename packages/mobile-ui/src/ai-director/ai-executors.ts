/**
 * Executes Claude tool calls against the LIVE mobile timeline.
 *
 * Every executor drives the same `editor-core` commands the touch UI drives,
 * so an AI edit is undoable, autosaved and visible on the timeline exactly
 * like a manual one. Executors return a short human-readable string that is
 * fed back to Claude as the tool result, so the model can verify its own work
 * and decide the next step.
 */
import type { EditorCore } from "@kneecap/editor-core";
import { DEFAULT_CAPTION_STYLE_PRESET_ID, getVisibleCaptionWords } from "@kneecap/editor-core/captions";
import type { ElementRef, TimelineElement } from "@kneecap/editor-core/timeline";
import { mediaTimeToSeconds } from "@kneecap/editor-core/wasm";
import {
	splitAtPlayhead,
	deleteSelected,
	duplicateSelected,
	setRetime,
	setElementParam,
	insertTextElement,
	setProjectResolution,
	seekToSeconds,
	cutDeadSpace,
	describeDeadSpaceCut,
	ensureSingleEffect,
	updateEffectParam,
	insertHtmlTemplateElement,
	getElement,
	commitElementTrim,
	commitElementMove,
	setMainTrackTransition,
	setElementMask,
	removeElementMask,
	getElementMask,
	updateElementMaskParam,
} from "../editor/actions";
import { parseMaskType } from "../editor/actions";
import {
	generateCaptionsForClip,
	getAllCaptions,
	setCaptionHighlightEnabled,
	setCaptionBorderEnabled,
} from "../editor/captions-actions";
import { generateVoiceover, listAllVoiceOptions } from "../editor/voiceover-actions";
import { searchPexelsVideos, importPexelsMediaToTimeline } from "../editor/stock-media-actions";
import { captureFrameAt, captureFramesAcross, type CapturedFrame } from "./frame-capture";
import { exportActiveProject } from "../export/export-active-project";
import { analyzeReferenceVideo, buildStyleExtractionPrompt } from "./reference-analysis";
import { useStyleProfileStore, formatStyleProfile } from "./style-profile-store";
import { findHtmlTemplateRef } from "../motion-templates/engine-bridge";
import { AI_TOOL_NAMES } from "./ai-tools";
import { useAIDirectorStore, type PlanStep } from "./ai-store";
import { captionSampleTimes, clearanceForTimes } from "./playbook/face-scan";
import { LIME, accentColorForText, musicBedRefusal, playbookToolRefusal } from "./playbook/rules";
import { frameWasSeen, markFrameSeen } from "./playbook/turn";

/**
 * Deliberately carries no playhead snapshot: a value captured when the turn
 * started goes stale the moment the model calls `seek`, and every later
 * "at the playhead" edit would land at the old time. Executors read the live
 * playhead via `playheadSeconds` instead.
 */
export interface ToolContext {
	editor: EditorCore;
}

type ClipRow = {
	id: string;
	trackId: string;
	kind: string;
	startSeconds: number;
	durationSeconds: number;
	name?: string;
};

const ASPECT_PRESETS: Record<string, { width: number; height: number }> = {
	"9:16": { width: 1080, height: 1920 },
	"16:9": { width: 1920, height: 1080 },
	"1:1": { width: 1080, height: 1080 },
	"4:5": { width: 1080, height: 1350 },
};

/** The live playhead, read at call time — see `ToolContext`. */
function playheadSeconds(editor: EditorCore): number {
	return mediaTimeToSeconds({ time: editor.playback.getCurrentTime() });
}

/** Flattens the active scene into a simple row list the model can reason over. */
function listClips({ editor }: ToolContext): ClipRow[] {
	// The ACTIVE scene, not `project.scenes[0]`: the executors must see the
	// same timeline the user is looking at and the edit commands mutate.
	const scene = editor.scenes.getActiveSceneOrNull();
	if (!scene) return [];
	const rows: ClipRow[] = [];
	const push = (trackId: string, elements: readonly TimelineElement[]) => {
		for (const el of elements) {
			const content = el.params?.content;
			rows.push({
				id: el.id,
				trackId,
				kind: el.type,
				startSeconds: Number(mediaTimeToSeconds({ time: el.startTime }).toFixed(3)),
				durationSeconds: Number(Math.max(0, mediaTimeToSeconds({ time: el.duration })).toFixed(3)),
				name: typeof content === "string" ? content : el.name,
			});
		}
	};
	const { main, overlay, audio } = scene.tracks;
	push(main.id, main.elements);
	for (const t of overlay) push(t.id, t.elements);
	for (const t of audio) push(t.id, t.elements);
	return rows;
}

function findRef(ctx: ToolContext, clipId: string): ElementRef | null {
	const row = listClips(ctx).find((r) => r.id === clipId);
	return row ? { trackId: row.trackId, elementId: row.id } : null;
}

function clipRange({ editor, ref }: { editor: EditorCore; ref: ElementRef }): string {
	const element = getElement({ editor, ref });
	if (!element) return "missing";
	const start = mediaTimeToSeconds({ time: element.startTime });
	const end = start + mediaTimeToSeconds({ time: element.duration });
	return `${start.toFixed(2)}s → ${end.toFixed(2)}s`;
}

/** First main-track clip — the sensible default target when the model omits an id. */
function firstMainRef(ctx: ToolContext): ElementRef | null {
	const main = ctx.editor.scenes.getActiveSceneOrNull()?.tracks.main;
	const el = main?.elements[0];
	return main && el ? { trackId: main.id, elementId: el.id } : null;
}

/**
 * A tool result. Most tools report a line of text; the vision tools also hand
 * back captured frames, which the agent loop converts into Anthropic image
 * blocks so the model literally sees them.
 */
export interface ToolOutcome {
	text: string;
	frames?: CapturedFrame[];
}

export async function executeTool(
	name: string,
	input: Record<string, any>,
	ctx: ToolContext,
): Promise<ToolOutcome> {
	if (!AI_TOOL_NAMES.has(name)) {
		return { text: `Error: unknown tool "${name}". It does not exist in this app.` };
	}
	const refusal = playbookToolRefusal({ name, input, looked: frameWasSeen() });
	if (refusal) return { text: refusal };
	const { editor } = ctx;

	switch (name) {
		// ── Introspection ────────────────────────────────────────────────────
		case "get_timeline": {
			const project = editor.project.getActive();
			const clips = listClips(ctx);
			const { width, height } = project.settings.canvasSize;
			if (clips.length === 0) {
				return { text: `Project "${project.metadata.name}" — canvas ${width}x${height}. Timeline is EMPTY. The user must import footage before edits can be made.` };
			}
			const lines = clips.map(
				(c) =>
					`- ${c.id} | ${c.kind} | ${c.startSeconds}s → ${(c.startSeconds + c.durationSeconds).toFixed(3)}s${c.name ? ` | "${String(c.name).slice(0, 40)}"` : ""}`,
			);
			return { text: `Project "${project.metadata.name}" — canvas ${width}x${height}, playhead ${playheadSeconds(editor).toFixed(2)}s.\n${clips.length} clip(s):\n${lines.join("\n")}` };
		}

		case "get_transcript": {
			const captions = getAllCaptions({ editor });
			if (captions.length === 0) {
				return { text: "No transcript yet — no captions exist on this timeline. Call generate_captions first to transcribe the video on-device." };
			}
			const MAX_SEGMENTS = 400;
			// A caption's text lives in its words, windowed to its trim — not in
			// `params` — so read exactly what the viewer sees on screen.
			const lines = [...captions]
				.sort((a, b) => a.element.startTime - b.element.startTime)
				.slice(0, MAX_SEGMENTS)
				.map(({ element }) => {
					const s = mediaTimeToSeconds({ time: element.startTime });
					const text = getVisibleCaptionWords({ element })
						.map(({ word }) => word.text)
						.join(" ");
					return `[${s.toFixed(2)}s] ${text}`;
				});
			const shown = captions.length > MAX_SEGMENTS ? `, first ${MAX_SEGMENTS} shown` : "";
			return { text: `Transcript (${captions.length} caption segments${shown}):\n${lines.join("\n")}` };
		}

		case "list_motion_templates": {
			// Metadata only. The component registry (three, remotion, d3, the
			// OpenChatCut factories) stays out of this tool and out of startup.
			const { getAllHtmlTemplateMeta } = await import("../motion-templates/template-meta");
			const all = getAllHtmlTemplateMeta();
			const q = String(input.search ?? "").toLowerCase();
			const limit = Number(input.limit ?? 40);
			const matched = (q
				? all.filter(
						(t) =>
							t.name.toLowerCase().includes(q) ||
							t.description.toLowerCase().includes(q) ||
							(t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
					)
				: all
			).slice(0, limit);
			if (matched.length === 0) return { text: `No motion templates matched "${q}". Try a broader term, or omit search.` };
			return { text: `${matched.length} of ${all.length} templates:\n${matched
				.map((t) => `- ${t.id} | ${t.name} | ${t.defaultDuration}s | ${t.description.slice(0, 70)}`)
				.join("\n")}` };
		}

		// ── Reference style matching ─────────────────────────────────────────
		case "analyze_reference_video": {
			try {
				const analysis = await analyzeReferenceVideo({
					frameCount: input.frame_count !== undefined ? Number(input.frame_count) : 10,
				});
				return {
					text: buildStyleExtractionPrompt({ analysis }),
					frames: analysis.frames,
				};
			} catch (error) {
				// The picker is a user gesture: a cancel is not a failure, and a
				// platform that cannot decode must say which rather than
				// pretending it read a style.
				const message = error instanceof Error ? error.message : String(error);
				return {
					text: `Could not analyse a reference video: ${message}. Ask the user to try another file, or describe the style they want in words instead.`,
				};
			}
		}

		case "save_style_profile": {
			const name = String(input.name ?? "").trim();
			if (!name) return { text: "Error: a profile name is required." };
			const saved = useStyleProfileStore.getState().saveProfile({
				name,
				pacing: input.pacing ? String(input.pacing) : undefined,
				cutRhythm: input.cut_rhythm ? String(input.cut_rhythm) : undefined,
				hookStructure: input.hook_structure ? String(input.hook_structure) : undefined,
				captionStyle: input.caption_style ? String(input.caption_style) : undefined,
				colorGrade: input.color_grade ? String(input.color_grade) : undefined,
				motionGraphicDensity: input.motion_graphic_density
					? String(input.motion_graphic_density)
					: undefined,
				audioFeel: input.audio_feel ? String(input.audio_feel) : undefined,
				notes: input.notes ? String(input.notes) : undefined,
			});
			return {
				text:
					`Saved style profile "${saved.name}" (id ${saved.id}). ` +
					`Pass style_profile_id: "${saved.id}" to propose_plan so the plan is written against this style.`,
			};
		}

		case "list_style_profiles": {
			const profiles = useStyleProfileStore.getState().profiles;
			if (profiles.length === 0) {
				return {
					text: "No style profiles saved yet. Call analyze_reference_video to study a reference the user picks, then save_style_profile.",
				};
			}
			return {
				text: profiles
					.map((p) => `[id: ${p.id}]\n${formatStyleProfile(p)}`)
					.join("\n\n"),
			};
		}

		// ── Planning ─────────────────────────────────────────────────────────
		case "propose_plan": {
			const rawSteps: any[] = Array.isArray(input.steps) ? input.steps : [];
			// Drop steps naming tools that don't exist here rather than letting
			// the user approve a plan whose steps would silently no-op.
			const steps: PlanStep[] = rawSteps
				.filter((s) => s && typeof s.tool === "string" && AI_TOOL_NAMES.has(s.tool))
				.map((s, i) => ({
					id: `step-${i}-${s.tool}`,
					tool: s.tool,
					input: s.input ?? {},
					reason: String(s.reason ?? ""),
					enabled: true,
					status: "pending" as const,
				}));

			if (steps.length === 0) {
				return {
					text: "That plan had no runnable steps (every step named a tool this app doesn't have). Re-plan using only the tools listed in your toolset.",
				};
			}

			const dropped = rawSteps.length - steps.length;
			// A plan written against a style profile says so on the card: the
			// user must be able to see WHICH reference their edit is copying,
			// not just trust that one was used.
			const profileId = input.style_profile_id ? String(input.style_profile_id) : undefined;
			const profile = profileId
				? useStyleProfileStore.getState().getProfile(profileId)
				: undefined;

			useAIDirectorStore.getState().setPendingPlan({
				id: `plan-${Date.now()}`,
				summary: String(input.summary ?? "Proposed edit"),
				steps,
				status: "awaiting-approval",
				styleProfileId: profile?.id,
				styleProfileName: profile?.name,
			});

			return {
				text:
					`Proposed a ${steps.length}-step plan for the user to review.` +
					(profile ? ` Matched to style profile "${profile.name}".` : "") +
					(profileId && !profile
						? ` (style_profile_id "${profileId}" does not exist — call list_style_profiles for real ids.)`
						: "") +
					(dropped > 0 ? ` (${dropped} step(s) dropped — unknown tools.)` : "") +
					" STOP here: do not run any further tools. The user will approve, edit or discard it, and approved steps execute on their own.",
			};
		}

		// ── Vision ───────────────────────────────────────────────────────────
		case "render_frame": {
			const at = input.at_seconds !== undefined ? Number(input.at_seconds) : playheadSeconds(editor);
			const frame = await captureFrameAt({ editor, timeSeconds: at });
			if (!frame) {
				return {
					text: "Could not render a frame — the preview compositor isn't running (no project open, or the GPU isn't available here). Judge from get_timeline instead, and say you could not look.",
				};
			}
			if (frame.includesVideo) markFrameSeen();
			const videoLine = frame.includesVideo
				? `The ${frame.trace.videoDetail} video frame is underneath the overlays on a private canvas.`
				: `The video frame was not composited (${frame.trace.videoDetail}). This still is overlays only.`;
			return {
				text:
					`Still at ${frame.timeSeconds.toFixed(2)}s. ${videoLine} ` +
					`The live preview was not redrawn.`,
				frames: [frame],
			};
		}

		case "review_composition": {
			const count = input.count !== undefined ? Number(input.count) : 4;
			const frames = await captureFramesAcross({ editor, count });
			if (frames.length === 0) {
				return {
					text: "Could not render review frames — the timeline is empty or the compositor isn't running.",
				};
			}
			const withVideo = frames.filter((frame) => frame.includesVideo).length;
			if (withVideo > 0) markFrameSeen();
			const videoLine =
				withVideo === frames.length
					? "Each still composites the proxy video frame under the overlays and motion templates."
					: `${withVideo} of ${frames.length} stills include the proxy video frame. The rest are overlays only — say so, and do not treat them as the full picture.`;
			return {
				text:
					`Self-review: ${frames.length} frames across the video, at ` +
					frames.map((f) => `${f.timeSeconds.toFixed(2)}s`).join(", ") +
					`. ${videoLine} The live preview was not redrawn. ` +
					"Check each for clipped or unreadable titles, dead/black frames, and overlapping graphics. Fix what is wrong before reporting done.",
				frames,
			};
		}

		// ── Timeline surgery ─────────────────────────────────────────────────
		case "seek": {
			seekToSeconds({ editor, seconds: Number(input.seconds ?? 0) });
			// Report where the playhead actually landed — the engine clamps a
			// seek past the end to the timeline's duration.
			return { text: `Playhead moved to ${playheadSeconds(editor).toFixed(2)}s.` };
		}

		case "split_clip": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}". Call get_timeline for valid ids.` };
			if (input.at_seconds !== undefined) {
				seekToSeconds({ editor, seconds: Number(input.at_seconds) });
			}
			const at = playheadSeconds(editor);
			if (!splitAtPlayhead({ editor, ref })) {
				return {
					text: `Declined: the playhead (${at.toFixed(2)}s) isn't strictly inside clip ${ref.elementId}, so nothing was split. Pass an at_seconds strictly between the clip's start and end (see get_timeline).`,
				};
			}
			return { text: `Split clip ${ref.elementId} at ${at.toFixed(2)}s. Call get_timeline for the new piece's id.` };
		}

		case "delete_clip": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}".` };
			deleteSelected({ editor, refs: [ref] });
			return { text: `Deleted clip ${ref.elementId}; following clips closed up.` };
		}

		case "duplicate_clip": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}".` };
			duplicateSelected({ editor, refs: [ref] });
			return { text: `Duplicated clip ${ref.elementId}.` };
		}

		case "cut_silence": {
			const ref = input.clip_id ? findRef(ctx, String(input.clip_id)) : firstMainRef(ctx);
			if (!ref) {
				return {
					text: input.clip_id
						? `Error: no clip with id "${input.clip_id}". Call get_timeline for valid ids.`
						: "Error: no clip available to de-silence. Import footage first.",
				};
			}
			const outcome = await cutDeadSpace({ editor, ref });
			// Same wording the touch UI shows, so the model and the user hear the
			// same story. Prefixes matter: plan-runner counts "Could not" and
			// "Declined" as failed steps rather than wins.
			const detail = describeDeadSpaceCut({ outcome });
			switch (outcome.status) {
				case "cut":
					return { text: `${detail} from ${ref.elementId}. Call get_timeline for the new clip ids.` };
				case "no-source":
				case "decode-failed":
					return { text: `Could not analyse ${ref.elementId}: ${detail}` };
				case "refused":
					return { text: `Declined (${ref.elementId} left untouched): ${detail}` };
			}
		}

		case "set_clip_speed": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}".` };
			const rate = Math.min(4, Math.max(0.25, Number(input.rate ?? 1)));
			setRetime({ editor, ref, rate, maintainPitch: input.maintain_pitch !== false });
			return { text: `Set clip ${ref.elementId} speed to ${rate}x.` };
		}

		case "set_clip_volume": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}".` };
			const db = Number(input.volume_db ?? 0);
			setElementParam({ editor, ref, key: "volume", value: db });
			return { text: `Set clip ${ref.elementId} volume to ${db} dB.` };
		}

		// ── Captions ─────────────────────────────────────────────────────────
		case "generate_captions": {
			const language =
				typeof input.language === "string" && input.language.trim() ? input.language.trim() : undefined;
			// `generateCaptionsForClip`, not the panel's `generateCaptions`: the
			// panel falls back to the bundled dev-fixture transcript when there
			// is nothing transcribable, and the Director must never lay sample
			// captions on the user's timeline and call that a success.
			let result;
			try {
				result = await generateCaptionsForClip({
					editor,
					stylePresetId: DEFAULT_CAPTION_STYLE_PRESET_ID,
					languageHint: language,
				});
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				return { text: `Could not generate captions: ${msg}` };
			}
			if (!result) return { text: "Could not generate captions — transcription produced no usable speech." };
			const clearance = await clearanceForTimes({
				editor,
				timeSeconds: captionSampleTimes({ editor }),
				preferred: "bottom",
			});
			for (const caption of getAllCaptions({ editor })) {
				const ref = { trackId: caption.trackId, elementId: caption.element.id };
				setElementParam({ editor, ref, key: "highlightColor", value: LIME });
				if (clearance.band) setElementParam({ editor, ref, key: "position", value: clearance.band });
			}
			return {
				text: `Generated ${result.elementIds.length} caption segments on-device${language ? ` (language: ${language})` : ""} and added them to the timeline. Spoken-word highlight is lime ${LIME}. ${clearance.note}`,
			};
		}

		case "style_captions": {
			if (getAllCaptions({ editor }).length === 0) {
				return { text: "No captions to style yet — call generate_captions first." };
			}
			const applied: string[] = [];
			if (input.highlight !== undefined) {
				setCaptionHighlightEnabled({ editor, enabled: Boolean(input.highlight) });
				applied.push(`highlight=${Boolean(input.highlight)}`);
			}
			if (input.border !== undefined) {
				setCaptionBorderEnabled({ editor, enabled: Boolean(input.border) });
				applied.push(`border=${Boolean(input.border)}`);
			}
			return { text: applied.length ? `Restyled all captions (${applied.join(", ")}).` : "No style change requested." };
		}

		// ── Text & motion graphics ───────────────────────────────────────────
		case "add_text": {
			const content = String(input.content ?? "").trim();
			if (!content) return { text: "Error: content is required for add_text." };
			const playhead = playheadSeconds(editor);
			const ref = insertTextElement({ editor, content });
			if (!ref) return { text: `Could not add text overlay "${content}".` };
			// insertTextElement moves the title later when every text lane is
			// busy at the playhead, so report where it really landed.
			const color = accentColorForText({ content });
			setElementParam({ editor, ref, key: "color", value: color });
			const placed = getElement({ editor, ref });
			const at = placed ? mediaTimeToSeconds({ time: placed.startTime }) : playhead;
			const clearance = await clearanceForTimes({ editor, timeSeconds: [at], preferred: "center" });
			if (clearance.positionY !== null) {
				setElementParam({ editor, ref, key: "transform.positionY", value: clearance.positionY });
			}
			const moved =
				Math.abs(at - playhead) > 0.01
					? ` — after the existing text, because every text lane was busy at the playhead (${playhead.toFixed(2)}s)`
					: "";
			return {
				text: `Added text overlay "${content}" at ${at.toFixed(2)}s${moved} (clip id ${ref.elementId}). Colour ${color}. ${clearance.note}`,
			};
		}

		case "apply_motion_template": {
			const id = String(input.template_id ?? "");
			const { getHtmlTemplateMeta } = await import("../motion-templates/template-meta");
			const tmpl = getHtmlTemplateMeta({ id });
			if (!tmpl) return { text: `Error: no motion template with id "${id}". Call list_motion_templates for valid ids.` };
			const defaults: Record<string, string | number | boolean> = {};
			for (const c of tmpl.controls) defaults[c.id] = c.defaultValue;
			const values = { ...defaults, ...(input.values ?? {}) };
			const start = input.start_seconds !== undefined ? Number(input.start_seconds) : playheadSeconds(editor);
			const duration =
				input.duration_seconds !== undefined ? Number(input.duration_seconds) : tmpl.defaultDuration || 4;
			const ref = insertHtmlTemplateElement({
				editor: ctx.editor,
				templateId: tmpl.id,
				values,
				startSeconds: Math.max(0, start),
				durationSec: Math.max(0.1, duration),
			});
			if (!ref) return { text: `Error: could not place "${tmpl.name}".` };
			return { text: `Placed "${tmpl.name}" at ${start.toFixed(2)}s for ${duration}s (clip id ${ref.elementId}).` };
		}

		case "remove_motion_template": {
			const id = String(input.clip_id ?? "");
			const ref = findHtmlTemplateRef({ editor: ctx.editor, elementId: id });
			if (!ref) return { text: `Error: no motion-graphic clip with id "${id}".` };
			deleteSelected({ editor: ctx.editor, refs: [ref] });
			return { text: `Removed motion-graphic clip ${id}.` };
		}

		// ── Stock B-Roll ─────────────────────────────────────────────────────
		case "add_broll": {
			const query = String(input.query ?? "").trim();
			if (!query) return { text: "Error: query is required for add_broll." };
			try {
				const videos = await searchPexelsVideos({ query, perPage: 4 });
				if (videos.length === 0) return { text: `No stock B-roll found on Pexels for "${query}".` };
				const topVideo = videos[0];
				const dur = input.duration_seconds !== undefined ? Number(input.duration_seconds) : 4;
				const start = input.start_seconds !== undefined ? Number(input.start_seconds) : playheadSeconds(editor);
				const ref = await importPexelsMediaToTimeline({
					editor,
					downloadUrl: topVideo.downloadUrl,
					name: `B-Roll: ${query}`,
					type: "video",
					durationSec: Math.min(dur, topVideo.durationSec || dur),
					startSeconds: start,
				});
				return { text: ref
					? `Downloaded and placed B-roll for "${query}" on overlay track at ${start.toFixed(2)}s.`
					: `Downloaded B-roll for "${query}" but could not place it on timeline.` };
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				return { text: `Could not add B-roll: ${msg}` };
			}
		}

		// ── Voiceover ────────────────────────────────────────────────────────
		case "list_voices": {
			const voices = await listAllVoiceOptions();
			if (voices.length === 0) {
				return { text: "No on-device voices available here. Voiceover needs the iOS or Android app — the browser cannot render speech to a timeline clip." };
			}
			return {
				text:
					`${voices.length} voice(s) available:\n` +
					voices
						.slice(0, 30)
						.map(
							(v) =>
								`- ${v.id} | ${v.name}${v.language ? ` | ${v.language}` : ""} | ${v.quality}` +
								(v.engine === "elevenlabs" ? " | PREMIUM (costs the user credits)" : " | free, on-device"),
						)
						.join("\n") +
					"\nPrefer a free on-device voice unless the user asked for premium quality or their own cloned voice.",
			};
		}

		case "add_voiceover": {
			const text = String(input.text ?? "").trim();
			if (!text) return { text: "Error: text is required for add_voiceover." };
			try {
				// Route to whichever engine owns the requested voice, so the model
				// never has to know which backend a voice id belongs to.
				const all = await listAllVoiceOptions();
				const chosen = all.find((v) => v.id === input.voice_id);
				const res = await generateVoiceover({
					editor,
					text,
					voiceId: input.voice_id,
					languageHint: input.language_hint,
					rate: input.rate !== undefined ? Number(input.rate) : 1,
					startSeconds: input.start_seconds !== undefined ? Number(input.start_seconds) : undefined,
					engine: chosen?.engine ?? "device",
				});
				return {
					text: `Rendered voiceover (${res.durationSec.toFixed(1)}s, ${
						chosen?.engine === "elevenlabs" ? "premium ElevenLabs voice" : "on-device voice"
					}) and placed it on an audio track.`,
				};
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				return { text: `Could not render voiceover: ${msg}` };
			}
		}

		// ── Look ─────────────────────────────────────────────────────────────
		case "apply_color_adjust": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}".` };
			const effectId = ensureSingleEffect({ editor, ref, effectType: "adjust" });
			if (!effectId) return { text: "Error: could not attach an adjustment to that clip (it may not be a visual element)." };
			const applied: string[] = [];
			for (const key of ["brightness", "contrast", "saturation", "temperature"]) {
				if (input[key] === undefined) continue;
				const raw = Number(input[key]);
				if (!Number.isFinite(raw)) continue;
				// The model speaks -1..1 (see the tool schema); the adjust effect's
				// params are -100..100 and the shader divides by 100. Writing the
				// raw value applied ~1% of the requested grade.
				const v = Math.max(-1, Math.min(1, raw));
				const value = Math.round(v * 100);
				updateEffectParam({ editor, ref, effectId, key, value });
				applied.push(`${key}=${v} (${value} on the -100..100 slider)`);
			}
			return { text: applied.length
				? `Applied colour adjust to ${ref.elementId} (${applied.join(", ")}).`
				: "No adjustment values supplied — nothing changed." };
		}

		case "apply_mask": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}". Call get_timeline for valid ids.` };
			const maskType = parseMaskType(String(input.mask_type));
			if (!maskType) {
				return { text: `Error: unknown mask_type "${input.mask_type}". Valid: split, cinematic-bars, rectangle, ellipse, heart, diamond, star, text.` };
			}
			if (!setElementMask({ editor, ref, maskType })) {
				return { text: `Error: clip ${ref.elementId} can't carry a mask (audio/caption clips can't).` };
			}
			if (input.feather !== undefined) {
				updateElementMaskParam({ editor, ref, key: "feather", value: Math.min(100, Math.max(0, Number(input.feather))) });
			}
			if (input.inverted === true) {
				updateElementMaskParam({ editor, ref, key: "inverted", value: true });
			}
			const applied = getElementMask({ editor, ref });
			if (!applied) return { text: `Error: mask "${maskType}" did not apply to ${ref.elementId}.` };
			return {
				text: `Applied ${applied.type} mask to ${ref.elementId}${input.feather ? ` (feather ${input.feather})` : ""}${input.inverted ? ", inverted" : ""}. Call render_frame to see it.`,
			};
		}

		case "remove_mask": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}".` };
			if (!getElementMask({ editor, ref })) {
				return { text: `Clip ${ref.elementId} has no mask; nothing to remove.` };
			}
			removeElementMask({ editor, ref });
			return { text: `Removed the mask from ${ref.elementId}.` };
		}

		case "set_aspect_ratio": {
			const preset = String(input.preset ?? "");
			const size = ASPECT_PRESETS[preset];
			if (!size) return { text: `Error: unsupported preset "${preset}". Use 9:16, 16:9, 1:1 or 4:5.` };
			setProjectResolution({ editor, canvasSize: size });
			const music = musicBedRefusal({ width: size.width, height: size.height });
			return {
				text: `Canvas set to ${preset} (${size.width}x${size.height}).${music ? ` ${music}` : ""}`,
			};
		}

		case "trim_clip": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}". Call get_timeline for valid ids.` };
			const edge = input.edge === "start" || input.edge === "end" ? input.edge : null;
			if (!edge) return { text: `Error: edge must be "start" or "end".` };
			const boundary = Number(input.boundary_seconds);
			if (!Number.isFinite(boundary)) return { text: "Error: boundary_seconds must be a number." };
			const before = getElement({ editor, ref });
			commitElementTrim({
				editor,
				trackId: ref.trackId,
				elementId: ref.elementId,
				edge,
				boundarySec: boundary,
			});
			const after = getElement({ editor, ref });
			if (!before || !after || (after.startTime === before.startTime && after.duration === before.duration)) {
				return {
					text: `Declined: trim of ${ref.elementId} did not move. boundary_seconds is the new ${edge} edge on the timeline, inside the clip.`,
				};
			}
			return { text: `Trimmed ${ref.elementId} ${edge} to ${boundary.toFixed(2)}s. It now runs ${clipRange({ editor, ref })}.` };
		}

		case "move_clip": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}". Call get_timeline for valid ids.` };
			const startSeconds = Number(input.start_seconds);
			if (!Number.isFinite(startSeconds)) return { text: "Error: start_seconds must be a number." };
			const trackId = typeof input.track_id === "string" && input.track_id.trim() ? input.track_id.trim() : undefined;
			const before = getElement({ editor, ref });
			commitElementMove({
				editor,
				trackId: ref.trackId,
				elementId: ref.elementId,
				startSec: startSeconds,
				targetTrackId: trackId,
			});
			const after = getElement({ editor, ref });
			if (!before || !after || after.startTime === before.startTime) {
				return {
					text: `Declined: ${ref.elementId} stayed at ${clipRange({ editor, ref })}. Main-track clips stay butted, so a move only changes them when it reorders the track.`,
				};
			}
			return { text: `Moved ${ref.elementId} to ${clipRange({ editor, ref })}.` };
		}

		case "set_transition": {
			const afterClipId = String(input.after_clip_id ?? "");
			const ref = findRef(ctx, afterClipId);
			if (!ref) return { text: `Error: no clip with id "${afterClipId}". Call get_timeline for valid ids.` };
			const mainId = editor.scenes.getActiveScene().tracks.main.id;
			if (ref.trackId !== mainId) {
				return { text: `Error: transitions are main-track only. ${ref.elementId} is not on the main track.` };
			}
			const kind = String(input.kind ?? "");
			if (kind !== "none" && kind !== "fade" && kind !== "slide" && kind !== "zoom") {
				return { text: `Error: kind must be none, fade, slide, or zoom.` };
			}
			const durationSeconds = input.duration_seconds === undefined ? 0.4 : Number(input.duration_seconds);
			if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
				return { text: "Error: duration_seconds must be greater than 0." };
			}
			setMainTrackTransition({
				editor,
				afterElementId: ref.elementId,
				kind,
				durationSec: durationSeconds,
				applyToAll: input.apply_to_all === true,
			});
			const stored = editor.scenes.getActiveTransitions().find((item) => item.afterElementId === ref.elementId);
			if (kind === "none") {
				return stored
					? { text: `Declined: the transition after ${ref.elementId} is still there.` }
					: { text: `Removed the transition after ${ref.elementId}.` };
			}
			if (!stored) return { text: `Declined: no transition was stored after ${ref.elementId}.` };
			return {
				text: `Set a ${stored.kind} transition after ${ref.elementId} (${durationSeconds.toFixed(2)}s). Fade, slide, and zoom all play as a cross-fade.`,
			};
		}

		case "transform_clip": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return { text: `Error: no clip with id "${input.clip_id}". Call get_timeline for valid ids.` };
			const updates: Array<{ key: string; value: number }> = [];
			const readNumber = (value: unknown): number | null => {
				if (value === undefined) return null;
				const number = Number(value);
				return Number.isFinite(number) ? number : Number.NaN;
			};
			const positionX = readNumber(input.position_x);
			const positionY = readNumber(input.position_y);
			const scale = readNumber(input.scale);
			const rotation = readNumber(input.rotation);
			if ([positionX, positionY, scale, rotation].some((value) => Number.isNaN(value))) {
				return { text: "Error: transform values must be numbers." };
			}
			if (positionX !== null) updates.push({ key: "transform.positionX", value: positionX });
			if (positionY !== null) updates.push({ key: "transform.positionY", value: positionY });
			if (scale !== null) {
				updates.push({ key: "transform.scaleX", value: scale });
				updates.push({ key: "transform.scaleY", value: scale });
			}
			if (rotation !== null) updates.push({ key: "transform.rotate", value: rotation });
			if (updates.length === 0) {
				return { text: "Error: pass position_x, position_y, scale, or rotation." };
			}
			for (const update of updates) {
				// Base params, not a playhead keyframe. A title that only has
				// opacity keys would otherwise move for a single frame.
				setElementParam({ editor, ref, key: update.key, value: update.value });
			}
			const element = getElement({ editor, ref });
			const written = updates
				.map((update) => `${update.key}=${element?.params[update.key] ?? update.value}`)
				.join(", ");
			return { text: `Transformed ${ref.elementId}: ${written}.` };
		}

		case "export_video": {
			const qualityRaw = typeof input.quality === "string" ? input.quality : "high";
			const quality =
				qualityRaw === "low" || qualityRaw === "medium" || qualityRaw === "high" || qualityRaw === "very_high"
					? qualityRaw
					: null;
			if (!quality) return { text: `Error: quality must be low, medium, high, or very_high.` };
			let result;
			try {
				result = await exportActiveProject({
					editor,
					quality,
					format: "mp4",
					fps: editor.project.getActive().settings.fps,
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return { text: `Could not export: ${message}` };
			}
			if (!result.ok) return { text: `Could not export: ${result.error}` };
			const omissionNote =
				result.omissions.length > 0
					? ` Omissions: ${result.omissions.map((item) => item.message).join(" ")}`
					: "";
			const file = result.outputUri ?? "the sandbox export";
			return { text: `Exported ${file}.${omissionNote}` };
		}

		default:
			return { text: `Error: tool "${name}" has no executor.` };
	}
}
