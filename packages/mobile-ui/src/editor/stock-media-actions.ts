/**
 * ContentFlow — Pexels Stock Media & B-Roll integration.
 *
 * Allows creators to search free stock videos and photos from Pexels and drop
 * them directly onto the timeline as B-Roll overlay clips.
 *
 * User-initiated only: requires the user's Pexels API key (stored in
 * `localStorage.getItem("cf_pexels_api_key")` or configured in the Director settings).
 */
import type { EditorCore } from "@kneecap/editor-core";
import type { ElementRef } from "@kneecap/editor-core/timeline";
import { getActivePexelsKey } from "../vault/vault-store";
import { importRemoteMediaToTimeline } from "./custody-import";

export interface PexelsMediaItem {
	id: string;
	title: string;
	type: "video" | "image";
	thumbnailUrl: string;
	downloadUrl: string;
	author?: string;
	durationSec?: number;
}

export function getPexelsApiKey(): string {
	const active = getActivePexelsKey();
	if (active) return active;
	if (typeof localStorage === "undefined") return "";
	return localStorage.getItem("cf_pexels_api_key") ?? "";
}

export function setPexelsApiKey(key: string): void {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem("cf_pexels_api_key", key);
	}
}

export async function searchPexelsVideos({
	query,
	apiKey,
	perPage = 12,
}: {
	query: string;
	apiKey?: string;
	perPage?: number;
}): Promise<PexelsMediaItem[]> {
	const key = apiKey || getPexelsApiKey();
	if (!key) {
		throw new Error("No Pexels API key. Please add your free key in AI Director settings.");
	}

	const res = await fetch(
		`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
		{
			headers: { Authorization: key },
		},
	);

	if (!res.ok) {
		throw new Error(`Pexels API error: ${res.status}`);
	}

	const data = await res.json();
	return (data.videos ?? []).map((v: any) => {
		const file =
			v.video_files?.find((f: any) => f.quality === "sd" || f.quality === "hd") ??
			v.video_files?.[0];
		return {
			id: String(v.id),
			title: `Video by ${v.user?.name ?? "Pexels"}`,
			type: "video" as const,
			thumbnailUrl: v.image ?? "",
			downloadUrl: file?.link ?? "",
			author: v.user?.name,
			durationSec: v.duration,
		};
	});
}

export async function searchPexelsPhotos({
	query,
	apiKey,
	perPage = 12,
}: {
	query: string;
	apiKey?: string;
	perPage?: number;
}): Promise<PexelsMediaItem[]> {
	const key = apiKey || getPexelsApiKey();
	if (!key) {
		throw new Error("No Pexels API key. Please add your free key in AI Director settings.");
	}

	const res = await fetch(
		`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
		{
			headers: { Authorization: key },
		},
	);

	if (!res.ok) {
		throw new Error(`Pexels API error: ${res.status}`);
	}

	const data = await res.json();
	return (data.photos ?? []).map((p: any) => ({
		id: String(p.id),
		title: `Photo by ${p.photographer ?? "Pexels"}`,
		type: "image" as const,
		thumbnailUrl: p.src?.medium ?? p.src?.tiny ?? "",
		downloadUrl: p.src?.large ?? p.src?.original ?? p.src?.medium ?? "",
		author: p.photographer,
	}));
}

function hostOf(url: string): string {
	try {
		return new URL(url).host;
	} catch {
		return "the media host";
	}
}

export async function importPexelsMediaToTimeline({
	editor,
	downloadUrl,
	name,
	type,
	durationSec,
	startSeconds,
}: {
	editor: EditorCore;
	downloadUrl: string;
	name: string;
	type: "video" | "image";
	durationSec?: number;
	startSeconds?: number;
}): Promise<ElementRef | null> {
	// The native side downloads into media custody and probes the file.
	// Duration and hasAudio come from that probe — a search listing's
	// duration is only a trim hint, and Pexels videos do have audio.
	const ext = type === "video" ? "mp4" : "jpg";
	try {
		const placed = await importRemoteMediaToTimeline({
			editor,
			request: {
				url: downloadUrl,
				kind: type,
				fileName: `${name}.${ext}`,
			},
			name,
			startSeconds,
			clipDurationSec: durationSec,
		});
		return placed.ref;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (message === "Load failed" || message.includes("Couldn't download")) {
			throw new Error(
				`Couldn't download from ${hostOf(downloadUrl)}. Check your connection and try again.`,
			);
		}
		throw error instanceof Error ? error : new Error(message);
	}
}
