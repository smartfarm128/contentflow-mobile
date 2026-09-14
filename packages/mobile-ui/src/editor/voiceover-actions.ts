/**
 * ContentFlow — on-device voiceover (text-to-speech) as a timeline clip.
 *
 * `speak` renders narration natively (iOS AVSpeechSynthesizer / Android
 * TextToSpeech) into the app's media custody directory, then this module
 * registers the result as a normal audio asset and inserts it on an audio
 * track. From that point it is an ordinary clip: trimmable, duckable,
 * volume-automatable, and exported by the same native pipeline as any other
 * audio — no special-case handling downstream.
 *
 * Persistence uses the SAME container-relative path scheme as picked media
 * (`media/native-paths.ts`), because iOS rotates the app-container UUID on
 * every install: an absolute path would make the voiceover silent after the
 * next app update.
 */
import type { EditorCore } from "@kneecap/editor-core";
import type { ElementRef } from "@kneecap/editor-core/timeline";
import { mediaTimeFromSeconds } from "@kneecap/editor-core/wasm";
import { AddMediaAssetCommand, InsertElementCommand } from "@kneecap/editor-core/commands";
import { buildElementFromMedia } from "@kneecap/editor-core/timeline";
import { relativeMediaPathFromPlaybackUrl } from "@kneecap/editor-core";
import { getNativeBridge } from "@kneecap/native-bridge";
import type { SpeechVoice } from "@kneecap/native-bridge";

export interface VoiceoverResult {
	ref: ElementRef | null;
	durationSec: number;
	assetId: string;
}

/** Voices installed on this device; empty when the platform has no offline TTS. */
export async function listVoiceoverVoices(): Promise<SpeechVoice[]> {
	try {
		const bridge = await getNativeBridge();
		return await bridge.listVoices();
	} catch {
		return [];
	}
}

/** True when this device can render a voiceover at all — drives UI gating. */
export async function supportsVoiceover(): Promise<boolean> {
	try {
		const bridge = await getNativeBridge();
		return (await bridge.capabilities()).supportsOnDeviceTts;
	} catch {
		return false;
	}
}

export async function generateVoiceover({
	editor,
	text,
	voiceId,
	languageHint,
	rate = 1,
	pitch = 1,
	startSeconds,
}: {
	editor: EditorCore;
	text: string;
	voiceId?: string;
	languageHint?: string;
	rate?: number;
	pitch?: number;
	/** Defaults to the playhead. */
	startSeconds?: number;
}): Promise<VoiceoverResult> {
	const trimmed = text.trim();
	if (!trimmed) throw new Error("Voiceover text is empty.");

	const bridge = await getNativeBridge();
	const { audioUri, durationSec } = await bridge.speak({
		text: trimmed,
		voiceId,
		languageHint,
		rate,
		pitch,
	});

	const url = bridge.toPlaybackUri(audioUri);
	const mediaRoot = await bridge.getMediaRoot().catch(() => null);

	// A short, recognisable asset name so the media list doesn't fill with
	// UUIDs — the first few words of what was actually said.
	const label = trimmed.split(/\s+/).slice(0, 5).join(" ");
	const name = `VO — ${label}${trimmed.length > label.length ? "…" : ""}`;

	const command = new AddMediaAssetCommand({
		projectId: editor.project.getActive().metadata.id,
		asset: {
			name,
			type: "audio",
			// Zero-byte stub: the real bytes live in native custody, exactly
			// like picked media (see native-import.ts's `stubFile`).
			file: new File([], `${name}.wav`, { type: "audio/wav" }),
			url,
			duration: durationSec,
			hasAudio: true,
			nativeRelativePath: relativeMediaPathFromPlaybackUrl({ url, root: mediaRoot }),
		} as any,
	});
	editor.command.execute({ command });
	const assetId = command.getAssetId();

	const start = startSeconds ?? undefined;
	const element = buildElementFromMedia({
		mediaId: assetId,
		mediaType: "audio",
		name,
		duration: mediaTimeFromSeconds({ seconds: Math.max(0.1, durationSec || 1) }),
		startTime:
			start !== undefined
				? mediaTimeFromSeconds({ seconds: Math.max(0, start) })
				: editor.playback.getCurrentTime(),
	});
	const insert = new InsertElementCommand({
		element,
		placement: { mode: "auto", trackType: "audio" },
	});
	editor.command.execute({ command: insert });

	const trackId = insert.getTrackId();
	return {
		ref: trackId ? { trackId, elementId: insert.getElementId() } : null,
		durationSec,
		assetId,
	};
}
