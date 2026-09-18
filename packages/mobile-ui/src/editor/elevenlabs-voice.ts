/**
 * ContentFlow — ElevenLabs premium voices (optional, cloud).
 *
 * Why this exists alongside on-device TTS: Apple/Android system voices are
 * free, offline and instant, but they sound synthetic — fine for a scratch
 * track, not for a published video. ElevenLabs voices are broadcast quality
 * and support cloning the creator's own voice.
 *
 * Positioning (Option A, agreed with the founder): the app stays local-first.
 * Editing, captions, export and the free voiceover never touch the network.
 * This module is contacted ONLY when the user has pasted their own ElevenLabs
 * key AND explicitly picks a premium voice — same consent model as the AI
 * Director's Anthropic key. No key => this module is never called.
 *
 * Cost is the user's, on their own account, so the UI must be honest that a
 * premium render spends their credits (free tier is ~10k characters/month).
 */

import { getActiveElevenLabsKey } from "../vault/vault-store";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const API_KEY_STORAGE = "cf_elevenlabs_api_key";

export interface ElevenLabsVoice {
	id: string;
	name: string;
	/** "premade", "cloned", "generated" — surfaced so the UI can group them. */
	category?: string;
}

export function getElevenLabsKey(): string {
	const active = getActiveElevenLabsKey();
	if (active) return active;
	if (typeof localStorage === "undefined") return "";
	return localStorage.getItem(API_KEY_STORAGE) ?? "";
}

export function setElevenLabsKey(key: string): void {
	if (typeof localStorage === "undefined") return;
	if (key.trim()) localStorage.setItem(API_KEY_STORAGE, key.trim());
	else localStorage.removeItem(API_KEY_STORAGE);
}

export function hasElevenLabsKey(): boolean {
	return getElevenLabsKey().length > 0;
}

/** Voices on the user's ElevenLabs account (premade + any they've cloned). */
export async function listElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
	const key = getElevenLabsKey();
	if (!key) return [];

	const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
		headers: { "xi-api-key": key },
	});
	if (!res.ok) {
		throw new Error(
			res.status === 401
				? "ElevenLabs rejected that API key."
				: `ElevenLabs error ${res.status}`,
		);
	}
	const data = await res.json();
	return (data.voices ?? []).map((v: any) => ({
		id: v.voice_id,
		name: v.name,
		category: v.category,
	}));
}

/**
 * Renders `text` with an ElevenLabs voice and returns the MP3 bytes.
 *
 * Returns a Blob rather than writing to disk: unlike the native TTS path
 * (which hands back a file in media custody), this audio arrives over the
 * network, so the caller registers it as a normal blob-backed asset.
 */
export async function synthesizeElevenLabs({
	text,
	voiceId,
	modelId = "eleven_multilingual_v2",
	stability = 0.5,
	similarityBoost = 0.75,
}: {
	text: string;
	voiceId: string;
	modelId?: string;
	stability?: number;
	similarityBoost?: number;
}): Promise<Blob> {
	const key = getElevenLabsKey();
	if (!key) throw new Error("No ElevenLabs API key set.");
	if (!text.trim()) throw new Error("Voiceover text is empty.");

	const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
		method: "POST",
		headers: {
			"xi-api-key": key,
			"Content-Type": "application/json",
			Accept: "audio/mpeg",
		},
		body: JSON.stringify({
			text,
			model_id: modelId,
			voice_settings: { stability, similarity_boost: similarityBoost },
		}),
	});

	if (!res.ok) {
		// 401 = bad key, 422 = out of credits / bad voice. Both are the user's
		// account state, so say which rather than a bare status code.
		if (res.status === 401) throw new Error("ElevenLabs rejected that API key.");
		if (res.status === 422) {
			throw new Error("ElevenLabs refused the request — you may be out of credits for this month.");
		}
		throw new Error(`ElevenLabs error ${res.status}`);
	}

	return await res.blob();
}

/**
 * Clones the user's voice from a recorded sample.
 *
 * `consent` is required and must be true — voice cloning is only lawful with
 * the speaker's permission, and the UI must have asked before calling this.
 */
export async function cloneElevenLabsVoice({
	name,
	sample,
	consent,
}: {
	name: string;
	sample: Blob;
	consent: boolean;
}): Promise<ElevenLabsVoice> {
	if (!consent) {
		throw new Error("Voice cloning requires explicit consent from the person speaking.");
	}
	const key = getElevenLabsKey();
	if (!key) throw new Error("No ElevenLabs API key set.");

	const form = new FormData();
	form.append("name", name);
	form.append("files", sample, "sample.wav");

	const res = await fetch(`${ELEVENLABS_BASE}/voices/add`, {
		method: "POST",
		headers: { "xi-api-key": key },
		body: form,
	});
	if (!res.ok) {
		throw new Error(
			res.status === 401
				? "ElevenLabs rejected that API key."
				: `Voice cloning failed (${res.status}).`,
		);
	}
	const data = await res.json();
	return { id: data.voice_id, name, category: "cloned" };
}
