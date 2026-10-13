import { nativeHttpRequest, NativeHttpError } from "@kneecap/native-bridge";
import {
	NVIDIA_FAST_MODEL,
	nvidiaModelsFromCatalog,
	type DirectorModel,
} from "./director-models";

/** OpenAI-compatible NVIDIA NIM. GET /v1/models is public; a key is checked
 *  with POST /v1/chat/completions, which returns 401 or 403 for a bad key.
 *
 *  integrate.api.nvidia.com does not send Access-Control-Allow-Origin, so
 *  WKWebView fetch throws "Load failed" and hides the status. Requests go
 *  through native HTTP (CapacitorHttp / URLSession / HttpURLConnection).
 *  Probed 2026-10-13: api.anthropic.com, api.ananselabs.org, api.openai.com,
 *  api.pexels.com, and api.elevenlabs.io all send allow-origin *, so those
 *  stay on fetch. */
export const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1";

/** Nemotron Ultra often takes longer than a minute. Each Director turn waits this long. */
export const NVIDIA_REQUEST_TIMEOUT_MS = 180_000;

/** The save-time key check uses the fast model, so it does not wait on Ultra. */
export const NVIDIA_KEY_CHECK_TIMEOUT_MS = 45_000;

/** Tests lower `requestMs` so a hung fetch fails immediately. Production stays at 3 minutes. */
export const nvidiaTimeouts = {
	requestMs: NVIDIA_REQUEST_TIMEOUT_MS,
	keyCheckMs: NVIDIA_KEY_CHECK_TIMEOUT_MS,
};

export class NvidiaTimeoutError extends Error {
	readonly timeoutMs: number;

	constructor({ timeoutMs }: { timeoutMs: number }) {
		const seconds = Math.max(1, Math.round(timeoutMs / 1000));
		const waited = seconds === 1 ? "1 second" : `${seconds} seconds`;
		super(
			`NVIDIA timed out after ${waited}. Nemotron Ultra is slow. Try again, or switch to gpt-oss-20b (Fast) in Settings.`,
		);
		this.name = "NvidiaTimeoutError";
		this.timeoutMs = timeoutMs;
	}
}

/** fetch() threw before any HTTP status. WKWebView reports that as "Load failed". */
export class NvidiaNetworkError extends Error {
	constructor({ detail }: { detail: string }) {
		super(
			`NVIDIA never answered (network or CORS). This is not a rejected key and not a timeout. ${detail}`,
		);
		this.name = "NvidiaNetworkError";
	}
}

function headersRecord(headers: HeadersInit | undefined): Record<string, string> {
	if (!headers) return {};
	if (headers instanceof Headers) {
		const out: Record<string, string> = {};
		headers.forEach((value, key) => {
			out[key] = value;
		});
		return out;
	}
	if (Array.isArray(headers)) {
		const out: Record<string, string> = {};
		for (const pair of headers) {
			const key = pair[0];
			const value = pair[1];
			if (typeof key === "string" && typeof value === "string") out[key] = value;
		}
		return out;
	}
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers)) {
		if (typeof value === "string") out[key] = value;
	}
	return out;
}

export async function fetchNvidia({
	path,
	init,
	timeoutMs,
}: {
	path: string;
	init: RequestInit;
	timeoutMs: number;
}): Promise<Response> {
	try {
		return await nativeHttpRequest({
			url: `${NVIDIA_API_BASE}${path}`,
			method: init.method,
			headers: headersRecord(init.headers),
			body: typeof init.body === "string" ? init.body : undefined,
			timeoutMs,
		});
	} catch (error) {
		if (error instanceof NativeHttpError && error.kind === "timeout") {
			throw new NvidiaTimeoutError({ timeoutMs });
		}
		if (error instanceof NativeHttpError && error.kind === "network") {
			throw new NvidiaNetworkError({ detail: error.message });
		}
		throw error;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readModelIds(data: unknown): string[] {
	if (!isRecord(data) || !Array.isArray(data.data)) return [];
	const ids: string[] = [];
	for (const row of data.data) {
		if (isRecord(row) && typeof row.id === "string") ids.push(row.id);
	}
	return ids;
}

async function readErrorDetail(response: Response): Promise<string> {
	try {
		const data: unknown = await response.json();
		if (isRecord(data) && typeof data.detail === "string") return data.detail.slice(0, 180);
		if (isRecord(data) && typeof data.message === "string") return data.message.slice(0, 180);
	} catch {
		return "";
	}
	return "";
}

/**
 * One-token chat completion. GET /v1/models answers 200 without a valid key,
 * so it cannot gate a save.
 */
export async function validateNvidiaApiKey({
	apiKey,
	timeoutMs = nvidiaTimeouts.keyCheckMs,
}: {
	apiKey: string;
	timeoutMs?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
	let response: Response;
	try {
		response = await fetchNvidia({
			path: "/chat/completions",
			timeoutMs,
			init: {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: NVIDIA_FAST_MODEL,
					messages: [{ role: "user", content: "ping" }],
					max_tokens: 1,
				}),
			},
		});
	} catch (error) {
		if (error instanceof NvidiaTimeoutError || error instanceof NvidiaNetworkError) {
			return { ok: false, error: error.message };
		}
		return { ok: false, error: "Could not reach NVIDIA to check this key." };
	}

	if (response.ok) return { ok: true };
	const detail = await readErrorDetail(response);
	if (response.status === 401 || response.status === 403) {
		return {
			ok: false,
			error: detail ? `NVIDIA rejected this API key. ${detail}` : "NVIDIA rejected this API key.",
		};
	}
	return {
		ok: false,
		error: detail
			? `NVIDIA could not check this key (HTTP ${response.status}). ${detail}`
			: `NVIDIA could not check this key (HTTP ${response.status}).`,
	};
}

/** Tool-calling chat models from GET /v1/models. Falls back when the catalog is unreachable. */
export async function fetchNvidiaToolModels(): Promise<readonly DirectorModel[]> {
	try {
		const response = await nativeHttpRequest({
			url: `${NVIDIA_API_BASE}/models`,
			method: "GET",
			timeoutMs: 20_000,
		});
		if (!response.ok) return nvidiaModelsFromCatalog([]);
		const data: unknown = await response.json();
		return nvidiaModelsFromCatalog(readModelIds(data));
	} catch {
		return nvidiaModelsFromCatalog([]);
	}
}
