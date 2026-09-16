import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  /** Set when this message reports an executed tool call, so the UI can render
   *  it as a compact edit strip instead of a chat bubble. */
  toolName?: string;
  proposal?: {
    type: "plan" | "script" | "storyboard" | "assembly";
    title: string;
    description: string;
    data: any;
    status: "pending" | "approved" | "rejected";
  };
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

export interface IdeaToVideoStage {
  stage: "script" | "storyboard" | "generate" | "assemble";
  script?: string;
  scenes?: Array<{ id: string; prompt: string; duration: number; text: string }>;
  voiceId?: string;
}

interface AIDirectorState {
  apiKey: string;
  selectedModel: string;
  messages: ChatMessage[];
  isStreaming: boolean;
  activeStage: IdeaToVideoStage | null;
  /** The plan awaiting the user's review, if any. Only ever one at a time —
   *  a second proposal replaces the first rather than stacking approvals. */
  pendingPlan: PendingPlan | null;
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateMessageProposal: (id: string, status: "approved" | "rejected") => void;
  setIsStreaming: (streaming: boolean) => void;
  setActiveStage: (stage: IdeaToVideoStage | null) => void;
  setPendingPlan: (plan: PendingPlan | null) => void;
  togglePlanStep: (stepId: string) => void;
  updatePlanStep: (stepId: string, patch: Partial<PlanStep>) => void;
  setPlanStatus: (status: PendingPlan["status"]) => void;
  clearMessages: () => void;
}

export const useAIDirectorStore = create<AIDirectorState>()((set) => ({
  apiKey: typeof localStorage !== "undefined" ? localStorage.getItem("cf_anthropic_api_key") || "" : "",
  selectedModel: "claude-sonnet-5",
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! I'm your AI Director for ContentFlow. Tell me what kind of video you want to make, ask me to cut silences, generate captions, add motion graphics, or produce a video from scratch.",
      timestamp: Date.now(),
    },
  ],
  isStreaming: false,
  activeStage: null,
  pendingPlan: null,

  setApiKey: (key: string) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("cf_anthropic_api_key", key);
    }
    set({ apiKey: key });
  },

  setSelectedModel: (selectedModel: string) => set({ selectedModel }),

  addMessage: (msg) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, newMessage] }));
  },

  updateMessageProposal: (id, status) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id && m.proposal
          ? { ...m, proposal: { ...m.proposal, status } }
          : m,
      ),
    }));
  },

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  setActiveStage: (activeStage) => set({ activeStage }),

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
