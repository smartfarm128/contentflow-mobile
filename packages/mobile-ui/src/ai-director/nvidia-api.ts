import {
	NVIDIA_FAST_MODEL,
	nvidiaModelsFromCatalog,
	type DirectorModel,
} from "./director-models";

/** OpenAI-compatible NVIDIA NIM. GET /v1/models is public; a key is checked
 *  with POST /v1/chat/completions, which returns 401 or 403 for a bad key. */
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

export async function fetchNvidia({
	path,
	init,
	timeoutMs,
}: {
	path: string;
	init: RequestInit;
	timeoutMs: number;
}): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(`${NVIDIA_API_BASE}${path}`, { ...init, signal: controller.signal });
	} catch (error) {
		if (controller.signal.aborted) throw new NvidiaTimeoutError({ timeoutMs });
		throw error;
	} finally {
		clearTimeout(timer);
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
		if (error instanceof NvidiaTimeoutError) {
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
		const response = await fetch(`${NVIDIA_API_BASE}/models`);
		if (!response.ok) return nvidiaModelsFromCatalog([]);
		const data: unknown = await response.json();
		return nvidiaModelsFromCatalog(readModelIds(data));
	} catch {
		return nvidiaModelsFromCatalog([]);
	}
}
