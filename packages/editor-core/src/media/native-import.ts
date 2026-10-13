import { AddMediaAssetCommand } from "@/commands/media/add-media-asset";
import type { EditorCore } from "@/core";
import { toast } from "@/core/notifications";
import {
	relativeMediaPathFromPlaybackUrl,
	relativeMediaPathFromRawPath,
} from "@/media/native-paths";
import type { MediaAsset, MediaType } from "@/media/types";
import { videoCache } from "@/services/video-cache/service";

/**
 * kneecap M4 — wires the editor's import flow to a `NativeBridge`
 * (plan M4 key task 6: "Wire MediaManager + media/processing.ts to consume
 * native-probed metadata instead of the mediabunny Input/BlobSource probe
 * path").
 *
 * Deliberately does NOT import `@kneecap/native-bridge`: that package
 * already depends on `@kneecap/editor-core` (`capacitor-bridge.ts` imports
 * `Edl` from `./edl`), so importing it back here would make the two
 * packages circular. `NativeMediaSource` below is a small structural
 * subset of `NativeBridge` instead — the REAL bridge
 * (`(await getNativeBridge())`) satisfies it with no adapter needed
 * (TypeScript structural typing), exactly the same "host supplies a
 * resolver shaped like an interface the engine defines" pattern
 * `EdlAssetResolver` already uses (`edl/build.ts`).
 */

export interface NativeFrameRate {
	numerator: number;
	denominator: number;
}

/** Structural subset of `@kneecap/native-bridge`'s `MediaHandle`. */
export interface NativeMediaHandle {
	id: string;
	uri: string;
	kind: MediaType;
	fileName: string;
	sizeBytes: number;
	durationMicros: number;
	width: number;
	height: number;
	hasAudio: boolean;
	codec: string;
	frameRate: NativeFrameRate | null;
	/** Display rotation off the native probe — present on the real wire
	 *  handle (pickMedia supplies it); optional here because hand-built
	 *  handles (tests, autotest) may omit it. */
	rotationDegrees?: number;
}

/** Structural subset of `@kneecap/native-bridge`'s `ProxyProgress`. */
export interface NativeProxyProgress {
	assetId: string;
	stage: "queued" | "transcoding" | "thumbnails" | "done" | "error";
	fraction: number;
	proxyUri?: string;
	proxyWidth?: number;
	proxyHeight?: number;
	thumbnailUris?: string[];
	error?: string;
}

/** Structural subset of `@kneecap/native-bridge`'s `PickProgress`. */
export interface NativePickProgress {
	index: number;
	total: number;
	stage: "loading" | "loaded" | "error";
	fraction: number;
	error?: string;
}

/** Structural subset of `@kneecap/native-bridge`'s `NativeBridge`. */
export interface NativeMediaSource {
	pickMedia(opts: {
		kinds: MediaType[];
		allowMultiple: boolean;
		onProgress?: (progress: NativePickProgress) => void;
	}): Promise<NativeMediaHandle[]>;
	generateProxy(params: {
		handle: NativeMediaHandle;
		spec: { targetHeight: number; shortGop: boolean };
	}): AsyncGenerator<NativeProxyProgress>;
	toPlaybackUri(nativeUri: string): string;
	/** See `@kneecap/native-bridge` `NativeBridge.getMediaRoot` — null on
	 *  web or when the native build predates the method. */
	getMediaRoot(): Promise<string | null>;
}

const MIME_BY_KIND: Record<MediaType, string> = {
	video: "video/mp4",
	audio: "audio/mp4",
	image: "image/jpeg",
};

/**
 * A zero-byte placeholder. `MediaAsset.file: File` is a pre-existing,
 * repo-wide type requirement (`services/renderer/scene-builder.ts`,
 * `media/audio.ts`, `core/managers/audio-manager.ts` all read
 * `mediaAsset.file` for preview compositing/waveform decode via
 * mediabunny's `BlobSource`) that THIS function does not — and, scoped to
 * plan M4, should not — satisfy with real bytes: doing so would mean
 * fetching the whole source file into the JS heap on import, exactly the
 * jetsam vector M4's own exit criterion forbids ("peak JS heap delta during
 * import of a 2GB source file is under 20MB").
 *
 * The render/audio pipeline handles this stub via
 * `media/playable-source.ts` (the plan §2.6 `BlobSource`-to-`UrlSource`
 * swap, closed 2026-08-19 after on-device playback surfaced the gap):
 * every decode path prefers real `file` bytes and falls back to streaming
 * `mediaAsset.url` (the proxy's playback URI below) when the file is this
 * zero-byte stub. Any NEW code that reads `mediaAsset.file` directly must
 * go through `createPlayableSource`/`readPlayableBytes` instead.
 */
function stubFile({
	fileName,
	kind,
}: {
	fileName: string;
	kind: MediaType;
}): File {
	return new File([], fileName, { type: MIME_BY_KIND[kind] });
}

/**
 * Builds the `Omit<MediaAsset, "id">` `AddMediaAssetCommand` wants, from a
 * native probe + its finished proxy. Throws if `proxy.stage !== "done"` —
 * callers (`importMediaFromNative` below) are expected to have already
 * routed `"error"` proxies to failure handling before reaching here.
 */
export function buildMediaAssetFromNativeImport({
	handle,
	proxy,
	toPlaybackUri,
	mediaRoot = null,
}: {
	handle: NativeMediaHandle;
	proxy: NativeProxyProgress;
	toPlaybackUri: (nativeUri: string) => string;
	/** Custody root from `NativeMediaSource.getMediaRoot()`; enables
	 *  container-relative persistence (media/native-paths.ts). */
	mediaRoot?: string | null;
}): Omit<MediaAsset, "id"> {
	if (proxy.stage !== "done" || !proxy.proxyUri) {
		throw new Error(
			`buildMediaAssetFromNativeImport requires a "done" proxy with a proxyUri (got stage="${proxy.stage}", asset ${handle.id})`,
		);
	}

	const fps = handle.frameRate
		? handle.frameRate.numerator / handle.frameRate.denominator
		: undefined;

	const url = toPlaybackUri(proxy.proxyUri);
	const thumbnailUrl = proxy.thumbnailUris?.[0]
		? toPlaybackUri(proxy.thumbnailUris[0])
		: undefined;

	return {
		name: handle.fileName,
		type: handle.kind,
		file: stubFile({ fileName: handle.fileName, kind: handle.kind }),
		url,
		// Prefer the proxy's OWN (downscaled) dimensions when known — that's
		// what the webview will actually be compositing against — falling
		// back to the source probe for kinds/cases with no proxy resize
		// (e.g. an image import, which has no video proxy at all).
		width: proxy.proxyWidth ?? handle.width,
		height: proxy.proxyHeight ?? handle.height,
		duration: handle.durationMicros / 1_000_000,
		fps,
		hasAudio: handle.hasAudio,
		// Only the strip's first frame — `MediaAssetData` has one
		// `thumbnailUrl` slot, not an array. The rest of `proxy.thumbnailUris`
		// (the actual filmstrip) has no storage home yet; that's M7's
		// timeline UI to build, not this import path's job to invent.
		thumbnailUrl,
		// Container-relative persistence identities (media/native-paths.ts):
		// the ONLY forms that survive an iOS app update's container-UUID
		// rotation. Absent when the native build has no getMediaRoot or the
		// file lives outside the custody root.
		nativeRelativePath: relativeMediaPathFromPlaybackUrl({
			url,
			root: mediaRoot,
		}),
		thumbnailNativeRelativePath: relativeMediaPathFromPlaybackUrl({
			url: thumbnailUrl,
			root: mediaRoot,
		}),
		// The ORIGINAL custody file — what native EXPORT reads at full
		// resolution (handle.uri is the raw sandbox path by contract). Its
		// display rotation rides along: the proxy is baked upright, but the
		// source needs the transform applied at export time.
		sourceNativeRelativePath: relativeMediaPathFromRawPath({
			path: handle.uri,
			root: mediaRoot,
		}),
		sourceRotationDegrees: readHandleRotation(handle),
		// The ORIGINAL's pixel dimensions — `width`/`height` above are the
		// proxy's. Output-quality sizing (canvas adoption → export
		// resolution) must see the real source class, or a 4K import pins
		// the whole project to the proxy's 540p (the grainy-export bug).
		sourceWidth: handle.width > 0 ? handle.width : undefined,
		sourceHeight: handle.height > 0 ? handle.height : undefined,
	};
}

/** Validates the probe's rotation into the EDL's closed union. */
function readHandleRotation(
	handle: NativeMediaHandle,
): 0 | 90 | 180 | 270 | undefined {
	const value = handle.rotationDegrees;
	return value === 90 || value === 180 || value === 270 || value === 0
		? value
		: undefined;
}

/**
 * One tick of import progress, shaped for a UI that shows a single
 * overall indicator: `index`/`total` locate the asset currently being
 * worked, `fraction` is that asset's own 0..1 progress. The "picking"
 * stage covers the post-pick load/copy — on iOS that can be a real
 * iCloud original download taking minutes (`NativePickProgress`), and
 * before it was surfaced the UI froze at 0% and read as stuck.
 */
export interface NativeImportProgress {
	index: number;
	total: number;
	fileName: string;
	stage: NativeProxyProgress["stage"] | "picking";
	fraction: number;
}

export interface ImportMediaFromNativeParams {
	editor: EditorCore;
	projectId: string;
	source: NativeMediaSource;
	kinds: MediaType[];
	allowMultiple: boolean;
	/** Plan Amendment 4 default: 540p short edge, short-GOP on. */
	proxySpec?: { targetHeight: number; shortGop: boolean };
	/**
	 * Fires as soon as the picker resolves and then on every native proxy
	 * progress event. Without a consumer the import runs seconds of native
	 * transcode with zero UI acknowledgement — the "nothing happens after I
	 * pick a video" report from the founder's device (2026-08-19).
	 */
	onProgress?: (progress: NativeImportProgress) => void;
}

export interface NativeImportFailure {
	handle: NativeMediaHandle;
	error: string;
}

export interface ImportMediaFromNativeResult {
	imported: MediaAsset[];
	failed: NativeImportFailure[];
}


/** A handle whose proxy finished — ready to commit once a project exists. */
export interface PreparedNativeMedia {
	handle: NativeMediaHandle;
	proxy: NativeProxyProgress;
}

export interface PickNativeMediaResult {
	handles: NativeMediaHandle[];
	/** Items the user chose that failed to load (e.g. offline iCloud). */
	pickFailures: number;
	/** Set when a post-copy step already produced `Import failed at <step>: …`. */
	failureMessage?: string;
}

export interface PrepareNativeMediaResult {
	prepared: PreparedNativeMedia[];
	failed: NativeImportFailure[];
	mediaRoot: string | null;
}

/** Silence budgets for the steps after the file is in custody. A step that
 *  keeps emitting progress resets the clock. Native timeouts are shorter
 *  and cancel the reader/generator; these are the backstop when that
 *  callback never arrives. */
export const IMPORT_STEP_SILENCE_MS = {
	proxy: 60_000,
	thumbnails: 25_000,
	commit: 10_000,
} as const;

export type ImportPostCopyStep = "probe" | "proxy" | "thumbnails" | "commit";

const IMPORT_FAILURE_PREFIX = /^Import failed at [a-z]+:/;

/** `Import failed at <step>: <detail>`. An already-formatted native error
 *  is kept so the step that actually stalled is the one we show. */
export function formatImportFailure({
	step,
	detail,
}: {
	step: string;
	detail: string;
}): string {
	const trimmed = detail.trim() || "unknown error";
	if (IMPORT_FAILURE_PREFIX.test(trimmed)) return trimmed;
	return `Import failed at ${step}: ${trimmed}`;
}

export function importStepForProxyEvent(event: {
	stage: string;
	fraction: number;
}): "proxy" | "thumbnails" {
	return event.stage === "thumbnails" ? "thumbnails" : "proxy";
}

function importFailureKind(message: string): "stalled" | "failed" {
	return /timed out|no progress/.test(message) ? "stalled" : "failed";
}

function logImportStall(step: string, fileName?: string): void {
	console.error(
		fileName
			? `[import] stalled at ${step} file=${fileName}`
			: `[import] stalled at ${step}`,
	);
}

export function withImportStepTimeout<T>({
	step,
	ms,
	run,
	fileName,
}: {
	step: string;
	ms: number;
	run: () => T | Promise<T>;
	fileName?: string;
}): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			logImportStall(step, fileName);
			reject(
				new Error(
					formatImportFailure({
						step,
						detail: `timed out after ${Math.round(ms / 1000)}s`,
					}),
				),
			);
		}, ms);
		Promise.resolve()
			.then(run)
			.then((value) => {
				clearTimeout(timer);
				resolve(value);
			})
			.catch((error: unknown) => {
				clearTimeout(timer);
				const detail = error instanceof Error ? error.message : String(error);
				if (IMPORT_FAILURE_PREFIX.test(detail)) {
					reject(error instanceof Error ? error : new Error(detail));
					return;
				}
				reject(new Error(formatImportFailure({ step, detail })));
			});
	});
}

/**
 * Drives a `generateProxy` stream. Each wait is bounded by the current
 * step's silence budget: transcode progress resets the proxy clock, and
 * the first `thumbnails` event (the 95% marker) switches the clock to the
 * thumbnail step. A stall rejects with `Import failed at <step>: …` and
 * drops the native listener.
 */
export async function drainProxyEvents({
	events,
	onEvent,
	silenceMs = IMPORT_STEP_SILENCE_MS,
	fileName,
}: {
	events: AsyncGenerator<NativeProxyProgress>;
	onEvent: (event: NativeProxyProgress) => void;
	silenceMs?: { proxy: number; thumbnails: number };
	fileName?: string;
}): Promise<{ final: NativeProxyProgress; step: "proxy" | "thumbnails" }> {
	let step: "proxy" | "thumbnails" = "proxy";
	const iterator = events[Symbol.asyncIterator]();
	let released = false;
	// `iterator.return()` does not interrupt a generator parked on `await`
	// (Bun). Timing out must reject the wait from outside, then move on —
	// awaiting `return()` here is how a stalled thumbnail step stayed a spinner.
	const release = () => {
		if (released) return;
		released = true;
		const cancel = (iterator as AsyncIterator<NativeProxyProgress> & { cancel?: () => void }).cancel;
		if (typeof cancel === "function") {
			cancel();
			return;
		}
		void iterator.return?.(undefined)?.catch(() => {});
	};
	try {
		for (;;) {
			const timeoutMs = silenceMs[step];
			let timer: ReturnType<typeof setTimeout> | undefined;
			const pending = iterator.next().then(
				(value) => ({ kind: "next" as const, value }),
				(error: unknown) => ({ kind: "error" as const, error }),
			);
			const timeout = new Promise<{ kind: "timeout" }>((resolve) => {
				timer = setTimeout(() => resolve({ kind: "timeout" }), timeoutMs);
			});
			const outcome = await Promise.race([pending, timeout]);
			if (timer !== undefined) clearTimeout(timer);
			if (outcome.kind === "timeout") {
				logImportStall(step, fileName);
				release();
				throw new Error(
					formatImportFailure({
						step,
						detail: `timed out after ${Math.round(timeoutMs / 1000)}s`,
					}),
				);
			}
			if (outcome.kind === "error") {
				const detail = outcome.error instanceof Error ? outcome.error.message : String(outcome.error);
				throw new Error(formatImportFailure({ step, detail }));
			}
			const next = outcome.value;
			if (next.done || !next.value) {
				throw new Error(formatImportFailure({ step, detail: "ended before a result" }));
			}
			const event = next.value;
			onEvent(event);
			if (event.stage === "done" || event.stage === "error") {
				return { final: event, step };
			}
			step = importStepForProxyEvent(event);
		}
	} finally {
		if (!released) {
			released = true;
			await iterator.return?.(undefined);
		}
	}
}

/** Android rejects a dismissed picker with `USER_CANCELLED`; iOS and web
 *  resolve `[]`. Both are the same outcome: nothing picked. */
function isUserCancelled(error: unknown): boolean {
	return (
		error instanceof Error &&
		"code" in error &&
		error.code === "USER_CANCELLED"
	);
}

/**
 * Step 1 of the import: open the picker and wait for the native side to
 * load what was chosen. Needs no editor or project, so a caller can decide
 * whether to create a project only AFTER media actually arrived.
 * `onPickStart` fires once, on the first native event after Done — the
 * earliest moment the UI knows the user committed to a pick.
 */
export async function pickNativeMedia({
	source,
	kinds,
	allowMultiple,
	onPickStart,
	onProgress,
}: {
	source: NativeMediaSource;
	kinds: MediaType[];
	allowMultiple: boolean;
	onPickStart?: () => void;
	onProgress?: (progress: NativeImportProgress) => void;
}): Promise<PickNativeMediaResult> {
	let pickFailures = 0;
	let failureMessage: string | undefined;
	let started = false;
	let handles: NativeMediaHandle[];
	try {
		handles = await source.pickMedia({
			kinds,
			allowMultiple,
			onProgress: (pick) => {
				if (!started) {
					started = true;
					onPickStart?.();
				}
				if (pick.stage === "error") {
					// A dropped item must be VISIBLE — the silent version made an
					// all-failed batch (e.g. iCloud originals with no network)
					// indistinguishable from a user cancel (2026-08-19).
					pickFailures++;
					const reason = pick.error ?? "unknown error";
					if (!failureMessage && IMPORT_FAILURE_PREFIX.test(reason)) {
						failureMessage = reason;
						console.error(`[import] ${importFailureKind(reason)} at probe: ${reason}`);
					}
					toast.error({
						message: `Couldn't load item ${pick.index + 1} of ${pick.total}`,
						description: `${reason} — if it's stored in iCloud, check your connection and try again`,
					});
					return;
				}
				onProgress?.({
					index: pick.index,
					total: pick.total,
					fileName: "",
					stage: "picking",
					fraction: pick.fraction,
				});
			},
		});
	} catch (error) {
		if (isUserCancelled(error)) {
			return { handles: [], pickFailures: 0 };
		}
		throw error;
	}
	return failureMessage ? { handles, pickFailures, failureMessage } : { handles, pickFailures };
}

/**
 * Step 2: generate proxies for picked handles. Needs no editor or project.
 * Plan M4 item 7's import-failure UX (unsupported codec, proxy-generation
 * failure) is handled per-asset — one bad clip in a multi-select doesn't
 * abort the rest, matching `MediaPickerCoordinator.importOne`'s same
 * one-bad-item-doesn't-lose-the-batch policy on the native side.
 */
export async function prepareNativeMedia({
	source,
	handles,
	proxySpec = { targetHeight: 540, shortGop: true },
	onProgress,
}: {
	source: NativeMediaSource;
	handles: NativeMediaHandle[];
	/** Plan Amendment 4 default: 540p short edge, short-GOP on. */
	proxySpec?: { targetHeight: number; shortGop: boolean };
	onProgress?: (progress: NativeImportProgress) => void;
}): Promise<PrepareNativeMediaResult> {
	// One root lookup per import batch; null (web / old native build) just
	// disables relative-path persistence, it never blocks the import.
	const mediaRoot = await source.getMediaRoot().catch(() => null);

	const prepared: PreparedNativeMedia[] = [];
	const failed: NativeImportFailure[] = [];

	for (const [index, handle] of handles.entries()) {
		// Announce the asset before its first native event arrives — the gap
		// between picker dismissal and the first "transcoding" event is
		// exactly where the UI used to look dead.
		onProgress?.({
			index,
			total: handles.length,
			fileName: handle.fileName,
			stage: "queued",
			fraction: 0,
		});
		let finalProxy: NativeProxyProgress | null = null;

		// Images never enter the proxy transcode: the native pipeline is a
		// VIDEO transcoder (AVFoundation / Media3), and feeding it a still
		// fails with "Cannot Open … AVErrorFailedDependenciesKey=(Duration)"
		// (founder's iPhone, 2026-08-19 — every JPEG import died). The
		// web-fallback contract already states the rule for proxy-less kinds:
		// the proxy IS the source. The still is also its own thumbnail.
		// Audio takes the same rule (round 22's Files-picker import): the
		// native pipeline is a VIDEO transcoder; for proxy-less kinds the
		// proxy IS the source.
		if (handle.kind === "image" || handle.kind === "audio") {
			finalProxy = {
				assetId: handle.id,
				stage: "done",
				fraction: 1,
				proxyUri: handle.uri,
				thumbnailUris: handle.kind === "image" ? [handle.uri] : [],
			};
			onProgress?.({
				index,
				total: handles.length,
				fileName: handle.fileName,
				stage: "done",
				fraction: 1,
			});
		}

		let step: "proxy" | "thumbnails" = "proxy";
		try {
			if (!finalProxy) {
				// Preview sinks (CanvasSink / VideoDecoder) from the clip
				// already on the timeline hold the same hardware decoder the
				// thumbnail generator needs. Drop them before this asset's
				// proxy; the next paint opens a fresh sink.
				videoCache.clearAll();
				console.error(
					`[import] step proxy file=${handle.fileName} (preview decoders released)`,
				);
				const drained = await drainProxyEvents({
					events: source.generateProxy({
						handle,
						spec: proxySpec,
					}),
					fileName: handle.fileName,
					onEvent: (progress) => {
						step = importStepForProxyEvent(progress);
						onProgress?.({
							index,
							total: handles.length,
							fileName: handle.fileName,
							stage: progress.stage,
							fraction: progress.fraction,
						});
					},
				});
				finalProxy = drained.final;
				step = drained.step;
			}
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			const message = formatImportFailure({ step, detail });
			console.error(
				`[import] ${importFailureKind(message)} at ${step} file=${handle.fileName}: ${message}`,
			);
			failed.push({ handle, error: message });
			toast.error({
				message: `Couldn't process "${handle.fileName}"`,
				description: message,
			});
			continue;
		}

		if (!finalProxy || finalProxy.stage === "error") {
			const message = formatImportFailure({
				step,
				detail: finalProxy?.error ?? "proxy generation produced no result",
			});
			console.error(
				`[import] ${importFailureKind(message)} at ${step} file=${handle.fileName}: ${message}`,
			);
			failed.push({ handle, error: message });
			toast.error({
				message: `Couldn't process "${handle.fileName}"`,
				description: message,
			});
			continue;
		}

		prepared.push({ handle, proxy: finalProxy });
	}

	return { prepared, failed, mediaRoot };
}

/** Step 3: construct + commit a `MediaAsset` per prepared item into the
 *  active project. Requires the project to exist. */
export function commitPreparedMedia({
	editor,
	projectId,
	prepared,
	toPlaybackUri,
	mediaRoot,
}: {
	editor: EditorCore;
	projectId: string;
	prepared: PreparedNativeMedia[];
	toPlaybackUri: (nativeUri: string) => string;
	mediaRoot: string | null;
}): MediaAsset[] {
	const imported: MediaAsset[] = [];
	for (const { handle, proxy } of prepared) {
		const assetInput = buildMediaAssetFromNativeImport({
			handle,
			proxy,
			toPlaybackUri,
			mediaRoot,
		});

		const command = new AddMediaAssetCommand({ projectId, asset: assetInput });
		editor.command.execute({ command });

		const createdId = command.getAssetId();
		const created = editor.media
			.getAssets()
			.find((asset) => asset.id === createdId);
		if (created) {
			imported.push(created);
		}
	}
	return imported;
}

/**
 * The end-to-end M4 import flow into an EXISTING project: pick → (per
 * asset) generate proxy → construct + commit a `MediaAsset`.
 */
export async function importMediaFromNative({
	editor,
	projectId,
	source,
	kinds,
	allowMultiple,
	proxySpec,
	onProgress,
}: ImportMediaFromNativeParams): Promise<ImportMediaFromNativeResult> {
	const { handles } = await pickNativeMedia({
		source,
		kinds,
		allowMultiple,
		onProgress,
	});
	if (handles.length === 0) {
		return { imported: [], failed: [] };
	}
	const { prepared, failed, mediaRoot } = await prepareNativeMedia({
		source,
		handles,
		proxySpec,
		onProgress,
	});
	const imported = await withImportStepTimeout({
		step: "commit",
		ms: IMPORT_STEP_SILENCE_MS.commit,
		fileName: prepared[0]?.handle.fileName,
		run: () =>
			commitPreparedMedia({
				editor,
				projectId,
				prepared,
				toPlaybackUri: source.toPlaybackUri,
				mediaRoot,
			}),
	});
	return { imported, failed };
}
