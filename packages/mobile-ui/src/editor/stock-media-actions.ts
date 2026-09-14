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
import { mediaTimeFromSeconds } from "@kneecap/editor-core/wasm";
import { AddMediaAssetCommand, InsertElementCommand } from "@kneecap/editor-core/commands";
import { buildElementFromMedia } from "@kneecap/editor-core/timeline";

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
	// Fetch media bytes into blob
	const res = await fetch(downloadUrl);
	if (!res.ok) throw new Error(`Failed to download media: ${res.status}`);
	const blob = await res.blob();
	const mime = type === "video" ? "video/mp4" : "image/jpeg";
	const file = new File([blob], `${name}.${type === "video" ? "mp4" : "jpg"}`, { type: mime });
	const playbackUrl = URL.createObjectURL(blob);

	const clipDur = durationSec ?? (type === "video" ? 4 : 3);

	const command = new AddMediaAssetCommand({
		projectId: editor.project.getActive().metadata.id,
		asset: {
			name,
			type,
			file,
			url: playbackUrl,
			duration: clipDur,
			hasAudio: false,
		} as any,
	});
	editor.command.execute({ command });
	const assetId = command.getAssetId();

	const start =
		startSeconds !== undefined
			? mediaTimeFromSeconds({ seconds: Math.max(0, startSeconds) })
			: editor.playback.getCurrentTime();

	const element = buildElementFromMedia({
		mediaId: assetId,
		mediaType: type,
		name,
		duration: mediaTimeFromSeconds({ seconds: Math.max(0.1, clipDur) }),
		startTime: start,
	});

	const insert = new InsertElementCommand({
		element,
		placement: { mode: "auto", trackType: "video" },
	});
	editor.command.execute({ command: insert });

	const trackId = insert.getTrackId();
	return trackId ? { trackId, elementId: insert.getElementId() } : null;
}
