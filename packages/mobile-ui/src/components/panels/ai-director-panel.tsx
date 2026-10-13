import React, { useState, useRef, useEffect } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import { useAIDirectorStore } from "../../ai-director/ai-store";
import {
  NVIDIA_DEFAULT_MODEL,
  modelsForProvider,
  providerLabel,
  rememberNvidiaCatalog,
  type AIProvider,
} from "../../ai-director/director-models";
import { fetchNvidiaToolModels } from "../../ai-director/nvidia-api";
import { askAIDirector, executeApprovedPlan } from "../../ai-director/ai-agent";
import { PlanCard } from "./plan-card";
import type { EditorCore } from "@kneecap/editor-core";
import {
  Sparkles,
  Send,
  Sliders,
  Scissors,
  Captions,
  Film,
  Wrench,
  Clapperboard,
  Lock,
} from "lucide-react";
import { CC_ICON_STROKE } from "../../tokens";
import { useVaultStore } from "../../vault/vault-store";

interface AIDirectorPanelProps {
  editor: EditorCore;
  onClose: () => void;
  /** Opens the encrypted Key Vault — the ONLY place an API key is entered. */
  onOpenVault?: () => void;
}

export function AIDirectorPanel({
  editor,
  onClose,
  onOpenVault,
}: AIDirectorPanelProps) {
  const [inputPrompt, setInputPrompt] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFeedRef = useRef<HTMLDivElement>(null);

  const messages = useAIDirectorStore((s) => s.messages);
  const isStreaming = useAIDirectorStore((s) => s.isStreaming);
  const vaultConfigured = useVaultStore((s) => s.isConfigured);
  const vaultUnlocked = useVaultStore((s) => s.isUnlocked);
  const vaultAnthropicKey = useVaultStore((s) => s.keys.anthropic);
  const selectedModel = useAIDirectorStore((s) => s.selectedModel);
  const setSelectedModel = useAIDirectorStore((s) => s.setSelectedModel);
  const selectedProvider = useAIDirectorStore((s) => s.selectedProvider);
  const setSelectedProvider = useAIDirectorStore((s) => s.setSelectedProvider);
  const vaultAnselabsKey = useVaultStore((s) => s.keys.anselabs);
  const vaultNvidiaKey = useVaultStore((s) => s.keys.nvidia);
  const [nvidiaModels, setNvidiaModels] = useState(modelsForProvider("nvidia"));
  const providerName = providerLabel(selectedProvider);
  const statusModel =
    selectedProvider === "anthropic"
      ? selectedModel.replace("claude-", "")
      : selectedProvider === "anselabs"
        ? "Anselabs"
        : selectedModel;
  const thinkingLabel =
    selectedProvider === "nvidia" && selectedModel === NVIDIA_DEFAULT_MODEL
      ? "NVIDIA is thinking. Nemotron Ultra can take a few minutes."
      : selectedProvider === "nvidia"
        ? "NVIDIA is thinking…"
        : "Director is thinking and reviewing footage…";
  const hasProviderKey = Boolean(
    selectedProvider === "anselabs"
      ? vaultAnselabsKey
      : selectedProvider === "nvidia"
        ? vaultNvidiaKey
        : vaultAnthropicKey,
  );

  useEffect(() => {
    if (selectedProvider !== "nvidia") return;
    let cancelled = false;
    void fetchNvidiaToolModels().then((models) => {
      if (cancelled) return;
      rememberNvidiaCatalog(models);
      setNvidiaModels(models);
      const current = useAIDirectorStore.getState().selectedModel;
      const next = models.some((model) => model.id === current) ? current : models[0]?.id;
      if (next && next !== current) useAIDirectorStore.getState().setSelectedModel(next);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedProvider]);

  // Scroll the FEED only, by setting its own scrollTop — never
  // `scrollIntoView`. The sheet body (`.cc-sheet__body`) is also scrollable,
  // and scrollIntoView walks up and scrolls every scrollable ancestor: measured
  // live, eight messages dragged the sheet body down 149px and pushed the
  // "Director Mode" status bar 133px up behind the sticky sheet header.
  useEffect(() => {
    const feed = chatFeedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [messages, isStreaming]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isStreaming) return;
    setInputPrompt("");

    // No playhead snapshot: the executors read the live playhead, so a
    // `seek` mid-turn is honoured by every later step.
    await askAIDirector(text, { editor });
  };

  const quickChips = [
    {
      label: "Match a Reference",
      icon: Clapperboard,
      action:
        "I want my video edited in the style of a reference video. Analyse the reference I pick, save its style profile, then plan an edit of my footage that matches it.",
    },
    { label: "Cut Silences", icon: Scissors, action: "Cut all silent pauses in the video" },
    { label: "Auto Captions", icon: Captions, action: "Add subtitles to the video" },
    { label: "Motion Graphic", icon: Film, action: "Add an energetic motion title overlay" },
  ];

  return (
    <PanelSheet
      onScrimClick={onClose}
      header={
        <SheetHeader
          title="AI Director"
          onClose={onClose}
        />
      }
    >
      <div className="cc-director">
        {/* Model Bar + Settings Button */}
        <div className="cc-director__status-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} strokeWidth={CC_ICON_STROKE} />
            <span>{isStreaming ? `Thinking… ${statusModel}` : `Director Mode · ${statusModel}`}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: showSettings ? "var(--cc-accent)" : "rgba(255, 255, 255, 0.08)",
              color: showSettings ? "var(--cc-accent-contrast)" : "var(--cc-text-primary)",
              border: "none",
              borderRadius: "8px",
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <Sliders size={12} strokeWidth={CC_ICON_STROKE} />
            <span>Settings</span>
          </button>
        </div>

        {/* Settings Drawer */}
        {showSettings && (
          <div className="cc-settings-drawer">
            {/* The key itself is NEVER typed or shown here — it lives encrypted
                in the Key Vault. This row reports status and routes there, so a
                borrowed phone cannot surface a paid key from a tool panel. */}
            <div>
              <span className="cc-form-label">{providerName} API Key</span>
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                  onOpenVault?.();
                }}
                className="cc-vault-link-btn"
              >
                <Lock size={13} strokeWidth={CC_ICON_STROKE} />
                <span>
                  {!vaultConfigured
                    ? "Set up Key Vault"
                    : vaultUnlocked && hasProviderKey
                      ? "Key set · Manage in Vault"
                      : vaultUnlocked
                        ? "No key yet · Add in Vault"
                        : "Vault locked · Unlock to manage"}
                </span>
              </button>
            </div>
            <div>
              <label className="cc-form-label" htmlFor="cc-director-provider">Provider</label>
              <select
                id="cc-director-provider"
                value={selectedProvider}
                onChange={(e) => {
                  const value = e.target.value;
                  const provider: AIProvider =
                    value === "anselabs" || value === "nvidia" ? value : "anthropic";
                  setSelectedProvider(provider);
                }}
                className="cc-select"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="anselabs">Anselabs (OpenAI-compatible)</option>
                <option value="nvidia">NVIDIA</option>
              </select>
            </div>
            <div>
              <label className="cc-form-label" htmlFor="cc-director-model">Model</label>
              <select
                id="cc-director-model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="cc-select"
              >
                {(selectedProvider === "nvidia" ? nvidiaModels : modelsForProvider(selectedProvider)).map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Message Chat Feed */}
        <div className="cc-director__chat-feed" ref={chatFeedRef}>
          {messages.length === 0 && !isStreaming && (
            <p className="cc-panel-note">
              {vaultUnlocked && hasProviderKey
                ? "Tell the Director what you want: cut silences, add captions, match a reference, add titles."
                : vaultConfigured && !vaultUnlocked
                  ? "Unlock the Key Vault (lock icon) to start directing edits."
                  : `Add your ${providerName} API key in the Key Vault to start directing edits.`}
            </p>
          )}
          {messages.map((msg) =>
            msg.toolName ? (
              <div
                key={msg.id}
                className={`cc-director__tool-strip ${
                  msg.content.startsWith("Error") ||
                  msg.content.startsWith("Could not") ||
                  msg.content.startsWith("Declined")
                    ? "cc-director__tool-strip--warn"
                    : ""
                }`}
              >
                <Wrench size={13} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {msg.toolName}
                  </span>
                  <span style={{ opacity: 0.6 }}> · </span>
                  <span>{msg.content}</span>
                </div>
              </div>
            ) : (
              <div
                key={msg.id}
                className={`cc-director__bubble ${
                  msg.role === "user"
                    ? "cc-director__bubble--user"
                    : "cc-director__bubble--ai"
                }`}
              >
                {msg.content}
              </div>
            ),
          )}

          {/* Plan Approval Card */}
          <PlanCard
            onApprove={() => {
              void executeApprovedPlan({ editor });
            }}
          />

          {isStreaming && (
            <div className="cc-director__thinking" role="status" aria-live="polite">
              <span className="cc-director__thinking-dot" aria-hidden="true" />
              <span>{thinkingLabel}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Chips using .cc-chiprow */}
        <div
          className="cc-chiprow"
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {quickChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSend(chip.action)}
              className="cc-chip"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                padding: "6px 12px",
              }}
            >
              <chip.icon size={12} color="var(--cc-accent)" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="cc-director__input-container"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask the Director to cut, style, add titles…"
            className="cc-director__input"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isStreaming}
            className="cc-director__send-btn"
            aria-label="Send"
          >
            <Send size={15} strokeWidth={CC_ICON_STROKE} />
          </button>
        </form>
      </div>
    </PanelSheet>
  );
}
