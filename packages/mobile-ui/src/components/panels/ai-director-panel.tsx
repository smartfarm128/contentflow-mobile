import React, { useState, useRef, useEffect } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import { useAIDirectorStore } from "../../ai-director/ai-store";
import { askAIDirector } from "../../ai-director/ai-agent";
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
} from "lucide-react";

interface AIDirectorPanelProps {
  editor: EditorCore;
  currentTimeSeconds: number;
  onClose: () => void;
}

export function AIDirectorPanel({
  editor,
  currentTimeSeconds,
  onClose,
}: AIDirectorPanelProps) {
  const [inputPrompt, setInputPrompt] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useAIDirectorStore((s) => s.messages);
  const isStreaming = useAIDirectorStore((s) => s.isStreaming);
  const apiKey = useAIDirectorStore((s) => s.apiKey);
  const setApiKey = useAIDirectorStore((s) => s.setApiKey);
  const selectedModel = useAIDirectorStore((s) => s.selectedModel);
  const setSelectedModel = useAIDirectorStore((s) => s.setSelectedModel);
  const updateMessageProposal = useAIDirectorStore(
    (s) => s.updateMessageProposal,
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    { label: "Cut Silences", icon: Scissors, action: "Cut all silent pauses in the video" },
    { label: "Auto Captions", icon: Captions, action: "Add subtitles to the video" },
    { label: "Motion Graphic", icon: Film, action: "Add an energetic motion title overlay" },
    { label: "Idea to Video", icon: Zap, action: "Generate a 30-second video about my idea" },
  ];

  return (
    <PanelSheet onScrimClick={onClose} header={<SheetHeader onClose={onClose} onConfirm={onClose} />}>
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <p className="cc-sheet-title">AI Director</p>
      </div>

      {/* Header bar: Model & API Key button */}
      <div className="flex items-center justify-between py-2 bg-[#161616] border-b border-[#242424]">
        <div className="flex items-center gap-1.5 text-xs text-[#00f2fe] font-semibold">
          <Sparkles size={13} />
          <span>Director Mode · {selectedModel.replace("claude-", "")}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 rounded-lg bg-[#222] text-[#888] hover:text-white transition-colors"
          title="AI Settings"
        >
          <Sliders size={13} />
        </button>
      </div>

      {/* Settings dropdown / drawer */}
      {showSettings && (
        <div className="p-3.5 bg-[#1a1a1a] border-b border-[#2a2a2a] flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#888]">
              Anthropic API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full h-8 px-2.5 rounded-lg bg-[#111] border border-[#333] text-xs text-white outline-none focus:border-[#00f2fe]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#888]">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-[#111] border border-[#333] text-xs text-white outline-none focus:border-[#00f2fe]"
            >
              <option value="claude-sonnet-5">Claude Sonnet 5 (Recommended)</option>
              <option value="claude-opus-5">Claude Opus 5 (Deep Creative Direction)</option>
              <option value="claude-fable-5">Claude Fable 5 (Highest Intelligence)</option>
            </select>
          </div>
        </div>
      )}

      {/* Message Chat Feed */}
      <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-3 min-h-[200px] max-h-[320px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.role === "user"
                ? "self-end items-end"
                : "self-start items-start"
            }`}
          >
            <div
              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#00f2fe] text-black font-medium rounded-br-none"
                  : "bg-[#202020] text-white border border-[#2d2d2d] rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>

            {/* Proposal card if present */}
            {msg.proposal && (
              <div className="mt-2 p-3 w-full rounded-xl bg-[#191919] border border-[#00f2fe]/40 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00f2fe]">
                  <Bot size={13} />
                  <span>Proposed {msg.proposal.type.toUpperCase()}: {msg.proposal.title}</span>
                </div>
                <p className="text-[11px] text-[#aaa] leading-relaxed">
                  {msg.proposal.description}
                </p>
                {msg.proposal.status === "pending" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => updateMessageProposal(msg.id, "approved")}
                      className="flex-1 py-1.5 rounded-lg bg-[#00f2fe] text-black text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <Check size={12} />
                      Approve & Run
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMessageProposal(msg.id, "rejected")}
                      className="px-3 py-1.5 rounded-lg bg-[#2a2a2a] text-[#888] hover:text-white text-xs font-medium flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] font-medium text-[#777] italic">
                    {msg.proposal.status === "approved" ? "✓ Approved" : "✗ Dismissed"}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className="self-start flex items-center gap-1.5 p-2.5 rounded-xl bg-[#202020] text-xs text-[#888]">
            <Sparkles size={13} className="animate-spin text-[#00f2fe]" />
            <span>Director is thinking…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips */}
      <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar border-t border-[#1e1e1e] shrink-0">
        {quickChips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => handleSend(chip.action)}
            className="px-2.5 py-1 rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[11px] text-[#aaa] hover:text-white font-medium flex items-center gap-1.5 shrink-0 transition-colors border border-[#2a2a2a]"
          >
            <chip.icon size={11} className="text-[#00f2fe]" />
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Prompt Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="py-2.5 border-t border-[#242424] flex items-center gap-2 bg-[#121212]"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask the Director to edit, cut, or add..."
          className="flex-1 h-9 px-3 rounded-xl bg-[#1c1c1c] text-xs text-white placeholder-[#555] outline-none border border-[#2d2d2d] focus:border-[#00f2fe]"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isStreaming}
          className="w-9 h-9 rounded-xl bg-[#00f2fe] disabled:opacity-40 text-black flex items-center justify-center transition-opacity"
        >
          <Send size={14} />
        </button>
      </form>
    </PanelSheet>
  );
}
