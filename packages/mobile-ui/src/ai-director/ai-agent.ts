/**
 * The mobile AI Director agent loop.
 *
 * This is a REAL tool-use loop, not a chat box: Claude is given the tool
 * schemas in `ai-tools.ts`, and every `tool_use` block it returns is executed
 * against the live timeline by `ai-executors.ts`, with the result fed back so
 * it can verify and continue. The user watches edits land on the timeline as
 * the model works, the same way they would if they had tapped the buttons.
 *
 * Multi-provider: routes to either the Anthropic Messages API or an
 * OpenAI-compatible endpoint (e.g. Anselabs) based on the store's
 * `selectedProvider`.  Tool schemas are sent as function-calling tools to
 * both; response parsing adapts to each provider's envelope.
 */
import { useAIDirectorStore } from "./ai-store";
import {
	NVIDIA_FAST_MODEL,
	modelForRequest,
	providerLabel,
	type AIProvider,
} from "./director-models";
import { transportFailureKind } from "@kneecap/native-bridge";
import {
	fetchNvidia,
	NVIDIA_API_BASE,
	NvidiaNetworkError,
	NvidiaTimeoutError,
	nvidiaTimeouts,
} from "./nvidia-api";
import { AI_TOOLS } from "./ai-tools";
import { executeTool, type ToolContext, type ToolOutcome } from "./ai-executors";
import { CREATIVE_DIRECTION } from "./creative-direction";
import { useStyleProfileStore, formatStyleProfile } from "./style-profile-store";
import {
	getActiveAnthropicKey,
	getActiveAnselabsKey,
	getActiveNvidiaKey,
	useVaultStore,
} from "../vault/vault-store";
import { runApprovedPlan, buildPlanReviewPrompt } from "./plan-runner";

export type ExecutionContext = ToolContext;

/** Provider routing. "anthropic" → Anthropic Messages API. "anselabs" and
 *  "nvidia" → OpenAI-compatible chat completions. NVIDIA tool calls use
 *  `tools` plus `tool_choice: "auto"` (NIM requires both). */
export type { AIProvider } from "./director-models";

const ANSELABS_BASE = "https://api.ananselabs.org/v1";

interface OpenAIRoute {
	base: string;
	toolChoice: boolean;
}

function openAIRoute(provider: AIProvider): OpenAIRoute | null {
	if (provider === "anselabs") return { base: ANSELABS_BASE, toolChoice: false };
	if (provider === "nvidia") return { base: NVIDIA_API_BASE, toolChoice: true };
	return null;
}

function openAITools(): Array<Record<string, unknown>> {
	return AI_TOOLS.map((tool) => ({
		type: "function",
		function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
	}));
}

/** Hard stop so a confused model can't loop forever on the user's phone. */
const MAX_TURNS = 12;

/** Room for a long plan or a detailed review; 2048 truncated multi-step plans. */
const MAX_TOKENS = 8192;

/** The selected provider's key. Keys live only in the encrypted Key Vault. */
export function directorKey(provider: AIProvider): string {
	if (provider === "anselabs") return getActiveAnselabsKey();
	if (provider === "nvidia") return getActiveNvidiaKey();
	return getActiveAnthropicKey();
}

/** Why the Director can't run, phrased for the creator — or null if it can. */
function missingKeyMessage(provider: AIProvider): string | null {
	if (directorKey(provider)) return null;
	const name = providerLabel(provider);
	const vault = useVaultStore.getState();
	if (vault.isConfigured && !vault.isUnlocked) {
		return `The Key Vault is locked. Tap the lock icon and enter your PIN so the Director can use your ${name} key.`;
	}
	return `No ${name} key in the Key Vault yet. Tap the lock icon, add your ${name} key, and tap Encrypt & Save.`;
}

/**
 * The chat feed as messages.  Only real conversation goes out: tool
 * strips and local status lines (errors, "no key") are UI, and sending them as
 * assistant turns would put words in the model's mouth.  The window must also
 * open on a user turn.
 */
/** One Messages-API turn. Content is plain text or a list of content blocks
 *  (tool_use / tool_result / image), serialised as-is into the request. */
type ApiMessage = { role: "user" | "assistant"; content: string | unknown[] };

function conversationHistory(): ApiMessage[] {
	const turns: ApiMessage[] = [];
	for (const m of useAIDirectorStore.getState().messages) {
		if (m.toolName || m.local) continue;
		if (m.role === "user" || m.role === "assistant") turns.push({ role: m.role, content: m.content });
	}
	turns.splice(0, Math.max(0, turns.length - 12));
	while (turns.length > 0 && turns[0]!.role !== "user") turns.shift();
	return turns;
}

export const AI_DIRECTOR_PROMPT = CREATIVE_DIRECTION;

/**
 * The system prompt for this turn, with any saved reference styles appended.
 *
 * Saved profiles ride in the SYSTEM prompt, not a tool result, for one reason:
 * a style is standing direction for the whole conversation, not a fact fetched
 * once.  The model should not have to remember to re-read it before every plan
 * — if the creator captured a style, every subsequent edit should be judged
 * against it.
 */
function buildSystemPrompt(): string {
	const profiles = useStyleProfileStore.getState().profiles;
	if (profiles.length === 0) return AI_DIRECTOR_PROMPT;
	const block = profiles.map((p) => `[id: ${p.id}]\n${formatStyleProfile(p)}`).join("\n\n");
	return (
		`${AI_DIRECTOR_PROMPT}\n\n` +
		`## Reference styles this creator has captured\n\n${block}\n\n` +
		`When the user asks for an edit "like the reference" or names one of these, plan against that profile ` +
		`and pass its id as propose_plan's style_profile_id. Match the SPECIFICS — cut rhythm, caption look, ` +
		`hook shape — not just the general vibe. If none of these fit what they are asking for, say so and offer ` +
		`to analyse a new reference rather than guessing.`
	);
}

/** Where tool-use content blocks land in the API response. */
type ResultPart =
	| { type: "text"; text: string }
	| { type: "image"; source: { type: "base64"; media_type: string; data: string } };

/** OpenAI-compatible tool calls are converted into tool_use blocks by
 *  `parseOpenAIReply`, so the loop only ever sees these two shapes. */
type ContentBlock =
	| { type: "text"; text: string }
	| { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

/* ------------------------------------------------------------------ */
/*  Public entry points                                                 */
/* ------------------------------------------------------------------ */

export async function askAIDirector(prompt: string, context: ExecutionContext): Promise<string> {
	const store = useAIDirectorStore.getState();
	store.addMessage({ role: "user", content: prompt });

	const noKey = missingKeyMessage(store.selectedProvider);
	if (noKey) {
		store.addMessage({ role: "assistant", content: noKey, local: true });
		return noKey;
	}

	return driveAgentLoop({ history: conversationHistory(), context });
}

/**
 * Resumes the Director after the user approves a plan: runs the approved
 * steps, then feeds the outcome back so the model reviews its own work.
 * Separate entry point because approval happens on the user's timescale.
 */
export async function executeApprovedPlan(context: ExecutionContext): Promise<string> {
	const store = useAIDirectorStore.getState();
	const summary = await runApprovedPlan({ ctx: context });

	for (const line of summary.lines) {
		store.addMessage({ role: "assistant", content: line.replace(/^- /, ""), toolName: "plan" });
	}

	const noKey = missingKeyMessage(store.selectedProvider);
	if (noKey) {
		const msg = `Applied ${summary.ran} step(s)${summary.failed ? `, ${summary.failed} failed` : ""}. ${noKey}`;
		store.addMessage({ role: "assistant", content: msg, local: true });
		return msg;
	}

	const history = conversationHistory();
	history.push({ role: "user", content: buildPlanReviewPrompt(summary) });

	return driveAgentLoop({ history, context });
}

/* ------------------------------------------------------------------ */
/*  Agent loop                                                          */
/* ------------------------------------------------------------------ */

function isNvidiaServerError(status: number): boolean {
	return status >= 500 && status <= 599;
}

function waitForNvidiaRetry(): Promise<void> {
	const ms = nvidiaTimeouts.retryBackoffMs;
	if (ms <= 0) return Promise.resolve();
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/** One NVIDIA Director turn. A 5xx is retried once after a short pause.
 *  If that retry is also a 5xx, the rest of the run uses gpt-oss-20b. */
async function postNvidiaDirectorTurn({
	model,
	apiKey,
	history,
}: {
	model: string;
	apiKey: string;
	history: ApiMessage[];
}): Promise<{ response: Response; model: string; notice: string | null }> {
	const send = (modelId: string) =>
		fetchNvidia({
			path: "/chat/completions",
			init: {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: modelId,
					max_tokens: MAX_TOKENS,
					messages: [{ role: "system", content: buildSystemPrompt() }, ...toOpenAIMessages(history)],
					tools: openAITools(),
					tool_choice: "auto",
				}),
			},
			timeoutMs: nvidiaTimeouts.requestMs,
		});

	let response = await send(model);
	if (!isNvidiaServerError(response.status)) return { response, model, notice: null };

	const firstStatus = response.status;
	await waitForNvidiaRetry();
	response = await send(model);
	if (!isNvidiaServerError(response.status)) return { response, model, notice: null };
	if (model === NVIDIA_FAST_MODEL) return { response, model, notice: null };

	const notice = `NVIDIA returned ${firstStatus} from ${model}, then ${response.status} after a retry. Switching this run to ${NVIDIA_FAST_MODEL}.`;
	response = await send(NVIDIA_FAST_MODEL);
	return { response, model: NVIDIA_FAST_MODEL, notice };
}

async function driveAgentLoop({
	history,
	context,
}: {
	history: ApiMessage[];
	context: ExecutionContext;
}): Promise<string> {
	const store = useAIDirectorStore.getState();
	store.setIsStreaming(true);

	let finalText = "";

	// One key for the whole run. Reading the vault again on each turn dropped
	// the key to "" once the old 60s lock fired mid-loop, so later turns went
	// out unauthenticated. Backgrounding or the idle lock can still clear the
	// vault while this function is awaiting the network; this snapshot is what
	// those later turns send.
	const provider: AIProvider = store.selectedProvider || "anthropic";
	let requestModel = modelForRequest({ provider, model: store.selectedModel });
	const apiKey = directorKey(provider);
	const openAI = openAIRoute(provider);

	try {
		for (let turn = 0; turn < MAX_TURNS; turn++) {
			const openAIBody = JSON.stringify({
				model: requestModel,
				max_tokens: MAX_TOKENS,
				messages: [{ role: "system", content: buildSystemPrompt() }, ...toOpenAIMessages(history)],
				tools: openAITools(),
				...(openAI?.toolChoice ? { tool_choice: "auto" } : {}),
			});
			const openAIInit: RequestInit = {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: openAIBody,
			};
			// NVIDIA has no CORS headers for capacitor://localhost, so that
			// branch uses native HTTP. Anselabs and Anthropic send
			// Access-Control-Allow-Origin: * (probed 2026-10-13), including
			// Anthropic's browser-access header below. A 5xx from NVIDIA is
			// retried once, then this run switches to the fast model.
			let res: Response;
			if (provider === "nvidia") {
				const nvidiaTurn = await postNvidiaDirectorTurn({
					model: requestModel,
					apiKey,
					history,
				});
				if (nvidiaTurn.notice) {
					store.addMessage({ role: "assistant", content: nvidiaTurn.notice, local: true });
				}
				requestModel = nvidiaTurn.model;
				res = nvidiaTurn.response;
			} else if (openAI) {
				res = await fetch(`${openAI.base}/chat/completions`, openAIInit);
			} else {
				res = await fetch("https://api.anthropic.com/v1/messages", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": apiKey,
						"anthropic-version": "2023-06-01",
						"anthropic-dangerous-direct-browser-access": "true",
					},
					body: JSON.stringify({
						model: requestModel,
						max_tokens: MAX_TOKENS,
						system: buildSystemPrompt(),
						tools: AI_TOOLS,
						messages: history,
					}),
				});
			}

			if (!res.ok) {
				const body = await res.text();
				if (res.status === 401 || res.status === 403) {
					throw new DirectorAuthError({
						provider,
						status: res.status,
						detail: body.slice(0, 180),
					});
				}
				throw new Error(
					`${providerLabel(provider)} API ${res.status}: ${body.slice(0, 200)}`,
				);
			}

			const data: unknown = await res.json();

			// Normalise both providers' envelopes so the rest of the loop
			// treats them identically.
			const { blocks, stop } = provider === "anthropic" ? parseAnthropicReply(data) : parseOpenAIReply(data);

			const text = blocks
				.filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
				.map((b) => b.text)
				.join("\n")
				.trim();

			const toolUses = blocks.filter(
				(b): b is Extract<ContentBlock, { type: "tool_use" }> => b.type === "tool_use",
			);

			// Surface the model's narration between tool batches so the
			// user can follow the reasoning while edits land.
			if (text) {
				finalText = text;
				store.addMessage({ role: "assistant", content: text });
			}

			if (stop === "max_tokens" && toolUses.length === 0) {
				store.addMessage({
					role: "assistant",
					content: "The Director's reply was cut off before it finished. Ask it to continue, or break the request into smaller steps.",
					local: true,
				});
				break;
			}
			if (stop !== "tool_use" || toolUses.length === 0) break;

			history.push({ role: "assistant", content: blocks });

			const results: Array<{ type: "tool_result"; tool_use_id: string; content: string | ResultPart[] }> = [];

			for (const call of toolUses) {
				let outcome: ToolOutcome;
				try {
					outcome = await executeTool(call.name, call.input ?? {}, context);
				} catch (err) {
					outcome = {
						text: `Error running ${call.name}: ${err instanceof Error ? err.message : String(err)}`,
					};
				}
				store.addMessage({
					role: "assistant",
					content: outcome.text,
					toolName: call.name,
				});

				// Vision tools hand back captured frames — send them as real
				// image blocks so the model SEES the composited result.
				const content: ResultPart[] = [{ type: "text", text: outcome.text }];
				for (const frame of outcome.frames ?? []) {
					content.push({
						type: "image" as const,
						source: {
							type: "base64" as const,
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

			history.push({ role: "user", content: results });

			// A proposed plan is an approval gate: stop the loop and let
			// the PlanCard take over.
			if (toolUses.some((c) => c.name === "propose_plan")) {
				store.setIsStreaming(false);
				return finalText || "Proposed a plan for you to review.";
			}
		}

		store.setIsStreaming(false);
		return finalText || "Done.";
	} catch (error) {
		console.error("[AIDirector]", error);
		const msg = directorFailureMessage({ error, provider });
		store.addMessage({ role: "assistant", content: msg, local: true });
		store.setIsStreaming(false);
		return msg;
	}
}

class DirectorAuthError extends Error {
	constructor({
		provider,
		status,
		detail,
	}: {
		provider: AIProvider;
		status: number;
		detail: string;
	}) {
		const extra = detail.trim();
		super(
			extra
				? `${providerLabel(provider)} rejected this API key (${status}). ${extra}`
				: `${providerLabel(provider)} rejected this API key (${status}).`,
		);
		this.name = "DirectorAuthError";
	}
}

function directorFailureMessage({
	error,
	provider,
}: {
	error: unknown;
	provider: AIProvider;
}): string {
	if (
		error instanceof NvidiaTimeoutError ||
		error instanceof NvidiaNetworkError ||
		error instanceof DirectorAuthError
	) {
		return error.message;
	}
	const detail = error instanceof Error ? error.message : String(error);
	const kind = transportFailureKind(error);
	if (kind === "network") {
		return `${providerLabel(provider)} never answered (network or CORS). This is not a rejected key and not a timeout. ${detail}`;
	}
	if (kind === "timeout") {
		return `${providerLabel(provider)} timed out. ${detail}`;
	}
	return `Couldn't reach the AI Director: ${detail}. Check your connection and API key, then try again.`;
}

/* ------------------------------------------------------------------ */
/*  Response normalisers                                                */
/* ------------------------------------------------------------------ */

interface ParsedReply {
	blocks: ContentBlock[];
	stop: "tool_use" | "max_tokens" | "end";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toContentBlock(raw: unknown): ContentBlock | null {
	if (!isRecord(raw)) return null;
	if (raw.type === "text" && typeof raw.text === "string") return { type: "text", text: raw.text };
	if (raw.type === "tool_use" && typeof raw.id === "string" && typeof raw.name === "string") {
		return { type: "tool_use", id: raw.id, name: raw.name, input: isRecord(raw.input) ? raw.input : {} };
	}
	return null;
}

/** An Anthropic /v1/messages response body. */
function parseAnthropicReply(data: unknown): ParsedReply {
	if (!isRecord(data)) return { blocks: [], stop: "end" };
	const blocks: ContentBlock[] = [];
	for (const raw of Array.isArray(data.content) ? data.content : []) {
		const block = toContentBlock(raw);
		if (block) blocks.push(block);
	}
	const reason = data.stop_reason;
	return { blocks, stop: reason === "tool_use" ? "tool_use" : reason === "max_tokens" ? "max_tokens" : "end" };
}

/** Function-call arguments arrive as a JSON string; malformed JSON yields no input rather than a crash. */
function parseArguments(raw: unknown): Record<string, unknown> {
	if (isRecord(raw)) return raw;
	if (typeof raw !== "string") return {};
	try {
		const parsed: unknown = JSON.parse(raw);
		return isRecord(parsed) ? parsed : {};
	} catch {
		return {};
	}
}

/**
 * An OpenAI-compatible /chat/completions response body.  Tool calls ride in
 * `message.tool_calls` alongside (usually string) content; they become
 * tool_use blocks so the loop and history stay in one shape.
 */
function parseOpenAIReply(data: unknown): ParsedReply {
	const choice = isRecord(data) && Array.isArray(data.choices) ? data.choices[0] : undefined;
	if (!isRecord(choice) || !isRecord(choice.message)) return { blocks: [], stop: "end" };
	const message = choice.message;

	const blocks: ContentBlock[] = [];
	if (typeof message.content === "string" && message.content) {
		blocks.push({ type: "text", text: message.content });
	} else if (Array.isArray(message.content)) {
		for (const part of message.content) {
			if (isRecord(part) && typeof part.text === "string") blocks.push({ type: "text", text: part.text });
		}
	}

	for (const call of Array.isArray(message.tool_calls) ? message.tool_calls : []) {
		if (!isRecord(call) || !isRecord(call.function) || typeof call.function.name !== "string") continue;
		blocks.push({
			type: "tool_use",
			id: typeof call.id === "string" ? call.id : `call_${blocks.length}`,
			name: call.function.name,
			input: parseArguments(call.function.arguments),
		});
	}

	// Some compatible servers report "stop" even when they called tools, so
	// the presence of calls decides, not the reason string alone.
	const calledTools = blocks.some((b) => b.type === "tool_use");
	const stop = calledTools || choice.finish_reason === "tool_calls" ? "tool_use" : choice.finish_reason === "length" ? "max_tokens" : "end";
	return { blocks, stop };
}

/** Text of a tool_result's content; images are Anthropic-only and are dropped. */
function toolResultText(content: unknown): string {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content
		.map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
		.filter(Boolean)
		.join("\n");
}

/**
 * The Anthropic-shaped history as OpenAI chat messages: assistant tool_use
 * blocks become `tool_calls`, and each tool_result becomes a `tool` message
 * answering its call id — the pairing OpenAI-compatible servers require.
 */
function toOpenAIMessages(history: ApiMessage[]): Array<Record<string, unknown>> {
	const out: Array<Record<string, unknown>> = [];
	for (const turn of history) {
		if (typeof turn.content === "string") {
			out.push({ role: turn.role, content: turn.content });
			continue;
		}
		if (turn.role === "assistant") {
			const blocks = turn.content.map(toContentBlock).filter((b): b is ContentBlock => b !== null);
			const text = blocks.map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
			const toolCalls = blocks.flatMap((b) =>
				b.type === "tool_use"
					? [{ id: b.id, type: "function", function: { name: b.name, arguments: JSON.stringify(b.input) } }]
					: [],
			);
			out.push({ role: "assistant", content: text || null, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) });
			continue;
		}
		for (const part of turn.content) {
			if (isRecord(part) && part.type === "tool_result" && typeof part.tool_use_id === "string") {
				out.push({ role: "tool", tool_call_id: part.tool_use_id, content: toolResultText(part.content) });
			} else if (isRecord(part) && typeof part.text === "string") {
				out.push({ role: "user", content: part.text });
			}
		}
	}
	return out;
}
