export type AIProvider = "anthropic" | "anselabs";

export interface DirectorModel {
	id: string;
	label: string;
}

const MODELS: Record<AIProvider, readonly DirectorModel[]> = {
	anthropic: [
		{ id: "claude-sonnet-5-5", label: "Claude Sonnet 5 (Recommended)" },
		{ id: "claude-opus-5-5", label: "Claude Opus 5.5 (Deep Creative Direction)" },
		{ id: "claude-fable-5-1", label: "Claude Fable 5.1 (Highest Intelligence)" },
	],
	anselabs: [{ id: "hst-coding-beta", label: "Anselabs Beta (hst-coding-beta)" }],
};

export function modelsForProvider(provider: AIProvider): readonly DirectorModel[] {
	return MODELS[provider];
}

export function defaultModelFor(provider: AIProvider): string {
	return MODELS[provider][0].id;
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
	const allowed = MODELS[provider].some((entry) => entry.id === model);
	return allowed ? model : defaultModelFor(provider);
}
