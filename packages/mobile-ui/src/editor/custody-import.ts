/**
 * Network media (Pexels, ElevenLabs) enters the project the same way a
 * picked file does: native custody, a real probe, then
 * `prepareNativeMedia` + `commitPreparedMedia`.
 *
 * A `blob:` URL never leaves the WebView, so export and the next launch
 * cannot see it. The bridge method copies the bytes into the sandbox and
 * returns duration / hasAudio from AVFoundation or Media3's probe.
 */
import type { EditorCore, NativeMediaHandle } from "@kneecap/editor-core";
import {
	mediaTimeFromSeconds,
	prepareNativeMedia,
	commitPreparedMedia,
	type NativeMediaSource,
} from "@kneecap/editor-core";
import type { ElementRef } from "@kneecap/editor-core/timeline";
import { buildElementFromMedia } from "@kneecap/editor-core/timeline";
import { InsertElementCommand } from "@kneecap/editor-core/commands";
import { getNativeBridge } from "@kneecap/native-bridge";
import type { ImportRemoteMediaRequest, MediaHandle, NativeBridge } from "@kneecap/native-bridge";

const IMAGE_DEFAULT_DURATION_SEC = 3;

/** `MediaHandle.rotationDegrees` is a closed union; a hand-built handle may omit it. */
function bridgeHandle(handle: NativeMediaHandle): MediaHandle {
	const rotation = handle.rotationDegrees;
	const rotationDegrees =
		rotation === 0 || rotation === 90 || rotation === 180 || rotation === 270
			? rotation
			: 0;
	return { ...handle, rotationDegrees };
}

/** The slice of the bridge this import actually calls. Tests pass a fake. */
export interface RemoteImportBridge {
	importRemoteMedia(request: ImportRemoteMediaRequest): Promise<MediaHandle>;
	generateProxy: NativeBridge["generateProxy"];
	toPlaybackUri: NativeBridge["toPlaybackUri"];
	getMediaRoot: NativeBridge["getMediaRoot"];
}

export interface RemoteImportResult {
	ref: ElementRef | null;
	assetId: string;
	/** Placed clip length in seconds. For video this may be shorter than the file. */
	durationSec: number;
	/** Full probed file length. Images stay 0; the clip uses a default. */
	assetDurationSec: number;
	hasAudio: boolean;
}

export async function importRemoteMediaToTimeline({
	editor,
	request,
	name,
	startSeconds,
	clipDurationSec,
	bridge,
}: {
	editor: EditorCore;
	request: ImportRemoteMediaRequest;
	name: string;
	/** Defaults to the playhead. */
	startSeconds?: number;
	/**
	 * How much of the file to place. Clamped to the probed duration so a
	 * requested 4s B-roll cannot outrun a shorter download. Omit it to
	 * place the whole file.
	 */
	clipDurationSec?: number;
	bridge?: RemoteImportBridge;
}): Promise<RemoteImportResult> {
	const native = bridge ?? (await getNativeBridge());
	const handle = await native.importRemoteMedia(request);
	const source: NativeMediaSource = {
		pickMedia: async () => [],
		generateProxy: (params) =>
			native.generateProxy({
				handle: bridgeHandle(params.handle),
				spec: params.spec,
			}),
		toPlaybackUri: native.toPlaybackUri,
		getMediaRoot: () => native.getMediaRoot(),
	};
	const { prepared, failed } = await prepareNativeMedia({
		source,
		handles: [handle],
	});
	const failure = failed[0];
	const ready = prepared[0];
	if (!ready) {
		throw new Error(failure?.error ?? `Couldn't prepare "${name}".`);
	}
	const mediaRoot = await native.getMediaRoot().catch(() => null);
	const imported = commitPreparedMedia({
		editor,
		projectId: editor.project.getActive().metadata.id,
		prepared: [ready],
		toPlaybackUri: native.toPlaybackUri,
		mediaRoot,
	});
	const asset = imported[0];
	if (!asset) {
		throw new Error(`Couldn't add "${name}" to the project.`);
	}
	const assetDurationSec = asset.duration ?? 0;
	if (asset.type !== "image" && !(assetDurationSec > 0)) {
		throw new Error(`Couldn't read how long "${name}" is.`);
	}
	const durationSec =
		asset.type === "image"
			? Math.max(0.1, clipDurationSec ?? IMAGE_DEFAULT_DURATION_SEC)
			: clipDurationSec !== undefined
				? Math.max(0.1, Math.min(clipDurationSec, assetDurationSec))
				: assetDurationSec;

	const start =
		startSeconds !== undefined
			? mediaTimeFromSeconds({ seconds: Math.max(0, startSeconds) })
			: editor.playback.getCurrentTime();
	const element = buildElementFromMedia({
		mediaId: asset.id,
		mediaType: asset.type,
		name,
		duration: mediaTimeFromSeconds({ seconds: durationSec }),
		startTime: start,
	});
	const insert = new InsertElementCommand({
		element,
		placement: {
			mode: "auto",
			trackType: asset.type === "audio" ? "audio" : "video",
		},
	});
	editor.command.execute({ command: insert });
	const trackId = insert.getTrackId();
	return {
		ref: trackId ? { trackId, elementId: insert.getElementId() } : null,
		assetId: asset.id,
		durationSec,
		assetDurationSec,
		hasAudio: asset.hasAudio === true,
	};
}
