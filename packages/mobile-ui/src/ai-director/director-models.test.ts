import { beforeEach, describe, expect, test } from "bun:test";
import {
	defaultModelFor,
	modelForRequest,
	modelsForProvider,
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
	});

	test("a model from the other provider is not stored", () => {
		useAIDirectorStore.getState().setSelectedModel("hst-coding-beta");
		expect(useAIDirectorStore.getState().selectedModel).toBe("claude-sonnet-5-5");
		expect(localStorage.getItem(MODEL_KEY)).not.toBe("hst-coding-beta");
	});
});
