import { useAIDirectorStore } from "./ai-store";
import { useHtmlTemplateStore } from "../motion-templates/html-template-store";
import { getAllHtmlTemplates } from "../motion-templates/registry";
import { splitAtPlayhead, cutDeadSpace, insertTextElement } from "../editor/actions";
import type { EditorCore } from "@kneecap/editor-core";

export interface ExecutionContext {
  editor: EditorCore;
  currentTimeSeconds: number;
}

export const AI_DIRECTOR_PROMPT = `You are ContentFlow's AI Director — an elite creative video director and editor embedded directly inside this mobile CapCut-style video editor.
Your job is to direct, edit, and assemble videos for creators.
You have access to motion graphics, auto-captions, silence cutting, audio scoring, transitions, and clip editing.
Always respond in concise, direct, creative-director style. When the user asks you to edit or generate content, explain what you're doing and propose concrete steps.`;

export async function askAIDirector(
  prompt: string,
  context: ExecutionContext,
): Promise<string> {
  const store = useAIDirectorStore.getState();
  const apiKey = store.apiKey;

  // Add user message to history
  store.addMessage({ role: "user", content: prompt });
  store.setIsStreaming(true);

  // If no API key is provided, provide smart local assistant response
  if (!apiKey) {
    const localReply = handleLocalCommand(prompt, context);
    store.addMessage({
      role: "assistant",
      content: localReply,
    });
    store.setIsStreaming(false);
    return localReply;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: store.selectedModel || "claude-sonnet-5",
        max_tokens: 1024,
        system: AI_DIRECTOR_PROMPT,
        messages: store.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const assistantText =
      data.content?.[0]?.text || "Done. What would you like to do next?";

    store.addMessage({
      role: "assistant",
      content: assistantText,
    });

    executeQuickDirectives(prompt, context);

    store.setIsStreaming(false);
    return assistantText;
  } catch (error) {
    console.error("[AIDirector] error:", error);
    const fallback = `Encountered an issue connecting to AI Director: ${
      error instanceof Error ? error.message : String(error)
    }. You can still use quick editor commands.`;
    store.addMessage({
      role: "assistant",
      content: fallback,
    });
    store.setIsStreaming(false);
    return fallback;
  }
}

function handleLocalCommand(prompt: string, context: ExecutionContext): string {
  const lower = prompt.toLowerCase();
  const project = context.editor.project.getActive();
  const activeScene = project.scenes[0];
  const videoTrack = activeScene?.tracks?.main;

  if (
    lower.includes("silence") ||
    lower.includes("dead space") ||
    lower.includes("cut gap")
  ) {
    if (videoTrack && videoTrack.elements?.length > 0) {
      cutDeadSpace({
        editor: context.editor,
        ref: { trackId: videoTrack.id, elementId: videoTrack.elements[0].id },
      });
      return "I analyzed your primary track and cut dead space and pauses for tighter pacing.";
    }
    return "No active clip selected to cut silences from. Select or import a clip first!";
  }

  if (lower.includes("split") || lower.includes("cut at playhead")) {
    if (videoTrack) {
      const element = videoTrack.elements.find(
        (el: any) =>
          context.currentTimeSeconds >= (el.timeRange?.start?.seconds ?? 0) &&
          context.currentTimeSeconds < (el.timeRange?.end?.seconds ?? 0),
      );
      if (element) {
        splitAtPlayhead({
          editor: context.editor,
          ref: { trackId: videoTrack.id, elementId: element.id },
        });
        return `Split clip at ${context.currentTimeSeconds.toFixed(2)}s.`;
      }
    }
    return `No clip found under the playhead at ${context.currentTimeSeconds.toFixed(2)}s to split.`;
  }

  if (
    lower.includes("motion") ||
    lower.includes("graphic") ||
    lower.includes("title")
  ) {
    const tmpls = getAllHtmlTemplates();
    const match =
      tmpls.find((t) => lower.includes(t.name.toLowerCase())) || tmpls[0];
    if (match) {
      const defaultVals: Record<string, string | number | boolean> = {};
      for (const c of match.controls) {
        defaultVals[c.id] = c.defaultValue;
      }
      useHtmlTemplateStore
        .getState()
        .addClip(
          match.id,
          context.currentTimeSeconds,
          match.defaultDuration || 4,
          defaultVals,
          "html-track",
        );
      return `Added "${match.name}" motion graphic overlay at ${context.currentTimeSeconds.toFixed(2)}s. You can tap "Template" in the toolbar to adjust text and style.`;
    }
  }

  if (lower.includes("caption") || lower.includes("subtitle")) {
    insertTextElement({
      editor: context.editor,
      content: "New Caption",
    });
    return "Created caption overlay at playhead. (To enable full automatic Whisper transcription, configure your API key in Settings).";
  }

  return "I'm ready! Please add your Anthropic API Key in Settings to unlock the full conversational Director, or try commands like 'cut silences', 'split clip', 'add motion title', or 'add caption'.";
}

function executeQuickDirectives(prompt: string, context: ExecutionContext) {
  const lower = prompt.toLowerCase();
  if (lower.includes("cut silence") || lower.includes("remove pauses")) {
    const project = context.editor.project.getActive();
    const activeScene = project.scenes[0];
    const videoTrack = activeScene?.tracks?.main;
    if (videoTrack && videoTrack.elements?.length > 0) {
      cutDeadSpace({
        editor: context.editor,
        ref: { trackId: videoTrack.id, elementId: videoTrack.elements[0].id },
      });
    }
  }
}
