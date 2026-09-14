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
import type { ElementRef } from "@kneecap/editor-core/timeline";
import { mediaTimeToSeconds } from "@kneecap/editor-core/wasm";
import {
	splitAtPlayhead,
	deleteSelected,
	duplicateSelected,
	setRetime,
	setElementParam,
	toggleReversed,
	insertTextElement,
	setProjectResolution,
	seekToSeconds,
	cutDeadSpace,
	ensureSingleEffect,
	updateEffectParam,
} from "../editor/actions";
import {
	generateCaptions,
	getAllCaptions,
	setCaptionHighlightEnabled,
	setCaptionBorderEnabled,
} from "../editor/captions-actions";
import { useHtmlTemplateStore } from "../motion-templates/html-template-store";
import { getAllHtmlTemplates, getHtmlTemplate } from "../motion-templates/registry";
import { AI_TOOL_NAMES } from "./ai-tools";

export interface ToolContext {
	editor: EditorCore;
	currentTimeSeconds: number;
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

/** Flattens the active scene into a simple row list the model can reason over. */
function listClips({ editor }: ToolContext): ClipRow[] {
	const project = editor.project.getActive();
	const scene = project.scenes[0];
	if (!scene) return [];
	const rows: ClipRow[] = [];
	const push = (trackId: string, kind: string, elements: readonly any[]) => {
		for (const el of elements ?? []) {
			const start = el.timeRange?.start;
			const end = el.timeRange?.end;
			const s = start !== undefined ? mediaTimeToSeconds(start) : 0;
			const e = end !== undefined ? mediaTimeToSeconds(end) : 0;
			rows.push({
				id: el.id,
				trackId,
				kind: el.type ?? kind,
				startSeconds: Number(s.toFixed(3)),
				durationSeconds: Number(Math.max(0, e - s).toFixed(3)),
				name: el.params?.content ?? el.name,
			});
		}
	};
	const main = scene.tracks?.main;
	if (main) push(main.id, "video", main.elements);
	for (const t of scene.tracks?.overlay ?? []) push(t.id, "overlay", t.elements);
	for (const t of scene.tracks?.audio ?? []) push(t.id, "audio", t.elements);
	return rows;
}

function findRef(ctx: ToolContext, clipId: string): ElementRef | null {
	const row = listClips(ctx).find((r) => r.id === clipId);
	return row ? { trackId: row.trackId, elementId: row.id } : null;
}

/** First main-track clip — the sensible default target when the model omits an id. */
function firstMainRef(ctx: ToolContext): ElementRef | null {
	const scene = ctx.editor.project.getActive().scenes[0];
	const main = scene?.tracks?.main;
	const el = main?.elements?.[0];
	return main && el ? { trackId: main.id, elementId: el.id } : null;
}

export async function executeTool(
	name: string,
	input: Record<string, any>,
	ctx: ToolContext,
): Promise<string> {
	if (!AI_TOOL_NAMES.has(name)) {
		return `Error: unknown tool "${name}". It does not exist in this app.`;
	}
	const { editor } = ctx;

	switch (name) {
		// ── Introspection ────────────────────────────────────────────────────
		case "get_timeline": {
			const project = editor.project.getActive();
			const clips = listClips(ctx);
			const { width, height } = project.settings.canvasSize;
			if (clips.length === 0) {
				return `Project "${project.metadata.name}" — canvas ${width}x${height}. Timeline is EMPTY. The user must import footage before edits can be made.`;
			}
			const lines = clips.map(
				(c) =>
					`- ${c.id} | ${c.kind} | ${c.startSeconds}s → ${(c.startSeconds + c.durationSeconds).toFixed(3)}s${c.name ? ` | "${String(c.name).slice(0, 40)}"` : ""}`,
			);
			return `Project "${project.metadata.name}" — canvas ${width}x${height}, playhead ${ctx.currentTimeSeconds.toFixed(2)}s.\n${clips.length} clip(s):\n${lines.join("\n")}`;
		}

		case "get_transcript": {
			const captions = getAllCaptions({ editor });
			if (captions.length === 0) {
				return "No transcript yet — no captions exist on this timeline. Call generate_captions first to transcribe the video on-device.";
			}
			const lines = captions.slice(0, 400).map(({ element }: any) => {
				const s = element.timeRange?.start ? mediaTimeToSeconds(element.timeRange.start) : 0;
				return `[${s.toFixed(2)}s] ${element.params?.content ?? ""}`;
			});
			return `Transcript (${captions.length} caption segments):\n${lines.join("\n")}`;
		}

		case "list_motion_templates": {
			const all = getAllHtmlTemplates();
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
			if (matched.length === 0) return `No motion templates matched "${q}". Try a broader term, or omit search.`;
			return `${matched.length} of ${all.length} templates:\n${matched
				.map((t) => `- ${t.id} | ${t.name} | ${t.defaultDuration}s | ${t.description.slice(0, 70)}`)
				.join("\n")}`;
		}

		// ── Timeline surgery ─────────────────────────────────────────────────
		case "seek": {
			const s = Number(input.seconds ?? 0);
			seekToSeconds({ editor, seconds: Math.max(0, s) });
			return `Playhead moved to ${s.toFixed(2)}s.`;
		}

		case "split_clip": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return `Error: no clip with id "${input.clip_id}". Call get_timeline for valid ids.`;
			if (input.at_seconds !== undefined) {
				seekToSeconds({ editor, seconds: Number(input.at_seconds) });
			}
			splitAtPlayhead({ editor, ref });
			return `Split clip ${ref.elementId} at ${(input.at_seconds ?? ctx.currentTimeSeconds).toFixed?.(2) ?? input.at_seconds}s.`;
		}

		case "delete_clip": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return `Error: no clip with id "${input.clip_id}".`;
			deleteSelected({ editor, refs: [ref] });
			return `Deleted clip ${ref.elementId}; following clips closed up.`;
		}

		case "duplicate_clip": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return `Error: no clip with id "${input.clip_id}".`;
			duplicateSelected({ editor, refs: [ref] });
			return `Duplicated clip ${ref.elementId}.`;
		}

		case "cut_silence": {
			const ref = input.clip_id ? findRef(ctx, String(input.clip_id)) : firstMainRef(ctx);
			if (!ref) return "Error: no clip available to de-silence. Import footage first.";
			const outcome = await cutDeadSpace({ editor, ref });
			const status = (outcome as any)?.status;
			if (status === "no-source") return "Could not analyse that clip — it has no decodable audio source.";
			if (status === "no-speech")
				return "Declined: no speech detected in that clip, so cutting 'silence' would have shredded it. Left untouched.";
			const removed = (outcome as any)?.removedSeconds;
			return `Cut dead space from ${ref.elementId}${typeof removed === "number" ? ` — removed ~${removed.toFixed(1)}s` : ""}.`;
		}

		case "set_clip_speed": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return `Error: no clip with id "${input.clip_id}".`;
			const rate = Math.min(4, Math.max(0.25, Number(input.rate ?? 1)));
			setRetime({ editor, ref, rate, maintainPitch: input.maintain_pitch !== false });
			return `Set clip ${ref.elementId} speed to ${rate}x.`;
		}

		case "set_clip_volume": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return `Error: no clip with id "${input.clip_id}".`;
			const db = Number(input.volume_db ?? 0);
			setElementParam({ editor, ref, key: "volume", value: db });
			return `Set clip ${ref.elementId} volume to ${db} dB.`;
		}

		case "reverse_clip": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return `Error: no clip with id "${input.clip_id}".`;
			toggleReversed({ editor, ref });
			return `Toggled reverse on clip ${ref.elementId}.`;
		}

		// ── Captions ─────────────────────────────────────────────────────────
		case "generate_captions": {
			const result = await generateCaptions({ editor, stylePresetId: "default" });
			if (!result) {
				return "Caption generation failed — on-device transcription is unavailable here (it requires the real iOS/Android app, not the browser preview).";
			}
			const count = (result as any)?.captions?.length ?? getAllCaptions({ editor }).length;
			return `Generated ${count} caption segments on-device and added them to the timeline.`;
		}

		case "style_captions": {
			if (getAllCaptions({ editor }).length === 0) {
				return "No captions to style yet — call generate_captions first.";
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
			return applied.length ? `Restyled all captions (${applied.join(", ")}).` : "No style change requested.";
		}

		// ── Text & motion graphics ───────────────────────────────────────────
		case "add_text": {
			const content = String(input.content ?? "").trim();
			if (!content) return "Error: content is required for add_text.";
			const ref = insertTextElement({ editor, content });
			return ref
				? `Added text overlay "${content}" at ${ctx.currentTimeSeconds.toFixed(2)}s.`
				: `Added text overlay "${content}".`;
		}

		case "apply_motion_template": {
			const id = String(input.template_id ?? "");
			const tmpl = getHtmlTemplate(id);
			if (!tmpl) return `Error: no motion template with id "${id}". Call list_motion_templates for valid ids.`;
			const defaults: Record<string, string | number | boolean> = {};
			for (const c of tmpl.controls) defaults[c.id] = c.defaultValue;
			const values = { ...defaults, ...(input.values ?? {}) };
			const start = input.start_seconds !== undefined ? Number(input.start_seconds) : ctx.currentTimeSeconds;
			const duration =
				input.duration_seconds !== undefined ? Number(input.duration_seconds) : tmpl.defaultDuration || 4;
			const clip = useHtmlTemplateStore
				.getState()
				.addClip(tmpl.id, Math.max(0, start), Math.max(0.1, duration), values, "html-track");
			return `Placed "${tmpl.name}" at ${start.toFixed(2)}s for ${duration}s (clip id ${clip.id}).`;
		}

		case "remove_motion_template": {
			const id = String(input.clip_id ?? "");
			const exists = useHtmlTemplateStore.getState().clips.some((c) => c.id === id);
			if (!exists) return `Error: no motion-graphic clip with id "${id}".`;
			useHtmlTemplateStore.getState().removeClip(id);
			return `Removed motion-graphic clip ${id}.`;
		}

		// ── Look ─────────────────────────────────────────────────────────────
		case "apply_color_adjust": {
			const ref = findRef(ctx, String(input.clip_id));
			if (!ref) return `Error: no clip with id "${input.clip_id}".`;
			const effectId = ensureSingleEffect({ editor, ref, effectType: "adjust" });
			if (!effectId) return "Error: could not attach an adjustment to that clip (it may not be a visual element).";
			const applied: string[] = [];
			for (const key of ["brightness", "contrast", "saturation", "temperature"]) {
				if (input[key] !== undefined) {
					const v = Math.max(-1, Math.min(1, Number(input[key])));
					updateEffectParam({ editor, ref, effectId, key, value: v });
					applied.push(`${key}=${v}`);
				}
			}
			return applied.length
				? `Applied colour adjust to ${ref.elementId} (${applied.join(", ")}).`
				: "No adjustment values supplied — nothing changed.";
		}

		case "set_aspect_ratio": {
			const preset = String(input.preset ?? "");
			const size = ASPECT_PRESETS[preset];
			if (!size) return `Error: unsupported preset "${preset}". Use 9:16, 16:9, 1:1 or 4:5.`;
			setProjectResolution({ editor, canvasSize: size });
			return `Canvas set to ${preset} (${size.width}x${size.height}).`;
		}

		default:
			return `Error: tool "${name}" has no executor.`;
	}
}
