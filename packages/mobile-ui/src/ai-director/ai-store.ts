import { create } from "zustand";
import {
	defaultModelFor,
	modelForRequest,
	parseDirectorProvider,
	type AIProvider,
} from "./director-models";

const PROVIDER_KEY = "cf_director_provider";
const MODEL_KEY = "cf_director_model";

function readStorage(key: string): string | null {
	try {
		if (typeof localStorage === "undefined") return null;
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStorage({ key, value }: { key: string; value: string }): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(key, value);
	} catch {
		// Private mode and bun tests without storage still keep the in-memory pick.
	}
}

function loadSelection(): { selectedProvider: AIProvider; selectedModel: string } {
	const selectedProvider = parseDirectorProvider(readStorage(PROVIDER_KEY) ?? "");
	const selectedModel = modelForRequest({
		provider: selectedProvider,
		model: readStorage(MODEL_KEY) ?? "",
	});
	return { selectedProvider, selectedModel };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  /** Set when this message reports an executed tool call, so the UI can render
   *  it as a compact edit strip instead of a chat bubble. */
  toolName?: string;
  /** A status line produced by the app (no key, network error, truncation),
   *  not by the model. Shown in the feed, never sent back to the API. */
  local?: boolean;
}

/**
 * One reviewable step of a proposed edit plan. `tool`/`input` are exactly what
 * would be handed to `executeTool`, so an approved plan runs through the same
 * path a direct tool call does — no second execution engine to drift.
 */
export interface PlanStep {
  id: string;
  tool: string;
  input: Record<string, any>;
  /** Plain-language justification shown to the user. */
  reason: string;
  /** Unchecked steps are skipped at execution. */
  enabled: boolean;
  status: "pending" | "running" | "done" | "failed" | "skipped";
  /** Executor result, once run. */
  result?: string;
}

export interface PendingPlan {
  id: string;
  summary: string;
  steps: PlanStep[];
  status: "awaiting-approval" | "running" | "complete" | "discarded";
  /** Set when the plan was written to match a saved reference style — the
   *  card shows the name so the user can see WHICH style is being copied. */
  styleProfileId?: string;
  styleProfileName?: string;
}

interface AIDirectorState {
  selectedModel: string;
  selectedProvider: AIProvider;
  messages: ChatMessage[];
  isStreaming: boolean;
  /** The plan awaiting the user's review, if any. Only ever one at a time —
   *  a second proposal replaces the first rather than stacking approvals. */
  pendingPlan: PendingPlan | null;
  setSelectedModel: (model: string) => void;
  setSelectedProvider: (provider: AIProvider) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  setIsStreaming: (streaming: boolean) => void;
  setPendingPlan: (plan: PendingPlan | null) => void;
  togglePlanStep: (stepId: string) => void;
  updatePlanStep: (stepId: string, patch: Partial<PlanStep>) => void;
  setPlanStatus: (status: PendingPlan["status"]) => void;
  clearMessages: () => void;
}

export const useAIDirectorStore = create<AIDirectorState>()((set) => ({
  ...loadSelection(),
  // Starts empty: every message in the feed is either the user's or the
  // model's. A scripted greeting would be sent to the API as something the
  // model "said".
  messages: [],
  isStreaming: false,
  pendingPlan: null,

  setSelectedModel: (requested: string) =>
    set((state) => {
      const selectedModel = modelForRequest({
        provider: state.selectedProvider,
        model: requested,
      });
      if (selectedModel !== requested) return state;
      writeStorage({ key: MODEL_KEY, value: selectedModel });
      return { selectedModel };
    }),

  setSelectedProvider: (selectedProvider: AIProvider) => {
    const selectedModel = defaultModelFor(selectedProvider);
    writeStorage({ key: PROVIDER_KEY, value: selectedProvider });
    writeStorage({ key: MODEL_KEY, value: selectedModel });
    set({ selectedProvider, selectedModel });
  },


  addMessage: (msg) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, newMessage] }));
  },

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  setPendingPlan: (pendingPlan) => set({ pendingPlan }),

  togglePlanStep: (stepId) =>
    set((s) =>
      s.pendingPlan
        ? {
            pendingPlan: {
              ...s.pendingPlan,
              steps: s.pendingPlan.steps.map((step) =>
                step.id === stepId ? { ...step, enabled: !step.enabled } : step,
              ),
            },
          }
        : s,
    ),

  updatePlanStep: (stepId, patch) =>
    set((s) =>
      s.pendingPlan
        ? {
            pendingPlan: {
              ...s.pendingPlan,
              steps: s.pendingPlan.steps.map((step) =>
                step.id === stepId ? { ...step, ...patch } : step,
              ),
            },
          }
        : s,
    ),

  setPlanStatus: (status) =>
    set((s) => (s.pendingPlan ? { pendingPlan: { ...s.pendingPlan, status } } : s)),

  clearMessages: () => set({ messages: [] }),
}));
