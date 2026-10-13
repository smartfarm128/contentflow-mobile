import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { askAIDirector } from "./ai-agent";
import { AI_TOOLS } from "./ai-tools";
import { useAIDirectorStore } from "./ai-store";
import { NVIDIA_API_BASE, NVIDIA_REQUEST_TIMEOUT_MS, nvidiaTimeouts } from "./nvidia-api";
import { NVIDIA_DEFAULT_MODEL, resetNvidiaCatalog } from "./director-models";
import type { ToolContext } from "./ai-executors";
import { resetVaultStorage } from "../vault/crypto-vault";
import { eraseLegacyPlaintextKeys, getActiveNvidiaKey, useVaultStore } from "../vault/vault-store";

// Unknown-tool turns return before touching the editor.
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any -- empty on purpose
const context: ToolContext = { editor: {} as any };

const ORIGINAL_FETCH = globalThis.fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toolName(tool: unknown): string {
	if (!isRecord(tool) || tool.type !== "function" || !isRecord(tool.function)) return "";
	return typeof tool.function.name === "string" ? tool.function.name : "";
}

function jsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

function disarmIdleTimer(): void {
	const timer = useVaultStore.getState().autoLockTimer;
	if (timer) clearTimeout(timer);
	useVaultStore.setState({ autoLockTimer: null });
}

beforeEach(() => {
	resetVaultStorage();
	eraseLegacyPlaintextKeys();
	resetNvidiaCatalog();
	useVaultStore.getState().lock();
	useAIDirectorStore.setState({
		messages: [],
		isStreaming: false,
		pendingPlan: null,
		selectedProvider: "nvidia",
		selectedModel: "claude-opus-5-5",
	});
});

afterEach(() => {
	globalThis.fetch = ORIGINAL_FETCH;
	nvidiaTimeouts.requestMs = NVIDIA_REQUEST_TIMEOUT_MS;
	disarmIdleTimer();
	useVaultStore.getState().lock();
});

describe("NVIDIA Director tool calling", () => {
	it("sends every Director tool in OpenAI format and feeds the tool result back", async () => {
		await useVaultStore.getState().setupVault("2468", { nvidia: "nvapi-test" });
		expect(getActiveNvidiaKey()).toBe("nvapi-test");
		disarmIdleTimer();

		const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
		// eslint-disable-next-line opencut/prefer-object-params -- stand-in for global fetch
		const fetchMock = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			const parsed: unknown = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
			requests.push({ url: String(input), body: isRecord(parsed) ? parsed : {} });
			if (requests.length === 1) {
				return jsonResponse({
					choices: [
						{
							finish_reason: "tool_calls",
							message: {
								role: "assistant",
								content: null,
								tool_calls: [
									{
										id: "call_1",
										type: "function",
										function: { name: "definitely_not_a_tool", arguments: "{\"clip\":\"a\"}" },
									},
								],
							},
						},
					],
				});
			}
			return jsonResponse({
				choices: [{ finish_reason: "stop", message: { role: "assistant", content: "Ready." } }],
			});
		};
		globalThis.fetch = Object.assign(fetchMock, { preconnect: ORIGINAL_FETCH.preconnect });

		const reply = await askAIDirector("Cut the silent pauses", context);
		expect(reply).toContain("Ready.");
		expect(requests).toHaveLength(2);
		expect(requests[0]?.url).toBe(`${NVIDIA_API_BASE}/chat/completions`);
		expect(requests[0]?.body.model).toBe(NVIDIA_DEFAULT_MODEL);
		expect(requests[0]?.body.tool_choice).toBe("auto");

		const tools = requests[0]?.body.tools;
		expect(Array.isArray(tools)).toBe(true);
		const names = Array.isArray(tools) ? tools.map(toolName) : [];
		expect(names).toEqual(AI_TOOLS.map((tool) => tool.name));
		expect(names).toHaveLength(AI_TOOLS.length);

		const second = requests[1]?.body.messages;
		expect(Array.isArray(second)).toBe(true);
		const messages = Array.isArray(second) ? second : [];
		const toolMessage = messages.map((message) => (isRecord(message) ? message : null)).find((message) => message?.role === "tool");
		expect(toolMessage?.tool_call_id).toBe("call_1");
		expect(String(toolMessage?.content)).toContain("definitely_not_a_tool");

		useVaultStore.getState().lock();
		expect(getActiveNvidiaKey()).toBe("");
	});

	it("turns a hung NVIDIA call into a timeout message and clears the thinking state", async () => {
		await useVaultStore.getState().setupVault("2468", { nvidia: "nvapi-slow" });
		disarmIdleTimer();
		nvidiaTimeouts.requestMs = 20;
		// eslint-disable-next-line opencut/prefer-object-params -- stand-in for global fetch, whose signature is positional.
		const fetchMock = (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
			new Promise((_resolve, reject) => {
				init?.signal?.addEventListener("abort", () => {
					reject(Object.assign(new Error("The operation was aborted"), { name: "AbortError" }));
				});
			});
		globalThis.fetch = Object.assign(fetchMock, { preconnect: ORIGINAL_FETCH.preconnect });

		const reply = await askAIDirector("Add a title", context);
		expect(reply).toContain("NVIDIA timed out after");
		expect(reply).not.toContain("Couldn't reach");
		expect(useAIDirectorStore.getState().isStreaming).toBe(false);
		nvidiaTimeouts.requestMs = NVIDIA_REQUEST_TIMEOUT_MS;
	});

	it("names a WKWebView Load failed as network or CORS, not a bad key", async () => {
		await useVaultStore.getState().setupVault("2468", { nvidia: "nvapi-ok" });
		disarmIdleTimer();
		const fetchMock = async (): Promise<Response> => {
			throw new TypeError("Load failed");
		};
		globalThis.fetch = Object.assign(fetchMock, { preconnect: ORIGINAL_FETCH.preconnect });

		const reply = await askAIDirector("Say ready", context);
		expect(reply).toContain("network or CORS");
		expect(reply).toContain("Load failed");
		expect(reply).not.toContain("rejected this API key");
		expect(reply).not.toContain("timed out");
		expect(reply).not.toContain("Couldn't reach");
		expect(useAIDirectorStore.getState().isStreaming).toBe(false);
	});

	it("names a 401 as a rejected key", async () => {
		await useVaultStore.getState().setupVault("2468", { nvidia: "nvapi-bad" });
		disarmIdleTimer();
		const fetchMock = async (): Promise<Response> =>
			new Response(JSON.stringify({ detail: "Authorization failed" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		globalThis.fetch = Object.assign(fetchMock, { preconnect: ORIGINAL_FETCH.preconnect });

		const reply = await askAIDirector("Say ready", context);
		expect(reply).toContain("NVIDIA rejected this API key (401)");
		expect(reply).toContain("Authorization failed");
		expect(reply).not.toContain("network or CORS");
		expect(reply).not.toContain("timed out");
		expect(useAIDirectorStore.getState().isStreaming).toBe(false);
	});
});
