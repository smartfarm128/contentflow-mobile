import { afterEach, describe, expect, test } from "bun:test";
import { NVIDIA_DEFAULT_MODEL } from "./director-models";
import { NVIDIA_API_BASE, fetchNvidiaToolModels, validateNvidiaApiKey } from "./nvidia-api";

const ORIGINAL_FETCH = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = ORIGINAL_FETCH;
});

function jsonResponse({ status, body }: { status: number; body: unknown }): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function bearer(init: RequestInit | undefined): string {
	const headers = init?.headers;
	if (!headers || headers instanceof Headers || Array.isArray(headers)) return "";
	const value = headers.Authorization;
	return typeof value === "string" ? value : "";
}

describe("NVIDIA key check", () => {
	test("a 403 from chat completions is a rejected key, not a catalog miss", async () => {
		const calls: string[] = [];
		// eslint-disable-next-line opencut/prefer-object-params -- stand-in for global fetch, whose signature is positional.
		const fetchMock = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			calls.push(String(input));
			const body = typeof init?.body === "string" ? init.body : "";
			expect(body).toContain(NVIDIA_DEFAULT_MODEL);
			expect(body).toContain('"max_tokens":1');
			expect(body).not.toContain("tools");
			expect(bearer(init)).toBe("Bearer nvapi-bad");
			return jsonResponse({
				status: 403,
				body: { status: 403, title: "Forbidden", detail: "Authorization failed" },
			});
		};
		globalThis.fetch = Object.assign(fetchMock, { preconnect: ORIGINAL_FETCH.preconnect });

		const result = await validateNvidiaApiKey({ apiKey: "nvapi-bad" });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toBe("NVIDIA rejected this API key. Authorization failed");
		expect(calls).toEqual([`${NVIDIA_API_BASE}/chat/completions`]);
	});

	test("a network failure names NVIDIA instead of saving the key", async () => {
		const fetchMock = async (_input: RequestInfo | URL): Promise<Response> => {
			throw new TypeError("Failed to fetch");
		};
		globalThis.fetch = Object.assign(fetchMock, { preconnect: ORIGINAL_FETCH.preconnect });
		const result = await validateNvidiaApiKey({ apiKey: "nvapi-offline" });
		expect(result).toEqual({ ok: false, error: "Could not reach NVIDIA to check this key." });
	});

	test("a 200 from the one-token call accepts the key", async () => {
		const fetchMock = async (): Promise<Response> =>
			jsonResponse({
				status: 200,
				body: { choices: [{ message: { content: "p" } }] },
			});
		globalThis.fetch = Object.assign(fetchMock, { preconnect: ORIGINAL_FETCH.preconnect });
		expect(await validateNvidiaApiKey({ apiKey: "nvapi-ok" })).toEqual({ ok: true });
	});
});

describe("NVIDIA model catalog", () => {
	test("keeps tool-calling ids from /v1/models and drops embed and guard models", async () => {
		const fetchMock = async (input: RequestInfo | URL): Promise<Response> => {
			expect(String(input)).toBe(`${NVIDIA_API_BASE}/models`);
			return jsonResponse({
				status: 200,
				body: {
					object: "list",
					data: [
						{ id: "nvidia/nv-embedqa-mistral-7b-v2", object: "model" },
						{ id: "nvidia/llama-3.1-nemoguard-8b-content-safety", object: "model" },
						{ id: "nvidia/nemotron-3-super-120b-a12b", object: "model" },
						{ id: NVIDIA_DEFAULT_MODEL, object: "model" },
						{ id: "not-a-model" },
					],
				},
			});
		};
		globalThis.fetch = Object.assign(fetchMock, { preconnect: ORIGINAL_FETCH.preconnect });
		const models = await fetchNvidiaToolModels();
		expect(models.map((model) => model.id)).toEqual([
			NVIDIA_DEFAULT_MODEL,
			"nvidia/nemotron-3-super-120b-a12b",
		]);
	});
});
