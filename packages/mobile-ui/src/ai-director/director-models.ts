export type AIProvider = "anthropic" | "anselabs" | "nvidia";

export interface DirectorModel {
	id: string;
	label: string;
}

/**
 * Best tool-calling model on the live catalog. A real-key probe returned an
 * OpenAI-style `split_clip` call from this id. kimi, glm, and deepseek did
 * not. It is slow, so Director requests wait several minutes.
 */
export const NVIDIA_DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

/** Smaller tool-calling model kept in the menu when Ultra is too slow. */
export const NVIDIA_FAST_MODEL = "openai/gpt-oss-20b";

export function nvidiaModelLabel(id: string): string {
	if (id === NVIDIA_DEFAULT_MODEL) return `${id} (Best)`;
	if (id === NVIDIA_FAST_MODEL) return `${id} (Fast)`;
	return id;
}

/** Used before /v1/models returns, and when that list has no tool-calling chat model. */
export const NVIDIA_FALLBACK_MODELS: readonly DirectorModel[] = [
	{ id: NVIDIA_DEFAULT_MODEL, label: nvidiaModelLabel(NVIDIA_DEFAULT_MODEL) },
	{ id: NVIDIA_FAST_MODEL, label: nvidiaModelLabel(NVIDIA_FAST_MODEL) },
	{ id: "nvidia/nemotron-3-super-120b-a12b", label: "nvidia/nemotron-3-super-120b-a12b" },
];

const STATIC_MODELS: Record<Exclude<AIProvider, "nvidia">, readonly DirectorModel[]> = {
	anthropic: [
		{ id: "claude-sonnet-5-5", label: "Claude Sonnet 5 (Recommended)" },
		{ id: "claude-opus-5-5", label: "Claude Opus 5.5 (Deep Creative Direction)" },
		{ id: "claude-fable-5-1", label: "Claude Fable 5.1 (Highest Intelligence)" },
	],
	anselabs: [{ id: "hst-coding-beta", label: "Anselabs Beta (hst-coding-beta)" }],
};

let nvidiaCatalog: readonly DirectorModel[] = NVIDIA_FALLBACK_MODELS;

export function rememberNvidiaCatalog(models: readonly DirectorModel[]): void {
	nvidiaCatalog = models.length > 0 ? models : NVIDIA_FALLBACK_MODELS;
}

export function resetNvidiaCatalog(): void {
	nvidiaCatalog = NVIDIA_FALLBACK_MODELS;
}

export function providerLabel(provider: AIProvider): string {
	if (provider === "nvidia") return "NVIDIA";
	if (provider === "anselabs") return "Anselabs";
	return "Anthropic";
}

export function parseDirectorProvider(value: string): AIProvider {
	if (value === "anselabs" || value === "nvidia") return value;
	return "anthropic";
}

export function modelsForProvider(provider: AIProvider): readonly DirectorModel[] {
	if (provider === "nvidia") return nvidiaCatalog;
	return STATIC_MODELS[provider];
}

export function defaultModelFor(provider: AIProvider): string {
	return modelsForProvider(provider)[0].id;
}

/** A model id that belongs to `provider`. Anything else becomes that
 *  provider's default, so a stale or cross-provider id is never sent. */
export function modelForRequest({
	provider,
	model,
}: {
	provider: AIProvider;
	model: string;
}): string {
	const allowed = modelsForProvider(provider).some((entry) => entry.id === model);
	return allowed ? model : defaultModelFor(provider);
}

/**
 * NVIDIA's hosted catalog mixes chat models with embed, guard, and safety
 * models. Tool calling is documented for GPT-OSS, Llama 3.1–3.3, Mistral
 * instruct, and Nemotron 3 nano/super/ultra. Everything else stays off the
 * Director list so a retrieval model is never sent a tool payload.
 */
export function nvidiaModelSupportsTools(id: string): boolean {
	if (/embed|retriev|guard|safety|reward|parse|rerank|gliner|codellama|llama2-|llama-guard|nemotron-4/i.test(id)) {
		return false;
	}
	if (id === "openai/gpt-oss-20b" || id === "openai/gpt-oss-120b") return true;
	if (/^meta\/llama-3\.[123]-/.test(id)) return true;
	if (/^mistralai\/.+(instruct|large)/.test(id)) return true;
	if (/^nv-mistralai\/.+instruct/.test(id)) return true;
	if (/^nvidia\/mistral-.+instruct/.test(id)) return true;
	if (/^nvidia\/llama-3\.[123]-nemotron-.+instruct/.test(id)) return true;
	if (/^nvidia\/llama-3\.1-nemotron-ultra-/.test(id)) return true;
	if (/^nvidia\/nemotron-3-(super|ultra|nano)-/.test(id)) return true;
	if (/^nvidia\/nemotron-nano-3-/.test(id)) return true;
	return false;
}

function nvidiaModelRank(id: string): number {
	if (id === NVIDIA_DEFAULT_MODEL) return 0;
	if (id === NVIDIA_FAST_MODEL) return 1;
	return 2;
}

export function nvidiaModelsFromCatalog(ids: readonly string[]): readonly DirectorModel[] {
	const unique = [...new Set(ids.filter(nvidiaModelSupportsTools))];
	if (!unique.includes(NVIDIA_DEFAULT_MODEL)) unique.push(NVIDIA_DEFAULT_MODEL);
	if (!unique.includes(NVIDIA_FAST_MODEL)) unique.push(NVIDIA_FAST_MODEL);
	unique.sort((left, right) => {
		const byRank = nvidiaModelRank(left) - nvidiaModelRank(right);
		return byRank !== 0 ? byRank : left.localeCompare(right);
	});
	return unique.map((id) => ({ id, label: nvidiaModelLabel(id) }));
}
