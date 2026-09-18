import React, { useState, useRef, useEffect } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import { useAIDirectorStore } from "../../ai-director/ai-store";
import { askAIDirector, executeApprovedPlan } from "../../ai-director/ai-agent";
import { PlanCard } from "./plan-card";
import type { EditorCore } from "@kneecap/editor-core";
import {
  Sparkles,
  Send,
  Sliders,
  Check,
  X,
  Bot,
  Scissors,
  Captions,
  Film,
  Zap,
  Wrench,
  Clapperboard,
  Lock,
} from "lucide-react";
import { CC_ICON_STROKE } from "../../tokens";
import { useVaultStore } from "../../vault/vault-store";

interface AIDirectorPanelProps {
  editor: EditorCore;
  currentTimeSeconds: number;
  onClose: () => void;
  /** Opens the encrypted Key Vault — the ONLY place an API key is entered. */
  onOpenVault?: () => void;
}

export function AIDirectorPanel({
  editor,
  currentTimeSeconds,
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
  const updateMessageProposal = useAIDirectorStore(
    (s) => s.updateMessageProposal,
  );

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

    await askAIDirector(text, {
      editor,
      currentTimeSeconds,
    });
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
    { label: "Idea to Video", icon: Zap, action: "Generate a 30-second video about my idea" },
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
            <span>Director Mode · {selectedModel.replace("claude-", "")}</span>
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
              <label className="cc-form-label">Anthropic API Key</label>
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
                    : vaultUnlocked && vaultAnthropicKey
                      ? "Key set · Manage in Vault"
                      : vaultUnlocked
                        ? "No key yet · Add in Vault"
                        : "Vault locked · Unlock to manage"}
                </span>
              </button>
            </div>
            <div>
              <label className="cc-form-label">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="cc-select"
              >
                <option value="claude-sonnet-5">Claude Sonnet 5 (Recommended)</option>
                <option value="claude-opus-5">Claude Opus 5 (Deep Creative Direction)</option>
                <option value="claude-fable-5">Claude Fable 5 (Highest Intelligence)</option>
              </select>
            </div>
          </div>
        )}

        {/* Message Chat Feed */}
        <div className="cc-director__chat-feed" ref={chatFeedRef}>
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

                {/* Proposal card if present */}
                {msg.proposal && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "10px",
                      borderRadius: "10px",
                      background: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(0, 202, 224, 0.3)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--cc-accent)",
                      }}
                    >
                      <Bot size={13} />
                      <span>
                        {msg.proposal.type.toUpperCase()}: {msg.proposal.title}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "#bbb", margin: 0 }}>
                      {msg.proposal.description}
                    </p>
                    {msg.proposal.status === "pending" ? (
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                        <button
                          type="button"
                          onClick={() => updateMessageProposal(msg.id, "approved")}
                          style={{
                            flex: 1,
                            padding: "6px",
                            borderRadius: "6px",
                            background: "var(--cc-accent)",
                            color: "var(--cc-accent-contrast)",
                            fontWeight: 600,
                            fontSize: "11px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          <Check size={12} />
                          <span>Approve & Run</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateMessageProposal(msg.id, "rejected")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "rgba(255,255,255,0.08)",
                            color: "var(--cc-text-secondary)",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "10px", color: "#777", fontStyle: "italic" }}>
                        {msg.proposal.status === "approved" ? "✓ Approved" : "✗ Dismissed"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ),
          )}

          {/* Plan Approval Card */}
          <PlanCard
            onApprove={() => {
              void executeApprovedPlan({ editor, currentTimeSeconds });
            }}
          />

          {isStreaming && (
            <div
              className="cc-director__bubble cc-director__bubble--ai"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Sparkles size={13} className="animate-spin text-[#00cae0]" />
              <span style={{ fontSize: "12px", color: "var(--cc-text-secondary)" }}>
                Director is thinking & reviewing footage…
              </span>
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
