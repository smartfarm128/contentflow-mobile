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
import {
	hasElevenLabsKey,
	listElevenLabsVoices,
	synthesizeElevenLabs,
} from "./elevenlabs-voice";

export interface VoiceoverResult {
	ref: ElementRef | null;
	durationSec: number;
	assetId: string;
}

/** A voice the user can pick, from either engine. */
export interface VoiceOption {
	id: string;
	name: string;
	language?: string;
	quality: "standard" | "enhanced" | "premium";
	/** "device" is free + offline; "elevenlabs" spends the user's credits. */
	engine: "device" | "elevenlabs";
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

/**
 * Every voice available to the user — free on-device voices first, then
 * ElevenLabs premium voices when they have supplied a key. Premium failures
 * are swallowed to a shorter list rather than breaking the picker: losing the
 * free voices because a cloud call failed would be the worse outcome.
 */
export async function listAllVoiceOptions(): Promise<VoiceOption[]> {
	const device = (await listVoiceoverVoices()).map(
		(v): VoiceOption => ({
			id: v.id,
			name: v.name,
			language: v.language,
			quality: v.quality,
			engine: "device",
		}),
	);

	if (!hasElevenLabsKey()) return device;

	try {
		const premium = (await listElevenLabsVoices()).map(
			(v): VoiceOption => ({
				id: v.id,
				name: v.name,
				quality: "premium",
				engine: "elevenlabs",
			}),
		);
		return [...premium, ...device];
	} catch {
		return device;
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
	engine = "device",
}: {
	editor: EditorCore;
	text: string;
	voiceId?: string;
	languageHint?: string;
	rate?: number;
	pitch?: number;
	/** Defaults to the playhead. */
	startSeconds?: number;
	/** "device" = free + offline. "elevenlabs" = premium, spends user credits. */
	engine?: "device" | "elevenlabs";
}): Promise<VoiceoverResult> {
	const trimmed = text.trim();
	if (!trimmed) throw new Error("Voiceover text is empty.");

	let url: string;
	let durationSec: number;
	let mediaRoot: string | null = null;
	let assetFile: File;

	if (engine === "elevenlabs") {
		if (!voiceId) throw new Error("Pick an ElevenLabs voice first.");
		const mp3 = await synthesizeElevenLabs({ text: trimmed, voiceId });
		assetFile = new File([mp3], "voiceover.mp3", { type: "audio/mpeg" });
		url = URL.createObjectURL(mp3);
		// ElevenLabs returns no duration header, and decoding the whole MP3 just
		// to learn its length would stall the UI. Estimate from speech rate
		// (~15 chars/sec at natural pace); the clip is trimmable either way, and
		// the engine corrects it once the asset's real duration is probed.
		durationSec = Math.max(1, trimmed.length / 15);
	} else {
		const bridge = await getNativeBridge();
		const spoken = await bridge.speak({
			text: trimmed,
			voiceId,
			languageHint,
			rate,
			pitch,
		});
		url = bridge.toPlaybackUri(spoken.audioUri);
		durationSec = spoken.durationSec;
		mediaRoot = await bridge.getMediaRoot().catch(() => null);
		assetFile = new File([], "voiceover.wav", { type: "audio/wav" });
	}

	// A short, recognisable asset name so the media list doesn't fill with
	// UUIDs — the first few words of what was actually said.
	const label = trimmed.split(/\s+/).slice(0, 5).join(" ");
	const name = `VO — ${label}${trimmed.length > label.length ? "…" : ""}`;

	const command = new AddMediaAssetCommand({
		projectId: editor.project.getActive().metadata.id,
		asset: {
			name,
			type: "audio",
			// Device path: zero-byte stub, bytes live in native custody (see
			// native-import.ts's `stubFile`). Cloud path: the real MP3 bytes,
			// since there is no native file backing them.
			file: assetFile,
			url,
			duration: durationSec,
			hasAudio: true,
			// Only meaningful for native-custody audio; a blob URL has no
			// container-relative form to persist.
			nativeRelativePath: mediaRoot
				? relativeMediaPathFromPlaybackUrl({ url, root: mediaRoot })
				: undefined,
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
