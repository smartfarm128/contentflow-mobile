import {
	NVIDIA_DEFAULT_MODEL,
	nvidiaModelsFromCatalog,
	type DirectorModel,
} from "./director-models";

/** OpenAI-compatible NVIDIA NIM. GET /v1/models is public; a key is checked
 *  with POST /v1/chat/completions, which returns 401 or 403 for a bad key. */
export const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1";

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
}: {
	apiKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
	let response: Response;
	try {
		response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: NVIDIA_DEFAULT_MODEL,
				messages: [{ role: "user", content: "ping" }],
				max_tokens: 1,
			}),
		});
	} catch {
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
