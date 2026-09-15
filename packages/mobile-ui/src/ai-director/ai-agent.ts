/**
 * The mobile AI Director agent loop.
 *
 * This is a REAL tool-use loop, not a chat box: Claude is given the tool
 * schemas in `ai-tools.ts`, and every `tool_use` block it returns is executed
 * against the live timeline by `ai-executors.ts`, with the result fed back so
 * it can verify and continue. The user watches edits land on the timeline as
 * the model works, the same way they would if they had tapped the buttons.
 */
import { useAIDirectorStore } from "./ai-store";
import { AI_TOOLS } from "./ai-tools";
import { executeTool, type ToolContext, type ToolOutcome } from "./ai-executors";
import { useHtmlTemplateStore } from "../motion-templates/html-template-store";
import { getAllHtmlTemplates } from "../motion-templates/registry";
import { splitAtPlayhead, cutDeadSpace, insertTextElement } from "../editor/actions";
import { CREATIVE_DIRECTION } from "./creative-direction";
import { runApprovedPlan, buildPlanReviewPrompt } from "./plan-runner";
import type { EditorCore } from "@kneecap/editor-core";

export type ExecutionContext = ToolContext;

/** Hard stop so a confused model can't loop forever on the user's phone. */
const MAX_TURNS = 8;

export const AI_DIRECTOR_PROMPT = CREATIVE_DIRECTION;

/** Where Claude's tool-use content blocks land in the API response. */
type ContentBlock =
	| { type: "text"; text: string }
	| { type: "tool_use"; id: string; name: string; input: Record<string, any> };

export async function askAIDirector(prompt: string, context: ExecutionContext): Promise<string> {
	const store = useAIDirectorStore.getState();
	store.addMessage({ role: "user", content: prompt });

	const apiKey = store.apiKey;
	if (!apiKey) {
		const reply = handleLocalCommand(prompt, context);
		store.addMessage({ role: "assistant", content: reply });
		return reply;
	}

	// Conversation transcript in Anthropic wire format, seeded from chat history.
	const history = useAIDirectorStore
		.getState()
		.messages.filter((m) => m.role === "user" || m.role === "assistant")
		.slice(-12)
		.map((m) => ({ role: m.role as "user" | "assistant", content: m.content as any }));

	return driveAgentLoop({ history, context });
}

/**
 * Resumes the Director after the user approves a plan: runs the approved
 * steps, then feeds the outcome back so the model reviews its own work.
 * Separate entry point because approval happens on the user's timescale — the
 * original turn has long since returned.
 */
export async function executeApprovedPlan(context: ExecutionContext): Promise<string> {
	const store = useAIDirectorStore.getState();
	const summary = await runApprovedPlan({ ctx: context });

	for (const line of summary.lines) {
		store.addMessage({ role: "assistant", content: line.replace(/^- /, ""), toolName: "plan" });
	}

	// No key: the steps still ran (they are local tool calls), there is just no
	// model available to review them. Say so rather than implying a review.
	if (!store.apiKey) {
		const msg = `Applied ${summary.ran} step(s)${summary.failed ? `, ${summary.failed} failed` : ""}. Add an API key for the Director to review the result.`;
		store.addMessage({ role: "assistant", content: msg });
		return msg;
	}

	const history = useAIDirectorStore
		.getState()
		.messages.filter((m) => m.role === "user" || m.role === "assistant")
		.slice(-12)
		.map((m) => ({ role: m.role as "user" | "assistant", content: m.content as any }));
	history.push({ role: "user", content: buildPlanReviewPrompt(summary) as any });

	return driveAgentLoop({ history, context });
}

async function driveAgentLoop({
	history,
	context,
}: {
	history: Array<{ role: "user" | "assistant"; content: any }>;
	context: ExecutionContext;
}): Promise<string> {
	const store = useAIDirectorStore.getState();
	store.setIsStreaming(true);

	let finalText = "";

	try {
		for (let turn = 0; turn < MAX_TURNS; turn++) {
			const res = await fetch("https://api.anthropic.com/v1/messages", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": useAIDirectorStore.getState().apiKey,
					"anthropic-version": "2023-06-01",
					"anthropic-dangerous-direct-browser-access": "true",
				},
				body: JSON.stringify({
					model: useAIDirectorStore.getState().selectedModel || "claude-sonnet-5",
					max_tokens: 2048,
					system: AI_DIRECTOR_PROMPT,
					tools: AI_TOOLS,
					messages: history,
				}),
			});

			if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);

			const data = await res.json();
			const blocks: ContentBlock[] = data.content ?? [];
			const text = blocks
				.filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
				.map((b) => b.text)
				.join("\n")
				.trim();
			const toolUses = blocks.filter(
				(b): b is Extract<ContentBlock, { type: "tool_use" }> => b.type === "tool_use",
			);

			// Surface the model's narration between tool batches so the user can
			// follow the reasoning while edits land.
			if (text) {
				finalText = text;
				store.addMessage({ role: "assistant", content: text });
			}

			if (data.stop_reason !== "tool_use" || toolUses.length === 0) break;

			history.push({ role: "assistant", content: blocks as any });

			const results = [];
			for (const call of toolUses) {
				let outcome: ToolOutcome;
				try {
					outcome = await executeTool(call.name, call.input ?? {}, context);
				} catch (err) {
					outcome = {
						text: `Error running ${call.name}: ${err instanceof Error ? err.message : String(err)}`,
					};
				}
				// Show each executed edit as a tool strip in the chat.
				store.addMessage({
					role: "assistant",
					content: outcome.text,
					toolName: call.name,
				});

				// Vision tools hand back captured frames — send them as real image
				// blocks so the model SEES the composited result rather than being
				// told about it in prose.
				const content: any[] = [{ type: "text", text: outcome.text }];
				for (const frame of outcome.frames ?? []) {
					content.push({
						type: "image",
						source: {
							type: "base64",
							media_type: frame.mediaType,
							data: frame.base64,
						},
					});
				}

				results.push({
					type: "tool_result",
					tool_use_id: call.id,
					content: outcome.frames?.length ? content : outcome.text,
				});
			}

			history.push({ role: "user", content: results as any });

			// A proposed plan is an approval gate: the model must not keep
			// editing behind it. Stop the loop and let the PlanCard take over.
			if (toolUses.some((c) => c.name === "propose_plan")) {
				store.setIsStreaming(false);
				return finalText || "Proposed a plan for you to review.";
			}
		}

		store.setIsStreaming(false);
		return finalText || "Done.";
	} catch (error) {
		console.error("[AIDirector]", error);
		const msg = `Couldn't reach the AI Director: ${error instanceof Error ? error.message : String(error)}. Quick actions below still work offline.`;
		store.addMessage({ role: "assistant", content: msg });
		store.setIsStreaming(false);
		return msg;
	}
}

/**
 * Keyless fallback. Deliberately small: it performs the handful of edits we can
 * resolve from plain keywords, and is honest that it is not the real Director.
 */
function handleLocalCommand(prompt: string, context: ExecutionContext): string {
	const lower = prompt.toLowerCase();
	const project = context.editor.project.getActive();
	const main = project.scenes[0]?.tracks?.main;
	const firstRef = main?.elements?.[0]
		? { trackId: main.id, elementId: main.elements[0].id }
		: null;

	if (lower.includes("silence") || lower.includes("dead space") || lower.includes("pause")) {
		if (!firstRef) return "There's no footage on the timeline yet — import a clip first.";
		void cutDeadSpace({ editor: context.editor, ref: firstRef });
		return "Cutting dead space from your main clip to tighten the pacing.";
	}

	if (lower.includes("split") || lower.includes("cut at playhead")) {
		if (!firstRef) return "Nothing to split — the timeline is empty.";
		splitAtPlayhead({ editor: context.editor, ref: firstRef });
		return `Split the clip at ${context.currentTimeSeconds.toFixed(2)}s.`;
	}

	if (lower.includes("motion") || lower.includes("graphic") || lower.includes("title")) {
		const all = getAllHtmlTemplates();
		const match = all.find((t) => lower.includes(t.name.toLowerCase())) ?? all[0];
		if (match) {
			const values: Record<string, string | number | boolean> = {};
			for (const c of match.controls) values[c.id] = c.defaultValue;
			useHtmlTemplateStore
				.getState()
				.addClip(match.id, context.currentTimeSeconds, match.defaultDuration || 4, values, "html-track");
			return `Added the "${match.name}" motion graphic at ${context.currentTimeSeconds.toFixed(2)}s. Tap Templates to edit its text and colours.`;
		}
	}

	if (lower.includes("caption") || lower.includes("subtitle")) {
		insertTextElement({ editor: context.editor, content: "New Caption" });
		return "Added a caption overlay. For full automatic transcription, open Captions in the toolbar.";
	}

	return "Add your Anthropic API key in the Director settings (the slider icon) to unlock the full AI Director — it can then plan and execute complete edits for you. Without a key I can still handle: cut silences, split clip, add motion title, add caption.";
}
