/**
 * Claude tool schemas for the mobile AI Director.
 *
 * Every tool here maps to a REAL function in `../editor/actions.ts`,
 * `../editor/captions-actions.ts`, `../editor/voiceover-actions.ts`, or the
 * motion-template store — there are no decorative entries. If a capability
 * does not exist on mobile yet (stock b-roll, generative video), it is
 * deliberately ABSENT rather than declared-and-stubbed: a tool Claude can call
 * but that cannot act is worse than no tool, because the model reports success
 * for an edit that never landed on the timeline.
 */

export interface ClaudeTool {
	name: string;
	description: string;
	input_schema: {
		type: "object";
		properties: Record<string, unknown>;
		required?: string[];
	};
}

export const AI_TOOLS: ClaudeTool[] = [
	// ── Read-only introspection ──────────────────────────────────────────────
	{
		name: "get_timeline",
		description:
			"Read the current timeline: every track, every clip, with ids, start times and durations, plus the playhead position and project settings. " +
			"Call this FIRST before any edit so you act on real clip ids instead of guessing.",
		input_schema: { type: "object", properties: {}, required: [] },
	},
	{
		name: "get_transcript",
		description:
			"Read the spoken transcript of the video with timestamps, if captions have been generated. " +
			"Use before deciding where to cut, what to emphasise, or which words deserve a motion graphic.",
		input_schema: { type: "object", properties: {}, required: [] },
	},
	{
		name: "list_motion_templates",
		description:
			"List available HTML motion-graphic templates (titles, stat callouts, kinetic type, lower thirds, cards). " +
			"Returns ids and names. Call before apply_motion_template so you use a real id.",
		input_schema: {
			type: "object",
			properties: {
				search: { type: "string", description: "Optional keyword filter, e.g. 'stat' or 'title'." },
				limit: { type: "number", description: "Max results. Default 40." },
			},
			required: [],
		},
	},

	// ── Reference style matching ─────────────────────────────────────────────
	{
		name: "analyze_reference_video",
		description:
			"STUDY a reference video the user wants their own footage edited LIKE. Opens the device picker so the user " +
			"chooses the reference, then returns frames sampled across it (images you can look at), its transcript, and " +
			"real words-per-minute pacing statistics. The reference is NEVER added to their timeline — it is a specimen. " +
			"Use this whenever the user says 'edit like this', 'match this style', 'make mine look like this', or shares a " +
			"video as an example. After looking, distil a style read and call save_style_profile to persist it.",
		input_schema: {
			type: "object",
			properties: {
				frame_count: {
					type: "number",
					description: "How many frames to sample across the reference (4-16). Default 10.",
				},
			},
			required: [],
		},
	},
	{
		name: "save_style_profile",
		description:
			"Persist a structured editing Style Profile, normally distilled from analyze_reference_video. Profiles survive " +
			"app restarts, so a style learned from one reference can drive edits on later videos. Describe what you actually " +
			"OBSERVED, concretely — 'cuts every 1.5-2s on sentence ends' beats 'fast paced'. " +
			"Pass its id to propose_plan as style_profile_id so the plan is written against this style.",
		input_schema: {
			type: "object",
			properties: {
				name: { type: "string", description: "Short human name, e.g. 'Punchy talking-head Reel'." },
				pacing: { type: "string", description: "Energy and speech rate, e.g. 'very fast, ~180wpm, no dead air'." },
				cut_rhythm: { type: "string", description: "Cut frequency and triggers, e.g. 'every 1.5-3s, jump cuts on sentence boundaries'." },
				hook_structure: { type: "string", description: "What the opening seconds do, e.g. 'cold-open claim, flash-forward at 0-3s'." },
				caption_style: { type: "string", description: "Font weight, size, position, animation, highlight colors as SEEN in frames." },
				color_grade: { type: "string", description: "Contrast, saturation, shadow/highlight tint." },
				motion_graphic_density: { type: "string", description: "How often overlays appear and what kind." },
				audio_feel: { type: "string", description: "Music/SFX character." },
				notes: { type: "string", description: "Anything else load-bearing about the style." },
			},
			required: ["name"],
		},
	},
	{
		name: "list_style_profiles",
		description:
			"List the Style Profiles saved on this device, with every field. Call before planning a style-matched edit so " +
			"you can plan against a profile the user already captured instead of asking them to re-analyse the same reference.",
		input_schema: { type: "object", properties: {}, required: [] },
	},

	// ── Planning (approval-gated) ────────────────────────────────────────────
	{
		name: "propose_plan",
		description:
			"Propose a complete multi-step edit for the user to review BEFORE anything runs. " +
			"Use this whenever the request covers the whole video — 'edit this for me', 'make this good', 'plan the edit', 'turn this into a Reel' — " +
			"rather than firing a long chain of edits unannounced. Read the timeline (and the transcript, if captions exist) FIRST so the plan fits the real content. " +
			"Each step names a real tool with real arguments and a short plain-language reason the user can judge. " +
			"Call this ONCE and then stop — the user approves, edits or discards it, and approved steps execute automatically. Do not call other tools in the same turn.",
		input_schema: {
			type: "object",
			properties: {
				summary: {
					type: "string",
					description: "One or two sentences on the creative direction you are taking and why.",
				},
				style_profile_id: {
					type: "string",
					description:
						"Id of a saved Style Profile this plan should mimic (from list_style_profiles or save_style_profile). " +
						"Set it whenever the user asked to match a reference video's style.",
				},
				steps: {
					type: "array",
					description: "Ordered steps. Keep it tight — every step must earn its place.",
					items: {
						type: "object",
						properties: {
							tool: { type: "string", description: "Name of the tool to run, e.g. cut_silence." },
							input: { type: "object", description: "Arguments for that tool." },
							reason: {
								type: "string",
								description: "Why this makes the video better, in the user's language — not jargon.",
							},
						},
						required: ["tool", "reason"],
					},
				},
			},
			required: ["summary", "steps"],
		},
	},

	// ── Vision (see the actual frames) ───────────────────────────────────────
	{
		name: "render_frame",
		description:
			"LOOK at the finished composited frame at a given time — video, captions, text and motion graphics all together, exactly as it will export. " +
			"Use this whenever a judgement depends on what is actually on screen: is a caption covering a face? is the text readable over this background? is the framing right? " +
			"Never guess from clip metadata when you can look.",
		input_schema: {
			type: "object",
			properties: {
				at_seconds: { type: "number", description: "Time to look at. Defaults to the playhead." },
			},
			required: [],
		},
	},
	{
		name: "review_composition",
		description:
			"SELF-REVIEW: renders several composited frames spread across the whole video and returns them so you can judge your own work. " +
			"Call this after any meaningful round of edits, BEFORE telling the user you are done. Look critically for: text covering faces, captions clipped off-frame or unreadable, " +
			"black/dead frames, overlapping graphics, motion graphics that outstay their welcome. Then FIX what is wrong instead of reporting success.",
		input_schema: {
			type: "object",
			properties: {
				count: { type: "number", description: "How many frames to sample (1-8). Default 4." },
			},
			required: [],
		},
	},

	// ── Timeline surgery ─────────────────────────────────────────────────────
	{
		name: "seek",
		description: "Move the playhead to a given time in seconds.",
		input_schema: {
			type: "object",
			properties: { seconds: { type: "number", description: "Target time in seconds." } },
			required: ["seconds"],
		},
	},
	{
		name: "split_clip",
		description:
			"Split a clip at a given time (defaults to the current playhead). Use to isolate a section before deleting or restyling it.",
		input_schema: {
			type: "object",
			properties: {
				clip_id: { type: "string", description: "Clip to split. Get ids from get_timeline." },
				at_seconds: { type: "number", description: "Where to cut. Defaults to the playhead." },
			},
			required: ["clip_id"],
		},
	},
	{
		name: "delete_clip",
		description: "Delete a clip from the timeline. Following clips close up magnetically.",
		input_schema: {
			type: "object",
			properties: { clip_id: { type: "string", description: "Clip to delete." } },
			required: ["clip_id"],
		},
	},
	{
		name: "duplicate_clip",
		description: "Duplicate a clip, placing the copy immediately after the original.",
		input_schema: {
			type: "object",
			properties: { clip_id: { type: "string", description: "Clip to duplicate." } },
			required: ["clip_id"],
		},
	},
	{
		name: "cut_silence",
		description:
			"Analyse a clip's audio and remove silent/dead gaps, tightening pacing. " +
			"This is the single highest-value edit for talking-head footage — use it when the user says 'cut silences', 'tighten this', or 'remove pauses'.",
		input_schema: {
			type: "object",
			properties: { clip_id: { type: "string", description: "Clip to de-silence. Defaults to the first main-track clip." } },
			required: [],
		},
	},
	{
		name: "set_clip_speed",
		description: "Change a clip's playback speed (0.25–4.0). Use 2.0 to speed through a slow section, 0.5 for slow-motion emphasis.",
		input_schema: {
			type: "object",
			properties: {
				clip_id: { type: "string" },
				rate: { type: "number", description: "Speed multiplier, e.g. 0.5, 1, 2." },
				maintain_pitch: { type: "boolean", description: "Keep audio pitch natural. Default true." },
			},
			required: ["clip_id", "rate"],
		},
	},
	{
		name: "set_clip_volume",
		description: "Set a clip's volume in decibels. Use negative values to duck music under narration (-12 to -18 is typical).",
		input_schema: {
			type: "object",
			properties: {
				clip_id: { type: "string" },
				volume_db: { type: "number", description: "Volume in dB. 0 = unchanged, -60 = silent." },
			},
			required: ["clip_id", "volume_db"],
		},
	},
	{
		name: "reverse_clip",
		description:
			"Toggle reverse playback on a clip so it plays backwards. " +
			"Use for a rewind beat, a loop-back effect, or when the user asks to reverse or play a shot backwards.",
		input_schema: {
			type: "object",
			properties: { clip_id: { type: "string" } },
			required: ["clip_id"],
		},
	},

	// ── Captions ─────────────────────────────────────────────────────────────
	{
		name: "generate_captions",
		description:
			"Transcribe the video on-device and add word-timed captions to the timeline. " +
			"Call when the user asks for captions, subtitles, or to 'caption this'. Runs entirely offline on the phone.",
		input_schema: {
			type: "object",
			properties: {
				language: { type: "string", description: "BCP-47 code like 'en' or 'es'. Omit for auto-detect." },
			},
			required: [],
		},
	},
	{
		name: "style_captions",
		description: "Restyle every caption at once — toggle the karaoke word-highlight and the outline/border.",
		input_schema: {
			type: "object",
			properties: {
				highlight: { type: "boolean", description: "Karaoke-style active-word highlight." },
				border: { type: "boolean", description: "Outline/stroke for legibility over busy footage." },
			},
			required: [],
		},
	},

	// ── Text & motion graphics ───────────────────────────────────────────────
	{
		name: "add_text",
		description: "Add a text overlay (hook, title, lower third) at the playhead.",
		input_schema: {
			type: "object",
			properties: { content: { type: "string", description: "The text to display. Keep hooks under ~6 words." } },
			required: ["content"],
		},
	},
	{
		name: "apply_motion_template",
		description:
			"Place an animated HTML motion-graphic overlay on the timeline — titles, stat callouts, kinetic typography, cards. " +
			"Call list_motion_templates first to get a valid template_id.",
		input_schema: {
			type: "object",
			properties: {
				template_id: { type: "string", description: "Id from list_motion_templates." },
				start_seconds: { type: "number", description: "Start time. Defaults to the playhead." },
				duration_seconds: { type: "number", description: "Length on the timeline. Defaults to the template's own default." },
				values: {
					type: "object",
					description: "Control overrides keyed by control id, e.g. {\"title\":\"10x Faster\",\"value\":\"92%\"}.",
				},
			},
			required: ["template_id"],
		},
	},
	{
		name: "remove_motion_template",
		description: "Remove a placed motion-graphic overlay by its clip id.",
		input_schema: {
			type: "object",
			properties: { clip_id: { type: "string" } },
			required: ["clip_id"],
		},
	},

	// ── Stock B-Roll (Pexels) ──────────────────────────────────────────────
	{
		name: "add_broll",
		description:
			"Search Pexels for stock B-Roll video matching query and place it on an overlay track at the playhead. " +
			"Use when the user asks for B-roll ('add B-roll of coffee', 'show footage of skyscrapers', etc.).",
		input_schema: {
			type: "object",
			properties: {
				query: { type: "string", description: "Search query for B-roll (e.g. 'coding laptop', 'city sunset')." },
				duration_seconds: { type: "number", description: "How long the B-roll should play. Default 4." },
				start_seconds: { type: "number", description: "Start time on the timeline. Defaults to playhead." },
			},
			required: ["query"],
		},
	},

	// ── Voiceover (on-device TTS) ────────────────────────────────────────────
	{
		name: "list_voices",
		description:
			"List text-to-speech voices installed on this device for voiceover narration. " +
			"Call before add_voiceover if the user asks for a specific voice or language.",
		input_schema: { type: "object", properties: {}, required: [] },
	},
	{
		name: "add_voiceover",
		description:
			"Speak narration on-device and place it on the timeline as a real audio clip. " +
			"Runs offline and free — no API key, no cloud. Use for intros, explainers, or when the user asks you to 'narrate', " +
			"'read this out', or 'add a voiceover'. Keep narration tight; write for the ear, not the page.",
		input_schema: {
			type: "object",
			properties: {
				text: { type: "string", description: "What should be said. Write conversationally." },
				voice_id: { type: "string", description: "Voice id from list_voices. Omit for the device default." },
				language_hint: { type: "string", description: "BCP-47 tag like 'en-US' when no voice_id is given." },
				rate: { type: "number", description: "Speed multiplier 0.5–2.0. 1 = natural." },
				start_seconds: { type: "number", description: "Where to place it. Defaults to the playhead." },
			},
			required: ["text"],
		},
	},

	// ── Look ─────────────────────────────────────────────────────────────────
	{
		name: "apply_color_adjust",
		description:
			"Apply a colour adjustment to a clip — brightness, contrast, saturation, temperature. " +
			"Values are -1..1 where 0 is unchanged. Use small moves (0.1–0.25); heavy grades look amateur.",
		input_schema: {
			type: "object",
			properties: {
				clip_id: { type: "string" },
				brightness: { type: "number" },
				contrast: { type: "number" },
				saturation: { type: "number" },
				temperature: { type: "number" },
			},
			required: ["clip_id"],
		},
	},
	{
		name: "set_aspect_ratio",
		description:
			"Set the project canvas aspect ratio. Use 9:16 for TikTok/Reels/Shorts, 16:9 for YouTube, 1:1 for feed posts.",
		input_schema: {
			type: "object",
			properties: {
				preset: {
					type: "string",
					enum: ["9:16", "16:9", "1:1", "4:5"],
					description: "Target aspect ratio.",
				},
			},
			required: ["preset"],
		},
	},
];

/** Names the executor can actually run — used to reject hallucinated tools. */
export const AI_TOOL_NAMES = new Set(AI_TOOLS.map((t) => t.name));
