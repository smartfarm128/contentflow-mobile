import { beforeEach, describe, expect, test } from "bun:test";
import {
	NVIDIA_DEFAULT_MODEL,
	NVIDIA_FAST_MODEL,
	defaultModelFor,
	modelForRequest,
	modelsForProvider,
	nvidiaModelsFromCatalog,
	resetNvidiaCatalog,
} from "./director-models";
import { useAIDirectorStore } from "./ai-store";

const PROVIDER_KEY = "cf_director_provider";
const MODEL_KEY = "cf_director_model";
const memory = new Map<string, string>();

describe("director model coupling", () => {
	beforeEach(() => {
		memory.clear();
		Object.defineProperty(globalThis, "localStorage", {
			configurable: true,
			value: {
				getItem: (key: string) => memory.get(key) ?? null,
				setItem: (key: string, value: string) => {
					memory.set(key, value);
				},
				removeItem: (key: string) => {
					memory.delete(key);
				},
			},
		});
		resetNvidiaCatalog();
		useAIDirectorStore.setState({
			selectedProvider: "anthropic",
			selectedModel: defaultModelFor("anthropic"),
		});
	});

	test("each provider has its own model list", () => {
		expect(modelsForProvider("anthropic").map((model) => model.id)).toEqual([
			"claude-sonnet-5-5",
			"claude-opus-5-5",
			"claude-fable-5-1",
		]);
		expect(modelsForProvider("anselabs").map((model) => model.id)).toEqual([
			"hst-coding-beta",
		]);
		expect(modelsForProvider("nvidia").map((model) => model.id).slice(0, 2)).toEqual([
			NVIDIA_DEFAULT_MODEL,
			NVIDIA_FAST_MODEL,
		]);
		expect(modelsForProvider("nvidia")[0]?.label).toContain("Best");
		expect(modelsForProvider("nvidia")[1]?.label).toContain("Fast");
		expect(modelsForProvider("anthropic").some((model) => model.id === "hst-coding-beta")).toBe(
			false,
		);
	});

	test("an invalid model is replaced with the provider default", () => {
		expect(modelForRequest({ provider: "anthropic", model: "hst-coding-beta" })).toBe(
			"claude-sonnet-5-5",
		);
		expect(modelForRequest({ provider: "anselabs", model: "claude-opus-5-5" })).toBe(
			"hst-coding-beta",
		);
		expect(modelForRequest({ provider: "anthropic", model: "claude-opus-5-5" })).toBe(
			"claude-opus-5-5",
		);
		expect(modelForRequest({ provider: "nvidia", model: "claude-opus-5-5" })).toBe(
			NVIDIA_DEFAULT_MODEL,
		);
		expect(modelForRequest({ provider: "anthropic", model: NVIDIA_DEFAULT_MODEL })).toBe(
			"claude-sonnet-5-5",
		);
		expect(modelForRequest({ provider: "nvidia", model: NVIDIA_DEFAULT_MODEL })).toBe(
			NVIDIA_DEFAULT_MODEL,
		);
	});

	test("changing provider resets the model and both are persisted", () => {
		useAIDirectorStore.getState().setSelectedModel("claude-opus-5-5");
		expect(useAIDirectorStore.getState().selectedModel).toBe("claude-opus-5-5");

		useAIDirectorStore.getState().setSelectedProvider("anselabs");
		expect(useAIDirectorStore.getState().selectedProvider).toBe("anselabs");
		expect(useAIDirectorStore.getState().selectedModel).toBe("hst-coding-beta");
		expect(localStorage.getItem(PROVIDER_KEY)).toBe("anselabs");
		expect(localStorage.getItem(MODEL_KEY)).toBe("hst-coding-beta");

		useAIDirectorStore.getState().setSelectedProvider("anthropic");
		expect(useAIDirectorStore.getState().selectedModel).toBe("claude-sonnet-5-5");
		expect(localStorage.getItem(MODEL_KEY)).toBe("claude-sonnet-5-5");

		useAIDirectorStore.getState().setSelectedProvider("nvidia");
		expect(useAIDirectorStore.getState().selectedModel).toBe(NVIDIA_DEFAULT_MODEL);
		expect(localStorage.getItem(PROVIDER_KEY)).toBe("nvidia");
		expect(localStorage.getItem(MODEL_KEY)).toBe(NVIDIA_DEFAULT_MODEL);
	});

	test("a model from the other provider is not stored", () => {
		useAIDirectorStore.getState().setSelectedModel("hst-coding-beta");
		expect(useAIDirectorStore.getState().selectedModel).toBe("claude-sonnet-5-5");
		expect(localStorage.getItem(MODEL_KEY)).not.toBe("hst-coding-beta");
	});

	test("a fetched NVIDIA catalog drops non-tool models and keeps the default first", () => {
		const models = nvidiaModelsFromCatalog([
			"nvidia/nv-embedqa-mistral-7b-v2",
			"nvidia/llama-3.1-nemoguard-8b-content-safety",
			"mistralai/mistral-large-2-instruct",
			NVIDIA_DEFAULT_MODEL,
			"nvidia/nemotron-4-340b-instruct",
			"meta/llama-3.2-90b-vision-instruct",
		]);
		expect(models.map((model) => model.id)).toEqual([
			NVIDIA_DEFAULT_MODEL,
			NVIDIA_FAST_MODEL,
			"meta/llama-3.2-90b-vision-instruct",
			"mistralai/mistral-large-2-instruct",
		]);
		expect(models[0]?.label).toContain("Best");
		expect(models[1]?.label).toContain("Fast");
	});
});
