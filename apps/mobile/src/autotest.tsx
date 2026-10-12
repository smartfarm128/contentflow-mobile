/**
 * kneecap `#/autotest` — headless-drivable end-to-end playback QA
 * (2026-08-19, added during the device-playback campaign).
 *
 * The one gap every automated gate shared was "no human tap": the CI/browser
 * harnesses never exercised native import → persistence → preview frames, so
 * device-only failures (zero-byte stub decode, container-UUID rotation)
 * survived four rounds of green builds. This route drives that exact loop
 * inside the REAL app with no UI interaction, so a simulator run (which has
 * no tap automation without host Accessibility permissions) can verify it:
 *
 *   1. The runner plants a real mp4 at `<mediaRoot>/Media/autotest-source.mp4`
 *      (`xcrun simctl get_app_container … data` + cp) and relaunches the app
 *      with `#/autotest` in the URL (see docs/STATUS.md round 5).
 *   2. IMPORT phase (no project named "Autotest" yet): create the project,
 *      run the REAL `importMediaFromNative` orchestration against the real
 *      bridge — only `pickMedia` is substituted, returning a handle for the
 *      planted file — and place the clip on the timeline like the "+" button
 *      does.
 *   3. REOPEN phase (an "Autotest" project already exists): load it from
 *      storage instead, exercising persistence + container-relative path
 *      re-anchoring (media/native-paths.ts).
 *   4. Both phases then mount the real EditorShell, wait for the preview
 *      canvas, press play, and sample rendered pixels off the wgpu output
 *      canvas. Every step logs `[autotest] …`; the terminal line is
 *      `[autotest] VERDICT phase=<import|reopen> <PASS|FAIL> …`, greppable
 *      from `simctl launch --console-pty`.
 *
 *   5. EXPORT-HONESTY phase (`#/autotest/export-honesty`, or a planted
 *      `<mediaRoot>/autotest-export-honesty.flag` next to `autotest.flag`):
 *      a project with the planted video PLUS a motion template, a blob-only
 *      asset and a filter. The verdict requires the export to succeed and
 *      the omission list to name all three. It does not run the playback
 *      phases.
 *
 *   6. CUSTODY-MEDIA phase (`#/autotest/custody-media`, or
 *      `<mediaRoot>/autotest-custody-media.flag`): imports the planted mp4
 *      and a planted mp3 through the same `importRemoteMedia` path Pexels
 *      and ElevenLabs use, reloads the project, exports, and requires both
 *      files in the output with no omissions.
 *
 *   7. OVERLAY-PIXELS phase (`#/autotest/overlay-pixels`, or
 *      `<mediaRoot>/autotest-overlay-pixels.flag`): exports the planted mp4
 *      alone, then again with a CSS template, a WebGL template and a
 *      sticker. The second file's frames must differ from the baseline in
 *      each of those three regions, and none of them is an omission.
 *      Each stage logs `step: <name>` and `diag:` lines for the sub-step
 *      that produced it. The phase flag is deleted before any of that work,
 *      so a webview crash cannot relaunch into the same phase. A thrown
 *      failure, a window error, an unhandled rejection, or a 240s watchdog
 *      logs `VERDICT phase=overlay-pixels FAIL`.
 *
 *   8. FRAME-CAPTURE phase (`#/autotest/frame-capture`, or
 *      `<mediaRoot>/autotest-frame-capture.flag`): imports the planted mp4,
 *      inserts a CSS motion template, and captures one AI still. The JPEG
 *      must include the proxy video (non-black) and the template's magenta.
 *      The phase flag is deleted first. `diag:` lines name the grab and
 *      paint sub-steps. The live preview canvas, when it can be read, must
 *      be unchanged. A throw, window error, or the 240s watchdog logs
 *      `VERDICT phase=frame-capture FAIL`.
 *
 * Deliberately a sibling of `#/diagnostics`: reachable only by hash, inert
 * for real users, and honest about being QA chrome rather than product.
 */
// The SAME stylesheet set app-root.tsx loads — vite splits CSS per entry
// chunk, so without these the whole route rendered UNSTYLED: every earlier
// screenshot's degraded layout, and a timeline scroller stuck at
// overflow:visible (scrollLeft a no-op), were THIS harness's artifact, not
// the app's (2026-08-19).
import "@kneecap/mobile-ui/tokens.css";
import "@kneecap/mobile-ui/components.css";
import "./app/app-root.css";
import { createRoot } from "react-dom/client";
import {
	EditorCore,
	importMediaFromNative,
	registerNativeMediaPathResolver,
	registerNativeAudioRouter,
	mediaTimeFromSeconds,
	videoCache,
	type NativeMediaHandle,
	type NativeMediaSource,
} from "@kneecap/editor-core";
import { buildElementFromMedia, buildTextElement } from "@kneecap/editor-core/timeline";
import { AddClipEffectCommand, AddMediaAssetCommand, InsertElementCommand, UpdateElementsCommand } from "@kneecap/editor-core/commands";
import { buildEdl, listNativeExportOmissions } from "@kneecap/editor-core/edl";
import { loadFontAtlas } from "@kneecap/editor-core/fonts/local-fonts";
import {
	EditorShell,
	buildNativeEdlAssetResolver,
	ensurePreviewGpu,
	importPexelsMediaToTimeline,
	importRemoteMediaToTimeline,
	createHtmlOverlayPainter,
	insertHtmlTemplateElement,
	insertStickerElement,
	clearSpilledOverlayPngs,
	spillOverlayFrame,
	captureFrameAt,
	toEdlMediaAssets,
} from "@kneecap/mobile-ui";
import { getNativeBridge } from "@kneecap/native-bridge";

const PROJECT_NAME = "Autotest";
const SOURCE_RELATIVE = "Media/autotest-source.mp4";

const log = (...args: unknown[]) => console.error("[autotest]", ...args);

/** Matches the clip the runner plants (ffmpeg testsrc2 1280x720@30, 6s,
 *  h264 + aac). generateProxy's native side probes the real file for
 *  everything that matters; these fields are the wire contract's metadata. */
function plantedHandle(root: string): NativeMediaHandle {
	const handle: NativeMediaHandle = {
		id: "autotest-src",
		uri: `${root}/${SOURCE_RELATIVE}`,
		kind: "video",
		fileName: "autotest-source.mp4",
		sizeBytes: 2_372_615,
		durationMicros: 6_000_000,
		width: 1280,
		height: 720,
		hasAudio: true,
		codec: "avc1",
		frameRate: { numerator: 30, denominator: 1 },
	};
	// rotationDegrees is not part of editor-core's structural handle subset,
	// but the real native generateProxy reads it off the wire handle dict
	// (pickMedia normally supplies it) — add it the way pickMedia would.
	return Object.assign({}, handle, { rotationDegrees: 0 });
}

/** The still the runner plants next to the video (regression coverage for
 *  the image-import path: images must NEVER reach the native video
 *  transcoder — found on device 2026-08-19, AVFoundation -11828). */
function plantedImageHandle(root: string): NativeMediaHandle {
	const handle: NativeMediaHandle = {
		id: "autotest-img",
		uri: `${root}/Media/autotest-image.jpeg`,
		kind: "image",
		fileName: "autotest-image.jpeg",
		sizeBytes: 100_000,
		durationMicros: 0,
		width: 1280,
		height: 720,
		hasAudio: false,
		codec: "jpeg",
		frameRate: null,
	};
	return Object.assign({}, handle, { rotationDegrees: 0 });
}

/** The audio file the runner plants next to the video (regression coverage
 *  for round 22's Files-picker audio import: proxy-less kinds take the
 *  proxy-IS-the-source rule, get placed on an AUDIO track, and must join
 *  the NATIVE preview mix — a clip the router can't map used to silently
 *  kill the entire native session, i.e. ALL audio, on the device where
 *  WebAudio renders silently; founder report 2026-08-20). */
function plantedAudioHandle(root: string): NativeMediaHandle {
	const handle: NativeMediaHandle = {
		id: "autotest-audio",
		uri: `${root}/Media/autotest-audio.m4a`,
		kind: "audio",
		fileName: "autotest-audio.m4a",
		sizeBytes: 36_000,
		durationMicros: 4_000_000,
		width: 0,
		height: 0,
		hasAudio: true,
		codec: "m4a",
		frameRate: null,
	};
	return Object.assign({}, handle, { rotationDegrees: 0 });
}

async function waitFor<T>(
	label: string,
	probe: () => T | null | undefined | false,
	timeoutMs = 20_000,
): Promise<T> {
	const start = Date.now();
	for (;;) {
		const value = probe();
		if (value) return value;
		if (Date.now() - start > timeoutMs) {
			throw new Error(`timed out waiting for ${label}`);
		}
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
}

/** Fraction (0..1) of visibly lit pixels on the wgpu preview canvas. */
function sampleLitFraction(canvas: HTMLCanvasElement): number {
	const w = 64;
	const h = 64;
	const scratch = document.createElement("canvas");
	scratch.width = w;
	scratch.height = h;
	const ctx = scratch.getContext("2d");
	if (!ctx) return -1;
	ctx.drawImage(canvas, 0, 0, w, h);
	const { data } = ctx.getImageData(0, 0, w, h);
	let lit = 0;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i] + data[i + 1] + data[i + 2] > 48) lit++;
	}
	return lit / (w * h);
}

async function runPhase({
	editor,
	phase,
	root,
}: {
	editor: EditorCore;
	phase: "import" | "reopen";
	root: string;
}): Promise<void> {
	const bridge = await getNativeBridge();

	if (phase === "reopen") {
		const saved = editor.project
			.getSavedProjects()
			.find((p) => p.name === PROJECT_NAME);
		if (!saved) throw new Error("reopen phase lost the Autotest project");
		await editor.project.loadProject({ id: saved.id });
		log("reopened project", saved.id);
		return;
	}

	await editor.project.createNewProject({ name: PROJECT_NAME });
	log("created project");

	// The REAL import orchestration; only the picker is substituted.
	const source: NativeMediaSource = {
		pickMedia: async (opts) => {
			// Exercise the pickProgress plumbing the way a real iCloud
			// download would drive it.
			opts.onProgress?.({ index: 0, total: 3, stage: "loading", fraction: 0.5 });
			opts.onProgress?.({ index: 0, total: 3, stage: "loaded", fraction: 1 });
			return [plantedHandle(root), plantedImageHandle(root), plantedAudioHandle(root)];
		},
		// The cast mirrors how the real flow types out: `actions.ts` passes
		// the bridge itself (method bivariance), while this explicit wrapper
		// is checked strictly — plantedHandle() DOES carry rotationDegrees.
		generateProxy: (params) =>
			bridge.generateProxy(
				params as Parameters<typeof bridge.generateProxy>[0],
			),
		toPlaybackUri: bridge.toPlaybackUri,
		getMediaRoot: () => bridge.getMediaRoot(),
	};
	const { imported, failed } = await importMediaFromNative({
		editor,
		projectId: editor.project.getActive().metadata.id,
		source,
		kinds: ["video", "image", "audio"],
		allowMultiple: true,
		onProgress: (p) =>
			log(`import ${p.fileName} ${p.stage} ${Math.round(p.fraction * 100)}%`),
	});
	if (failed.length > 0 || imported.length !== 3) {
		throw new Error(
			`import failed: imported=${imported.length} failed=${failed[0]?.error ?? "none"}`,
		);
	}
	// The image is placed AFTER the video so it lands on the MAIN track
	// (auto placement at an occupied time would push it to an overlay) —
	// regression coverage for the -11828 "Cannot Open" export failure: a
	// main-track JPEG fed to AVURLAsset killed every export containing a
	// photo (founder's device, 2026-08-23; stills now composite build-time).
	let mainCursorSec = 0;
	for (const asset of imported) {
		log(
			`imported ${asset.type} url=${asset.url} rel=${asset.nativeRelativePath ?? "(none)"}`,
		);
		// `||`: image imports probe duration 0 (same rule as actions.ts).
		const durationSec = asset.duration || 3;
		const isVisual = asset.type !== "audio";
		editor.command.execute({
			command: new InsertElementCommand({
				element: buildElementFromMedia({
					mediaId: asset.id,
					mediaType: asset.type,
					name: asset.name,
					duration: mediaTimeFromSeconds({ seconds: durationSec }),
					// The AUDIO clip deliberately OVERHANGS the main track's end
					// (round 32 regression coverage): a composition whose
					// instructions stop before its full duration is rejected
					// with AVErrorInvalidVideoComposition (-11841) — the
					// founder's export died on 2026-08-23. Starting it 1s before
					// the last visual clip ends leaves a real uncovered tail.
					startTime: isVisual
						? mediaTimeFromSeconds({ seconds: mainCursorSec })
						: mediaTimeFromSeconds({ seconds: Math.max(0, mainCursorSec - 1) }),
				}),
				// Same per-kind routing as actions.ts: audio files land on an
				// audio track (importAndPlaceAudio), visual media on video.
				placement: {
					mode: "auto",
					trackType: asset.type === "audio" ? "audio" : "video",
				},
			}),
		});
		if (isVisual) mainCursorSec += durationSec;
	}
	// A TEXT overlay with KNOWN params, for the round-33 golden-frame check
	// (founder: exported text "shrank to fuck" vs the preview, captions'
	// borders "out of control"). fontSize 15 must render at
	// 15 × canvasHeight/90 = 120px on a 720-tall canvas, and the 2%-of-font
	// border at ~2.4px total. The runner measures both off a real exported
	// frame with ffmpeg.
	editor.command.execute({
		command: new InsertElementCommand({
			element: buildTextElement({
				raw: {
					name: "autotest-text",
					duration: mediaTimeFromSeconds({ seconds: 2 }),
					params: {
						// Two lines + a trailing caption underneath: round 34
					// regression coverage for "line breaks are not registering
					// in export" and "captions must layer on top of text".
					content: "HH\nHH",
						fontSize: 15,
						color: "#ffffff",
						strokeColor: "#000000",
						strokeWidth: 2,
						fontWeight: "bold",
						// PINCH-SCALED (round 36 regression coverage): the
						// preview rasterizes glyphs from vectors at the scaled
						// size, so the export must too — rasterizing at 1× and
						// letting the compositor resample produced the soft,
						// thin text on every scaled overlay. At 1.5× the
						// exported stem must still measure the font's true
						// weight (16.2px × 1.5 ≈ 24px), not a blurred 1× raster.
						"transform.scaleX": 1.5,
						"transform.scaleY": 1.5,
					},
				},
				// Over the BLACK tail (past the last video clip) so the
				// exported glyph "ink" can be measured exactly against the
				// preview's — see the fontprobe ink log below.
				startTime: mediaTimeFromSeconds({ seconds: 9.5 }),
			}),
			placement: { mode: "newTrack", trackType: "text" },
		}),
	});
	log("text overlay placed (fontSize 15, border 2%)");

	// AUDIO AT +20 dB / 1000% (round 39 regression coverage): the volume
	// slider reaches 1000%, and an unlimited encode turns the resulting
	// over-full-scale sum into hard clipping — "audio rips when i do 1000x".
	// The runner measures the exported waveform for flat-topped (clipped)
	// samples; a limited mix has none.
	{
		const scene = editor.scenes.getActiveScene();
		const audioTrack = scene.tracks.audio[0];
		const audioElement = audioTrack?.elements[0];
		if (audioTrack && audioElement) {
			editor.command.execute({
				command: new UpdateElementsCommand({
					updates: [
						{
							trackId: audioTrack.id,
							elementId: audioElement.id,
							patch: { params: { ...audioElement.params, volume: 20 } },
						},
					],
				}),
			});
			log("audio boosted to +20 dB (1000%) for the limiter check");
		}
	}

	log("clips placed on timeline");
	await editor.project.saveCurrentProject();
	log("project saved");
}

async function driveAndSample({
	editor,
	phase,
}: {
	editor: EditorCore;
	phase: "import" | "reopen";
}): Promise<void> {
	const canvas = await waitFor(
		"preview canvas",
		() =>
			document.querySelector<HTMLCanvasElement>(
				".cc-preview-stage__render canvas",
			),
		// Generous: the canvas appears only after bootstrap, which includes
		// the REAL native transcode — a 4K60 source under the simulator's
		// software HEVC decode legitimately takes minutes (a 20s limit here
		// produced a false FAIL against a perfectly healthy app, 2026-08-19).
		240_000,
	);
	// Give the first render a beat, then confirm playback advances AND the
	// canvas shows real pixels.
	await new Promise((resolve) => setTimeout(resolve, 800));
	const timelineScroller =
		document.querySelector<HTMLElement>(".cc-timeline__scroll");
	const t0 = editor.playback.getCurrentTime();
	const scroll0 = timelineScroller?.scrollLeft ?? -1;
	editor.playback.play();
	await new Promise((resolve) => setTimeout(resolve, 1200));
	log(
		"mid-play:",
		JSON.stringify({
			engineT: String(editor.playback.getCurrentTime()),
			scrollLeft: timelineScroller?.scrollLeft ?? -1,
			scrollWidth: timelineScroller?.scrollWidth ?? -1,
			clientWidth: timelineScroller?.clientWidth ?? -1,
			overflowX: timelineScroller
				? getComputedStyle(timelineScroller).overflowX
				: "(none)",
			display: timelineScroller
				? getComputedStyle(timelineScroller).display
				: "(none)",
			label:
				document.querySelector(".cc-timeline__timecode, [class*='timecode']")
					?.textContent ?? "(no label node)",
		}),
	);
	const litA = sampleLitFraction(canvas);
	// Sound: sample the master-bus RMS while playing — "sinks opened" is not
	// "audio flows" (founder heard silence while all open/decode stats
	// passed, 2026-08-19). Non-zero RMS proves signal up to the speaker
	// driver, the furthest a headless run can hear.
	let rmsMax = 0;
	for (let i = 0; i < 8; i++) {
		rmsMax = Math.max(rmsMax, await editor.audio.getOutputLevel());
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	const litB = sampleLitFraction(canvas);
	const t1 = editor.playback.getCurrentTime();
	const scroll1 = timelineScroller?.scrollLeft ?? -1;
	const audio = editor.audio.getStats();

	// Selection + delete flow, via the REAL gesture path (pointerdown/up on
	// the clip node — plain click() does not select, per the M-sweep):
	// select the video clip, assert the contextual row's direct Delete
	// button appears, press it, assert the element left the track, undo.
	let selectOk = false;
	let selectDetail = "no video clip node";
	const clipNode = document.querySelector<HTMLElement>(
		".cc-timeline__clip--video",
	);
	if (clipNode) {
		const rect = clipNode.getBoundingClientRect();
		const pointerOpts = {
			bubbles: true,
			cancelable: true,
			pointerId: 7,
			pointerType: "touch",
			clientX: rect.left + rect.width / 2,
			clientY: rect.top + rect.height / 2,
		};
		clipNode.dispatchEvent(new PointerEvent("pointerdown", pointerOpts));
		clipNode.dispatchEvent(new PointerEvent("pointerup", pointerOpts));
		await new Promise((resolve) => setTimeout(resolve, 400));
		const selectedCount = editor.selection.getSelectedElements().length;
		const deleteButton = [...document.querySelectorAll("button")].find(
			(b) => b.textContent?.trim() === "Delete",
		);
		if (selectedCount === 1 && deleteButton) {
			const mainBefore =
				editor.scenes.getActiveSceneOrNull()?.tracks.main.elements.length ?? -1;
			deleteButton.click();
			await new Promise((resolve) => setTimeout(resolve, 400));
			const mainAfter =
				editor.scenes.getActiveSceneOrNull()?.tracks.main.elements.length ?? -1;
			selectOk = mainAfter === mainBefore - 1;
			selectDetail = `sel=${selectedCount} delete ${mainBefore}->${mainAfter}`;
			// Restore the clip so later reopen phases still have media to play.
			editor.command.undo();
			await new Promise((resolve) => setTimeout(resolve, 200));
		} else {
			selectDetail = `sel=${selectedCount} deleteBtn=${Boolean(deleteButton)}`;
		}
	}
	// Bisect the audio-sink hang: same asset URL, (a) mediabunny audio
	// demux over UrlSource (the hanging production path), (b) over a
	// whole-file Blob (transport removed). TIMEOUT on (a) + ok on (b)
	// convicts UrlSource-based audio demux; TIMEOUT on both convicts the
	// demux/decode itself.
	const videoAsset = editor.media.getAssets().find((a) => a.type === "video");
	if (videoAsset?.url) {
		const { Input, ALL_FORMATS, UrlSource, BlobSource } = await import("mediabunny");
		const race = (p: Promise<unknown>) =>
			Promise.race([
				p.then((v) => (v ? "ok" : "null")),
				new Promise<string>((r) => setTimeout(() => r("TIMEOUT"), 4000)),
			]).catch((e) => `THREW ${e instanceof Error ? e.message : String(e)}`);
		const urlInput = new Input({
			source: new UrlSource(videoAsset.url),
			formats: ALL_FORMATS,
		});
		log("audio-probe url:", await race(urlInput.getPrimaryAudioTrack()));
		const bytes = await fetch(videoAsset.url).then((r) => r.arrayBuffer());
		const blobInput = new Input({
			source: new BlobSource(new Blob([bytes])),
			formats: ALL_FORMATS,
		});
		log("audio-probe blob:", await race(blobInput.getPrimaryAudioTrack()));
	}
	const dbgTracks = editor.scenes.getActiveSceneOrNull()?.tracks;
	log(
		"audio-debug elements:",
		JSON.stringify(
			dbgTracks?.main.elements.map((e) => {
				const el = e as unknown as Record<string, unknown>;
				return {
					type: el.type,
					mediaId: el.mediaId,
					muted: el.muted,
					sourceType: el.sourceType,
				};
			}),
		),
		"assets:",
		JSON.stringify(
			editor.media
				.getAssets()
				.map((a) => ({ type: a.type, hasAudio: a.hasAudio, name: a.name })),
		),
	);
	editor.playback.pause();

	const advanced = t1 > t0;
	const stats = videoCache.getStats();
	// Font-chunk decode probe: image-FORMAT support must be measured
	// in-app, not assumed — the atlas shipped as AVIF variants iOS could
	// not decode, then as lossless WebP iOS ALSO refused (err=-50), and
	// neither showed up in any console this harness captured (the decode
	// errors live in the WebContent process). Image.decode() is the same
	// path the real font picker uses.
	const fontsOk = await new Promise<boolean>((resolve) => {
		const probe = new Image();
		probe.onload = () => resolve(probe.naturalWidth > 0);
		probe.onerror = () => resolve(false);
		probe.src = "/fonts/font-chunk-0.png";
		setTimeout(() => resolve(false), 5000);
	});
	// WebKit clears WebGPU canvases after present, so drawImage readback is
	// legitimately blank (verified 2026-08-19: lit=0.000 while a simulator
	// screenshot showed the video playing). `lit` is advisory only; the
	// binding in-page evidence is: the clock advanced AND the video cache
	// actually decoded frames for an active sink. The RUNNER additionally
	// captures a `simctl io … screenshot` for pixel-level ground truth.
	const decoded = stats.totalSinks > 0 && stats.cachedFrames > 0;
	const lit = Math.max(litA, litB);
	// Audio: speakers can't be heard headlessly; the in-page evidence is a
	// RUNNING AudioContext with opened sinks and zero failures (the test
	// clip has an audio track). Timeline follow: the strip must have
	// scrolled while the clock ran (CapCut fixed-playhead model — the strip
	// IS the tracking).
	// nativeSkippedClips must be 0: a clip the router can't map is silent
	// for the whole session (see audio-manager's tryStartNativeRoute) — the
	// planted AUDIO file import (round 22) rides this exact path.
	const audioOk = audio.routedNatively
		? audio.failedSinks === 0 && audio.nativeSkippedClips === 0
		: audio.contextState === "running" &&
			audio.failedSinks === 0 &&
			audio.activeSinks + audio.decodedBuffers > 0;
	// FONT PROBE (round 36): measure what the APP'S OWN preview canvas draws
	// — same face, size and weight the text overlay uses — so it can be
	// compared numerically against the exported frame. The WebGPU preview
	// canvas can't be read back (WebKit clears it post-present), but text
	// reaches it through a 2D context, so an offscreen 2D canvas is the
	// faithful stand-in. Albert Sans Bold at 120px measures cap 84px /
	// stem 16.2px in the font's own outlines.
	try {
		const fontsApi = document.fonts;
		await fontsApi.load('bold 120px "Albert Sans"');
		await fontsApi.load('120px "Albert Sans"');
		const probe = document.createElement("canvas");
		probe.width = 900;
		probe.height = 300;
		const pctx = probe.getContext("2d", { willReadFrequently: true });
		if (pctx) {
			pctx.fillStyle = "#000";
			pctx.fillRect(0, 0, 900, 300);
			pctx.font = 'normal bold 120px "Albert Sans", sans-serif';
			pctx.fillStyle = "#fff";
			pctx.textAlign = "center";
			pctx.textBaseline = "middle";
			pctx.fillText("HH", 450, 150);
			const data = pctx.getImageData(0, 0, 900, 300).data;
			const isW = (x: number, y: number) => data[(y * 900 + x) * 4] > 200;
			const rows: number[] = [];
			for (let y = 0; y < 300; y++) {
				for (let x = 0; x < 900; x += 2) {
					if (isW(x, y)) { rows.push(y); break; }
				}
			}
			if (rows.length > 0) {
				const top = Math.min(...rows);
				const bottom = Math.max(...rows);
				const sampleY = top + Math.round((bottom - top) * 0.25);
				const stems: number[] = [];
				let run = 0;
				for (let x = 0; x < 900; x++) {
					if (isW(x, sampleY)) run++;
					else { if (run > 0) stems.push(run); run = 0; }
				}
				// INK = summed luminance / 255 over the glyph box: the
				// perceptual "how much of the letter is painted" measure,
				// independent of any threshold. The export is measured the
				// same way off a frame where the text sits on black.
				let ink = 0;
				for (let i = 0; i < data.length; i += 4) ink += data[i] / 255;
				log(
					`fontprobe check(bold)=${fontsApi.check('bold 120px "Albert Sans"')} ` +
						`check(regular)=${fontsApi.check('120px "Albert Sans"')} ` +
						`capHeight=${bottom - top + 1}px stems=${JSON.stringify(stems)} ` +
						`ink=${ink.toFixed(0)} (font outlines: cap 84px, stem 16.2px)`,
				);
			}
		}
	} catch (error) {
		log("fontprobe failed:", error);
	}

	// CAPTIONS (round 30): whole-timeline transcription. The planted VIDEO's
	// audio is a pure sine tone (no speech); the planted AUDIO-track clip is
	// real synthesized SPEECH — so any caption appearing at all proves the
	// generator processed beyond the main track's first clip (the old
	// single-clip behavior returned "No speech was detected" on exactly this
	// timeline shape — the founder's screenshot, 2026-08-23). Runs the REAL
	// on-device recognizer (iOS 26 SpeechAnalyzer / SFSpeech fallback).
	let captionsOk = false;
	let captionsDetail = "not-run";
	try {
		const { generateCaptions, getAllCaptions } = await import("@kneecap/mobile-ui");
		// Generous: the first run may download a locale model (iOS), and
		// whisper.cpp on an emulated arm64 CPU (Android) runs several times
		// slower than on real silicon — 240s was enough for the device but
		// flaked on the emulator.
		const timeoutMs = 420_000;
		const result = await Promise.race([
			generateCaptions({ editor, stylePresetId: "simple" }),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error(`captions timed out after ${timeoutMs}ms`)), timeoutMs),
			),
		]);
		const captions = getAllCaptions({ editor });
		const words = captions
			.flatMap(({ element }) => element.words.map((w) => w.text))
			.join(" ");
		captionsOk = result !== null && captions.length > 0;
		captionsDetail = captionsOk
			? `ok(${captions.length} pages, "${words.slice(0, 60)}")`
			: "generated null / zero captions";
	} catch (error) {
		captionsDetail = error instanceof Error ? error.message : String(error);
	}

	// EXPORT: build the real EDL with the native asset resolver, drive the
	// native exporter, then verify the output file has bytes AND a decodable
	// video track — the founder-device failure was "asset could not be
	// resolved to a readable URL" (missing source-path persistence,
	// 2026-08-20).
	let exportOk = false;
	let exportDetail = "not-run";
	try {
		{
			// Export-resolution ground truth (the grainy-export hunt,
			// 2026-08-22): the EDL exports at the project canvas — print it.
			const settings = editor.project.getActive().settings;
			log(
				`canvas=${settings.canvasSize.width}x${settings.canvasSize.height} mode=${settings.canvasSizeMode ?? "(unset)"}`,
			);
		}
		const { buildEdl } = await import("@kneecap/editor-core/edl");
		const { toEdlMediaAssets, buildNativeEdlAssetResolver } = await import(
			"@kneecap/mobile-ui"
		);
		const bridge = await getNativeBridge();
		const edl = buildEdl({
			project: editor.project.getActive(),
			scene: editor.scenes.getActiveScene(),
			mediaAssets: toEdlMediaAssets({ assets: editor.media.getAssets() }),
			resolveAsset: buildNativeEdlAssetResolver(),
			output: {
				container: "mp4",
				videoCodec: "h264",
				audioCodec: "aac",
				bitrate: 8_000_000,
				includeAudio: true,
			},
		});
		let outputUri: string | null = null;
		// Round 37: text/captions rendered by the PREVIEW's own code and
		// handed to the exporter, so the exported overlay layer IS the
		// editor's drawing.
		const { renderOverlayFrames } = await import(
			"@kneecap/editor-core/export/overlay-frames"
		);
		let overlayFrames: Awaited<ReturnType<typeof renderOverlayFrames>>["frames"] = [];
		try {
			overlayFrames = (
				await renderOverlayFrames({
					tracks: editor.scenes.getActiveScene().tracks,
					mediaAssets: editor.media.getAssets(),
					canvasSize: {
						width: edl.output.resolution.width,
						height: edl.output.resolution.height,
					},
					fps: edl.output.fps,
					durationTicks: edl.meta.durationTicks,
					ticksPerSecond: edl.meta.ticksPerSecond,
					spillFrame: (frame) => spillOverlayFrame({ bridge, frame }),
				})
			).frames;
			log(`overlay frames prerendered: ${overlayFrames.length}`);
			for await (const p of bridge.exportProject({ edl, overlayFrames })) {
				if (p.stage === "error") throw new Error(p.error ?? "export error");
				if (p.stage === "done") outputUri = p.outputUri ?? null;
			}
		} finally {
			await clearSpilledOverlayPngs({ bridge });
		}
		if (!outputUri) throw new Error("export finished without an outputUri");
		// exportProject's outputUri is ALREADY a converted playback URL (the
		// bridge maps it through toPlaybackUri) — converting again produced a
		// double-marker dead URL (caught by this assertion's own detail log).
		const outputUrl = outputUri;
		let bytes: ArrayBuffer | null = null;
		let lastFetchError = "";
		// A just-finalized file can race the scheme handler's first read —
		// retry briefly before declaring the output unreadable.
		for (let attempt = 0; attempt < 4; attempt++) {
			try {
				bytes = await fetch(outputUrl).then((r) => r.arrayBuffer());
				break;
			} catch (e) {
				lastFetchError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
		if (!bytes) {
			throw new Error(`output fetch failed (${lastFetchError}) url=${outputUrl}`);
		}
		if (bytes.byteLength < 10_000) {
			throw new Error(`suspiciously small output (${bytes.byteLength}B)`);
		}
		const { Input, ALL_FORMATS, BlobSource } = await import("mediabunny");
		const probe = new Input({
			source: new BlobSource(new Blob([bytes])),
			formats: ALL_FORMATS,
		});
		const track = await probe.getPrimaryVideoTrack();
		if (!track) throw new Error("output has no video track");
		exportOk = true;
		exportDetail = `${Math.round(bytes.byteLength / 1024)}KB`;
	} catch (error) {
		exportDetail = error instanceof Error ? error.message : String(error);
	}

	const timelineOk = scroll0 >= 0 && scroll1 > scroll0;
	const soundOk = rmsMax > 0.0005;
	const pass =
		advanced && decoded && fontsOk && audioOk && timelineOk && selectOk && soundOk && exportOk && captionsOk;
	log(
		`VERDICT phase=${phase} ${pass ? "PASS" : "FAIL"} advanced=${advanced} sinks=${stats.totalSinks} decodedFrames=${stats.cachedFrames} fonts=${fontsOk ? "ok" : "FAIL"} audio=${audioOk ? `ok(${audio.routedNatively ? "native" : "web"})` : `FAIL(${audio.contextState},routed=${audio.routedNatively},clips=${audio.scheduledClips},active=${audio.activeClips},sinks=${audio.activeSinks},failed=${audio.failedSinks},buffers=${audio.decodedBuffers})`} timeline=${timelineOk ? `ok(${scroll0}->${scroll1}px)` : `FAIL(${scroll0}->${scroll1}px)`} select=${selectOk ? `ok(${selectDetail})` : `FAIL(${selectDetail})`} export=${exportOk ? `ok(${exportDetail})` : `FAIL(${exportDetail})`} captions=${captionsOk ? captionsDetail : `FAIL(${captionsDetail})`} sound=${soundOk ? `ok(rms=${rmsMax.toFixed(4)})` : `FAIL(rms=${rmsMax.toFixed(4)},queued=${audio.queuedSources},AudioDecoder=${typeof (globalThis as { AudioDecoder?: unknown }).AudioDecoder !== "undefined"})`} lit=${lit.toFixed(3)} (t ${String(t0)} -> ${String(t1)})`,
	);
}

const HONESTY_PROJECT = "Autotest Export Honesty";
const CUSTODY_PROJECT = "Autotest Custody Media";
const VOICE_RELATIVE = "Media/autotest-voice.mp3";

/** Spaces in the iOS container path must be percent-encoded for URL(string:). */
function fixtureFileUrl({ root, relative }: { root: string; relative: string }): string {
	return `file://${encodeURI(`${root}/${relative}`)}`;
}

/**
 * Exports a project that contains one real planted clip plus the three
 * things the native exporters still cannot render: a motion template, a
 * blob-only asset, and a filter. PASS means the file encodes AND the
 * omission list names each of those three.
 */
async function runExportHonesty({
	editor,
	root,
}: {
	editor: EditorCore;
	root: string;
}): Promise<void> {
	const fail = (detail: string) => {
		log(`VERDICT phase=export-honesty FAIL ${detail}`);
	};
	let spilledBridge: Awaited<ReturnType<typeof getNativeBridge>> | null = null;
	try {
		await editor.project.createNewProject({ name: HONESTY_PROJECT });
		const bridge = await getNativeBridge();
		spilledBridge = bridge;
		const source: NativeMediaSource = {
			pickMedia: async () => [plantedHandle(root)],
			generateProxy: (params) => bridge.generateProxy(params as Parameters<typeof bridge.generateProxy>[0]),
			toPlaybackUri: bridge.toPlaybackUri,
			getMediaRoot: () => bridge.getMediaRoot(),
		};
		const { imported, failed } = await importMediaFromNative({
			editor,
			projectId: editor.project.getActive().metadata.id,
			source,
			kinds: ["video"],
			allowMultiple: false,
		});
		if (failed.length > 0 || imported.length !== 1) {
			fail(`import failed: imported=${imported.length} failed=${failed[0]?.error ?? "none"}`);
			return;
		}
		const video = imported[0];
		if (!video) {
			fail("import returned no video");
			return;
		}
		editor.command.execute({
			command: new InsertElementCommand({
				element: buildElementFromMedia({
					mediaId: video.id,
					mediaType: video.type,
					name: video.name,
					duration: mediaTimeFromSeconds({ seconds: video.duration || 6 }),
					startTime: mediaTimeFromSeconds({ seconds: 0 }),
				}),
				placement: { mode: "auto", trackType: "video" },
			}),
		});

		const scene = editor.scenes.getActiveScene();
		const main = scene.tracks.main;
		const mainEl = main.elements[0];
		if (!mainEl) {
			fail("planted video did not land on the main track");
			return;
		}
		editor.command.execute({
			command: new AddClipEffectCommand({
				trackId: main.id,
				elementId: mainEl.id,
				effectType: "filter",
			}),
		});

		const templateRef = insertHtmlTemplateElement({
			editor,
			templateId: "html-text-scramble",
			durationSec: 3,
			startSeconds: 0,
		});
		if (!templateRef) {
			fail("html-text-scramble did not insert");
			return;
		}

		const blobFile = new File([new Uint8Array(32)], "pexels-broll.mp4", { type: "video/mp4" });
		const blobCommand = new AddMediaAssetCommand({
			projectId: editor.project.getActive().metadata.id,
			asset: {
				name: "Pexels b-roll",
				type: "video",
				file: blobFile,
				url: URL.createObjectURL(blobFile),
				duration: 2,
				width: 1280,
				height: 720,
				hasAudio: false,
			},
		});
		editor.command.execute({ command: blobCommand });
		editor.command.execute({
			command: new InsertElementCommand({
				element: buildElementFromMedia({
					mediaId: blobCommand.getAssetId(),
					mediaType: "video",
					name: "Pexels b-roll",
					duration: mediaTimeFromSeconds({ seconds: 2 }),
					startTime: mediaTimeFromSeconds({ seconds: 0 }),
				}),
				placement: { mode: "auto", trackType: "video" },
			}),
		});

		const edl = buildEdl({
			project: editor.project.getActive(),
			scene: editor.scenes.getActiveScene(),
			mediaAssets: toEdlMediaAssets({ assets: editor.media.getAssets() }),
			resolveAsset: buildNativeEdlAssetResolver(),
			output: {
				container: "mp4",
				videoCodec: "h264",
				audioCodec: "aac",
				bitrate: 4_000_000,
				includeAudio: true,
			},
		});
		const platform = bridge.platform === "ios" || bridge.platform === "android" ? bridge.platform : "web";
		// No HTML painter here: the template stays uncaptured, so the omission
		// list must still name it. The overlay-pixels phase is what paints it.
		const { renderOverlayFrames } = await import("@kneecap/editor-core/export/overlay-frames");
		const rendered = await renderOverlayFrames({
			tracks: editor.scenes.getActiveScene().tracks,
			mediaAssets: editor.media.getAssets(),
			canvasSize: {
				width: edl.output.resolution.width,
				height: edl.output.resolution.height,
			},
			fps: edl.output.fps,
			durationTicks: edl.meta.durationTicks,
			ticksPerSecond: edl.meta.ticksPerSecond,
			spillFrame: (frame) => spillOverlayFrame({ bridge, frame }),
		});
		const omissions = listNativeExportOmissions({
			edl,
			platform,
			uncapturedClipIds: new Set(rendered.uncapturedElementIds),
		});
		const messages = omissions.map((item) => item.message);
		for (const message of messages) log("omission:", message);
		const reportedTemplate = messages.some((message) => /motion template/i.test(message));
		const reportedBlob = messages.some(
			(message) => message.includes("Pexels b-roll") && /sandbox|in-memory/i.test(message),
		);
		const reportedFilter = messages.some((message) => message.startsWith("Filter on"));
		if (!reportedTemplate || !reportedBlob || !reportedFilter) {
			fail(
				`omissions incomplete template=${reportedTemplate} blob=${reportedBlob} filter=${reportedFilter} count=${messages.length}`,
			);
			return;
		}

		let outputUri: string | null = null;
		for await (const event of bridge.exportProject({ edl, overlayFrames: rendered.frames })) {
			if (event.stage === "error") throw new Error(event.error ?? "export error");
			if (event.stage === "done") outputUri = event.outputUri ?? null;
		}
		if (!outputUri) throw new Error("export finished without an outputUri");
		let bytes: ArrayBuffer | null = null;
		for (let attempt = 0; attempt < 4; attempt++) {
			try {
				bytes = await fetch(outputUri).then((response) => response.arrayBuffer());
				break;
			} catch {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
		if (!bytes || bytes.byteLength < 10_000) {
			throw new Error(`suspiciously small output (${bytes?.byteLength ?? 0}B)`);
		}
		const { Input, ALL_FORMATS, BlobSource } = await import("mediabunny");
		const probe = new Input({
			source: new BlobSource(new Blob([bytes])),
			formats: ALL_FORMATS,
		});
		const track = await probe.getPrimaryVideoTrack();
		if (!track) throw new Error("output has no video track");
		log(
			`VERDICT phase=export-honesty PASS export=${Math.round(bytes.byteLength / 1024)}KB omitted=${messages.length} template=yes blob=yes filter=yes`,
		);
	} catch (error) {
		fail(error instanceof Error ? error.message : String(error));
	} finally {
		if (spilledBridge) await clearSpilledOverlayPngs({ bridge: spilledBridge });
	}
}

/**
 * Imports a planted stock clip and a planted MP3 through the same custody
 * path Pexels and ElevenLabs use, reloads the project, and exports. PASS
 * means both files were probed (real duration, video hasAudio), survived
 * the reload, were not listed as omissions, and the encoded file has a
 * video track about as long as the stock clip plus an audio track.
 *
 * The voice fixture is a 2-second MP3 (`autotest-voice.mp3`). The stock
 * fixture is the existing 6-second `autotest-source.mp4`.
 */
async function runCustodyMedia({
	editor,
	root,
}: {
	editor: EditorCore;
	root: string;
}): Promise<void> {
	const fail = (detail: string) => {
		log(`VERDICT phase=custody-media FAIL ${detail}`);
	};
	try {
		await editor.project.createNewProject({ name: CUSTODY_PROJECT });
		const bridge = await getNativeBridge();
		const stockRef = await importPexelsMediaToTimeline({
			editor,
			downloadUrl: fixtureFileUrl({ root, relative: SOURCE_RELATIVE }),
			name: "Stock b-roll",
			type: "video",
		});
		if (!stockRef) {
			fail("stock clip did not land on the timeline");
			return;
		}
		const voice = await importRemoteMediaToTimeline({
			editor,
			request: {
				url: fixtureFileUrl({ root, relative: VOICE_RELATIVE }),
				kind: "audio",
				fileName: "voiceover.mp3",
			},
			name: "VO fixture",
		});
		if (!voice.ref) {
			fail("voiceover did not land on the timeline");
			return;
		}

		const assets = editor.media.getAssets();
		const stockAsset = assets.find((asset) => asset.name.includes("Stock b-roll"));
		const voiceAsset = assets.find((asset) => asset.name === "voiceover.mp3");
		if (!stockAsset || !voiceAsset) {
			fail(`assets missing stock=${Boolean(stockAsset)} voice=${Boolean(voiceAsset)}`);
			return;
		}
		const stockDuration = stockAsset.duration ?? 0;
		if (!(stockDuration > 5 && stockDuration < 7)) {
			fail(`stock duration ${stockDuration}s (expected the 6s planted mp4)`);
			return;
		}
		if (stockAsset.hasAudio !== true) {
			fail("stock hasAudio is not true — probe was ignored");
			return;
		}
		const voiceDuration = voiceAsset.duration ?? 0;
		if (!(voiceDuration > 1.5 && voiceDuration < 2.5)) {
			fail(`voice duration ${voiceDuration}s (expected the 2s planted mp3)`);
			return;
		}
		if (voiceAsset.hasAudio !== true) {
			fail("voiceover hasAudio is not true");
			return;
		}
		if (!stockAsset.sourceNativeRelativePath || !voiceAsset.sourceNativeRelativePath) {
			fail(
				`relative path missing stock=${stockAsset.sourceNativeRelativePath ?? "none"} voice=${voiceAsset.sourceNativeRelativePath ?? "none"}`,
			);
			return;
		}
		if (stockAsset.url?.startsWith("blob:") || voiceAsset.url?.startsWith("blob:")) {
			fail("custody import stored a blob URL");
			return;
		}

		const projectId = editor.project.getActive().metadata.id;
		await editor.project.saveCurrentProject();
		await new Promise((resolve) => setTimeout(resolve, 800));
		await editor.project.loadProject({ id: projectId });
		const reloaded = editor.media.getAssets();
		const stockAgain = reloaded.find((asset) => asset.id === stockAsset.id);
		const voiceAgain = reloaded.find((asset) => asset.id === voiceAsset.id);
		if (!stockAgain?.sourceNativeRelativePath || !voiceAgain?.sourceNativeRelativePath) {
			fail("reload dropped a custody asset or its relative path");
			return;
		}
		const stockDurationAgain = stockAgain.duration ?? 0;
		const voiceDurationAgain = voiceAgain.duration ?? 0;
		if (!(stockDurationAgain > 5 && stockDurationAgain < 7)) {
			fail(`reloaded stock duration ${stockDurationAgain}`);
			return;
		}
		if (stockAgain.hasAudio !== true || voiceAgain.hasAudio !== true) {
			fail("reload lost hasAudio");
			return;
		}
		const scene = editor.scenes.getActiveScene();
		const hasStockClip = scene.tracks.main.elements.some((element) => element.name === "Stock b-roll");
		const hasVoiceClip = scene.tracks.audio.some((track) =>
			track.elements.some((element) => element.name === "VO fixture"),
		);
		if (!hasStockClip || !hasVoiceClip) {
			fail(`reload lost a clip stock=${hasStockClip} voice=${hasVoiceClip}`);
			return;
		}

		const edl = buildEdl({
			project: editor.project.getActive(),
			scene: editor.scenes.getActiveScene(),
			mediaAssets: toEdlMediaAssets({ assets: editor.media.getAssets() }),
			resolveAsset: buildNativeEdlAssetResolver(),
			output: {
				container: "mp4",
				videoCodec: "h264",
				audioCodec: "aac",
				bitrate: 4_000_000,
				includeAudio: true,
			},
		});
		const platform = bridge.platform === "ios" || bridge.platform === "android" ? bridge.platform : "web";
		const omissions = listNativeExportOmissions({ edl, platform });
		for (const item of omissions) log("omission:", item.message);
		if (omissions.length > 0) {
			fail(`expected no omissions, got ${omissions.length}`);
			return;
		}
		const stockEdl = edl.assets.find((asset) => asset.assetId === stockAgain.id);
		const voiceEdl = edl.assets.find((asset) => asset.assetId === voiceAgain.id);
		const stockUri = stockEdl?.sourceUri ?? "";
		const voiceUri = voiceEdl?.sourceUri ?? "";
		if (!stockUri || stockUri.startsWith("blob:") || !stockUri.includes(stockAgain.sourceNativeRelativePath)) {
			fail(`stock sourceUri not in custody: ${stockUri || "none"}`);
			return;
		}
		if (!voiceUri || voiceUri.startsWith("blob:") || !voiceUri.includes(voiceAgain.sourceNativeRelativePath)) {
			fail(`voice sourceUri not in custody: ${voiceUri || "none"}`);
			return;
		}

		let outputUri: string | null = null;
		for await (const event of bridge.exportProject({ edl, overlayFrames: [] })) {
			if (event.stage === "error") throw new Error(event.error ?? "export error");
			if (event.stage === "done") outputUri = event.outputUri ?? null;
		}
		if (!outputUri) throw new Error("export finished without an outputUri");
		let bytes: ArrayBuffer | null = null;
		for (let attempt = 0; attempt < 4; attempt++) {
			try {
				bytes = await fetch(outputUri).then((response) => response.arrayBuffer());
				break;
			} catch {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
		if (!bytes || bytes.byteLength < 10_000) {
			throw new Error(`suspiciously small output (${bytes?.byteLength ?? 0}B)`);
		}
		const { Input, ALL_FORMATS, BlobSource } = await import("mediabunny");
		const probe = new Input({
			source: new BlobSource(new Blob([bytes])),
			formats: ALL_FORMATS,
		});
		const videoTrack = await probe.getPrimaryVideoTrack();
		const audioTrack = await probe.getPrimaryAudioTrack();
		if (!videoTrack) throw new Error("output has no video track");
		if (!audioTrack) throw new Error("output has no audio track");
		const videoDuration = await videoTrack.computeDuration();
		const audioDuration = await audioTrack.computeDuration();
		if (!(videoDuration > 5 && videoDuration < 7)) {
			throw new Error(`output video duration ${videoDuration.toFixed(2)}s (expected ~6s stock clip)`);
		}
		if (!(audioDuration > 0.5)) {
			throw new Error(`output audio duration ${audioDuration.toFixed(2)}s`);
		}
		log(
			`VERDICT phase=custody-media PASS export=${Math.round(bytes.byteLength / 1024)}KB omitted=0 stock=${stockDurationAgain.toFixed(2)}s hasAudio=yes voice=${voiceDurationAgain.toFixed(2)}s videoOut=${videoDuration.toFixed(2)}s audioOut=${audioDuration.toFixed(2)}s`,
		);
	} catch (error) {
		fail(error instanceof Error ? error.message : String(error));
	}
}

const OVERLAY_PROJECT = "Autotest Overlay Pixels";

async function fetchExportBytes(outputUri: string): Promise<ArrayBuffer> {
	let bytes: ArrayBuffer | null = null;
	for (let attempt = 0; attempt < 4; attempt++) {
		try {
			bytes = await fetch(outputUri).then((response) => response.arrayBuffer());
			break;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
	if (!bytes || bytes.byteLength < 10_000) {
		throw new Error(`suspiciously small output (${bytes?.byteLength ?? 0}B)`);
	}
	return bytes;
}

async function exportEdlBytes({
	editor,
	overlayFrames,
}: {
	editor: EditorCore;
	overlayFrames: Array<{ startTicks: number; endTicks: number; pngBase64: string; pngPath?: string }>;
}): Promise<ArrayBuffer> {
	const bridge = await getNativeBridge();
	const edl = buildEdl({
		project: editor.project.getActive(),
		scene: editor.scenes.getActiveScene(),
		mediaAssets: toEdlMediaAssets({ assets: editor.media.getAssets() }),
		resolveAsset: buildNativeEdlAssetResolver(),
		output: {
			container: "mp4",
			videoCodec: "h264",
			audioCodec: "aac",
			bitrate: 4_000_000,
			includeAudio: true,
		},
	});
	let outputUri: string | null = null;
	for await (const event of bridge.exportProject({ edl, overlayFrames })) {
		if (event.stage === "error") throw new Error(event.error ?? "export error");
		if (event.stage === "done") outputUri = event.outputUri ?? null;
	}
	if (!outputUri) throw new Error("export finished without an outputUri");
	return fetchExportBytes(outputUri);
}

/** Long edge of a sampled export frame. Full-frame getImageData of a
 *  second MP4 is what wedged WKWebView after the baseline sample. */
const SAMPLE_MAX_EDGE = 640;

/**
 * Prints one FAIL verdict for a phase, including from window.onerror,
 * an unhandled rejection, or a watchdog. `close` stops further verdicts
 * so a later cleanup error cannot replace a line that already printed.
 */
function installPhaseGuard({ phase }: { phase: string }): {
	note: (detail: string) => void;
	claim: () => boolean;
	close: () => void;
} {
	let printed = false;
	const note = (detail: string) => {
		if (printed) return;
		printed = true;
		log(`VERDICT phase=${phase} FAIL ${detail}`);
	};
	const onError = (event: ErrorEvent) => {
		note(`window.onerror ${event.message} @ ${event.filename}:${event.lineno}`);
	};
	const onRejection = (event: PromiseRejectionEvent) => {
		const reason: unknown = event.reason;
		const message = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason);
		note(`unhandledrejection ${message}`);
	};
	window.addEventListener("error", onError);
	window.addEventListener("unhandledrejection", onRejection);
	const timer = window.setTimeout(() => {
		note("watchdog: no verdict after 240s");
	}, 240_000);
	return {
		note,
		/** True when this caller should print the success verdict. A
		 *  watchdog or window error that already printed a failure wins. */
		claim(): boolean {
			if (printed) return false;
			printed = true;
			return true;
		},
		close() {
			window.clearTimeout(timer);
			window.removeEventListener("error", onError);
			window.removeEventListener("unhandledrejection", onRejection);
			printed = true;
		},
	};
}

function withTimeout<T>({
	promise,
	ms,
	label,
}: {
	promise: Promise<T>;
	ms: number;
	label: string;
}): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => {
			reject(new Error(`${label} timed out after ${ms}ms`));
		}, ms);
		promise.then(
			(value) => {
				window.clearTimeout(timer);
				resolve(value);
			},
			(error: unknown) => {
				window.clearTimeout(timer);
				reject(error instanceof Error ? error : new Error(String(error)));
			},
		);
	});
}

async function clearAutotestFlags({
	names,
}: {
	names: string[];
}): Promise<void> {
	const bridge = await getNativeBridge();
	for (const name of names) {
		try {
			await bridge.removeAutotestFlag({ name });
			log("flag cleared", name);
		} catch (error) {
			log(
				"flag clear failed",
				name,
				error instanceof Error ? `${error.name}: ${error.message}` : String(error),
			);
		}
	}
}

async function frameImageData({
	bytes,
	timeSeconds,
	label,
}: {
	bytes: ArrayBuffer;
	timeSeconds: number;
	label: string;
}): Promise<{ image: ImageData; decodedWidth: number; decodedHeight: number }> {
	log(`diag: ${label} blob bytes=${bytes.byteLength}`);
	const url = URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }));
	const video = document.createElement("video");
	video.muted = true;
	video.defaultMuted = true;
	video.playsInline = true;
	video.setAttribute("playsinline", "");
	video.preload = "auto";
	// WKWebView will not always fire loadeddata on a detached element, and
	// it keeps the hardware decoder until src is cleared. Leaving the
	// baseline element alive made the overlay file's loadeddata never
	// arrive, so the phase sat past the runner's 300s cutoff with no
	// verdict. The element stays in the document for the decode, then
	// loses its src before the next sample.
	video.style.cssText =
		"position:fixed;left:0;top:0;width:8px;height:8px;opacity:0.02;pointer-events:none";
	document.body.appendChild(video);
	const diag = (detail: string) => log(`diag: ${label} ${detail}`);
	try {
		const loaded = new Promise<void>((resolve, reject) => {
			video.onloadeddata = () => resolve();
			video.onerror = () => {
				const mediaError = video.error;
				reject(
					new Error(
						`could not decode the export code=${mediaError?.code ?? "none"} ${mediaError?.message ?? ""}`.trim(),
					),
				);
			};
		});
		video.src = url;
		await withTimeout({ promise: loaded, ms: 15_000, label: `${label} loadeddata` });
		diag(`loadeddata ${video.videoWidth}x${video.videoHeight} ready=${video.readyState}`);
		if (video.videoWidth < 2) {
			diag("videoWidth empty, play()");
			try {
				await video.play();
			} catch (error) {
				diag(`play failed ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`);
			}
		}
		const sought = new Promise<void>((resolve, reject) => {
			const timer = window.setTimeout(() => reject(new Error(`${label} seek timed out`)), 8_000);
			video.onseeked = () => {
				window.clearTimeout(timer);
				resolve();
			};
			video.currentTime = timeSeconds;
		});
		await sought;
		diag(`seeked t=${video.currentTime.toFixed(3)} ${video.videoWidth}x${video.videoHeight}`);
		const decodedWidth = video.videoWidth;
		const decodedHeight = video.videoHeight;
		const longEdge = Math.max(decodedWidth, decodedHeight, 1);
		const scale = Math.min(1, SAMPLE_MAX_EDGE / longEdge);
		const width = Math.max(2, Math.round(decodedWidth * scale));
		const height = Math.max(2, Math.round(decodedHeight * scale));
		const read = ({
			source,
			width: readWidth,
			height: readHeight,
		}: {
			source: CanvasImageSource;
			width: number;
			height: number;
		}) => {
			const canvas = document.createElement("canvas");
			canvas.width = readWidth;
			canvas.height = readHeight;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx || readWidth < 2 || readHeight < 2) throw new Error("export frame has no pixels");
			ctx.drawImage(source, 0, 0, readWidth, readHeight);
			try {
				return ctx.getImageData(0, 0, readWidth, readHeight);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				throw new Error(`getImageData failed (${message})`);
			}
		};
		try {
			const pixels = read({ source: video, width, height });
			diag(`getImageData ${width}x${height} decoded=${decodedWidth}x${decodedHeight}`);
			return { image: pixels, decodedWidth, decodedHeight };
		} catch (error) {
			// WKWebView taints a canvas after drawing some video elements
			// ("The operation is insecure."). A bitmap copied out of the
			// element is same-origin and can be read from a fresh canvas.
			const name = error instanceof Error ? error.name : "Error";
			const message = error instanceof Error ? error.message : String(error);
			diag(`getImageData threw ${name}: ${message}; bitmap fallback`);
			if (typeof createImageBitmap !== "function") throw error;
			const bitmap = await createImageBitmap(video);
			try {
				const bitmapScale = Math.min(1, SAMPLE_MAX_EDGE / Math.max(bitmap.width, bitmap.height, 1));
				const bitmapWidth = Math.max(2, Math.round(bitmap.width * bitmapScale));
				const bitmapHeight = Math.max(2, Math.round(bitmap.height * bitmapScale));
				const pixels = read({ source: bitmap, width: bitmapWidth, height: bitmapHeight });
				diag(`bitmap ${bitmapWidth}x${bitmapHeight} decoded=${decodedWidth}x${decodedHeight}`);
				return { image: pixels, decodedWidth, decodedHeight };
			} finally {
				bitmap.close();
			}
		}
	} finally {
		video.pause();
		video.removeAttribute("src");
		video.load();
		video.remove();
		URL.revokeObjectURL(url);
	}
}

function diffRatio({
	base,
	over,
	box,
}: {
	base: ImageData;
	over: ImageData;
	box: { x: number; y: number; w: number; h: number };
}): number {
	const x0 = Math.max(0, Math.round(box.x));
	const y0 = Math.max(0, Math.round(box.y));
	const x1 = Math.min(base.width, Math.round(box.x + box.w));
	const y1 = Math.min(base.height, Math.round(box.y + box.h));
	const step = Math.max(1, Math.floor(Math.min(Math.max(1, x1 - x0), Math.max(1, y1 - y0)) / 28));
	let total = 0;
	let differ = 0;
	for (let y = y0; y < y1; y += step) {
		for (let x = x0; x < x1; x += step) {
			const i = (y * base.width + x) * 4;
			const delta =
				Math.abs((base.data[i] ?? 0) - (over.data[i] ?? 0)) +
				Math.abs((base.data[i + 1] ?? 0) - (over.data[i + 1] ?? 0)) +
				Math.abs((base.data[i + 2] ?? 0) - (over.data[i + 2] ?? 0));
			total += 1;
			if (delta > 60) differ += 1;
		}
	}
	return total === 0 ? 0 : differ / total;
}

/**
 * Baseline export of the planted clip, then the same clip with a CSS
 * template, a WebGL template and a sticker. Each region of the second
 * file must differ from the baseline.
 */
async function runOverlayPixels({
	editor,
	root,
}: {
	editor: EditorCore;
	root: string;
}): Promise<void> {
	const guard = installPhaseGuard({ phase: "overlay-pixels" });
	const fail = (detail: string, error?: unknown) => {
		guard.note(detail);
		if (error instanceof Error && error.stack) log(error.stack);
	};
	let step = "start";
	let spilledBridge: Awaited<ReturnType<typeof getNativeBridge>> | null = null;
	let spilled = false;
	try {
		step = "create project";
		log("step:", step);
		await editor.project.createNewProject({ name: OVERLAY_PROJECT });
		const bridge = await getNativeBridge();
		spilledBridge = bridge;
		const source: NativeMediaSource = {
			pickMedia: async () => [plantedHandle(root)],
			generateProxy: (params) => bridge.generateProxy(params as Parameters<typeof bridge.generateProxy>[0]),
			toPlaybackUri: bridge.toPlaybackUri,
			getMediaRoot: () => bridge.getMediaRoot(),
		};
		step = "import planted video";
		log("step:", step);
		const { imported, failed } = await importMediaFromNative({
			editor,
			projectId: editor.project.getActive().metadata.id,
			source,
			kinds: ["video"],
			allowMultiple: false,
		});
		if (failed.length > 0 || imported.length !== 1) {
			fail(`import failed: imported=${imported.length} failed=${failed[0]?.error ?? "none"}`);
			return;
		}
		const video = imported[0];
		if (!video) {
			fail("import returned no video");
			return;
		}
		editor.command.execute({
			command: new InsertElementCommand({
				element: buildElementFromMedia({
					mediaId: video.id,
					mediaType: video.type,
					name: video.name,
					duration: mediaTimeFromSeconds({ seconds: video.duration || 6 }),
					startTime: mediaTimeFromSeconds({ seconds: 0 }),
				}),
				placement: { mode: "auto", trackType: "video" },
			}),
		});

		step = "baseline export";
		log("step:", step);
		const baselineBytes = await exportEdlBytes({ editor, overlayFrames: [] });

		step = "insert templates";
		log("step:", step);
		const canvas = editor.project.getActive().settings.canvasSize;
		const scramble = insertHtmlTemplateElement({
			editor,
			templateId: "html-text-scramble",
			durationSec: 3,
			startSeconds: 0,
			values: {
				text: "SCRAMBLE",
				accent: "#ff2bd6",
				"transform.scaleX": 0.34,
				"transform.scaleY": 0.34,
				"transform.positionX": -canvas.width * 0.28,
				"transform.positionY": -canvas.height * 0.28,
			},
		});
		const shader = insertHtmlTemplateElement({
			editor,
			templateId: "html-shader-animation",
			durationSec: 4,
			startSeconds: 0,
			values: {
				text: "SHADER",
				textColor: "#ffe14a",
				"transform.scaleX": 0.34,
				"transform.scaleY": 0.34,
				"transform.positionX": canvas.width * 0.28,
				"transform.positionY": canvas.height * 0.28,
			},
		});
		const stickerRef = insertStickerElement({ editor, stickerId: "shapes:star" });
		if (!scramble || !shader || !stickerRef) {
			fail("could not insert template, shader, or sticker");
			return;
		}
		const stickerTrack = editor.scenes
			.getActiveScene()
			.tracks.overlay.find((track) => track.type === "graphic" && track.id === stickerRef.trackId);
		const stickerElement = stickerTrack?.elements.find((element) => element.id === stickerRef.elementId);
		if (!stickerElement) {
			fail("sticker element missing after insert");
			return;
		}
		editor.command.execute({
			command: new UpdateElementsCommand({
				updates: [
					{
						trackId: stickerRef.trackId,
						elementId: stickerRef.elementId,
						patch: {
							params: {
								...stickerElement.params,
								"transform.scaleX": 0.18,
								"transform.scaleY": 0.18,
							},
						},
					},
				],
			}),
		});

		const edl = buildEdl({
			project: editor.project.getActive(),
			scene: editor.scenes.getActiveScene(),
			mediaAssets: toEdlMediaAssets({ assets: editor.media.getAssets() }),
			resolveAsset: buildNativeEdlAssetResolver(),
			output: {
				container: "mp4",
				videoCodec: "h264",
				audioCodec: "aac",
				bitrate: 4_000_000,
				includeAudio: true,
			},
		});
		step = "rasterize overlays";
		log("step:", step);
		const painter = createHtmlOverlayPainter({
			tracks: editor.scenes.getActiveScene().tracks,
			durationSeconds: edl.meta.durationTicks / edl.meta.ticksPerSecond,
			width: edl.output.resolution.width,
			height: edl.output.resolution.height,
		});
		let overlayBytes: ArrayBuffer;
		try {
			const { renderOverlayFrames } = await import("@kneecap/editor-core/export/overlay-frames");
			spilled = true;
			const rendered = await renderOverlayFrames({
				tracks: editor.scenes.getActiveScene().tracks,
				mediaAssets: editor.media.getAssets(),
				canvasSize: {
					width: edl.output.resolution.width,
					height: edl.output.resolution.height,
				},
				fps: edl.output.fps,
				durationTicks: edl.meta.durationTicks,
				ticksPerSecond: edl.meta.ticksPerSecond,
				extraHash: (args) => painter.hashAt(args),
				paintExtras: (args) => painter.paint(args),
				spillFrame: (frame) => spillOverlayFrame({ bridge, frame }),
			});
			const platform = bridge.platform === "ios" || bridge.platform === "android" ? bridge.platform : "web";
			const omissions = listNativeExportOmissions({
				edl,
				platform,
				uncapturedClipIds: new Set(rendered.uncapturedElementIds),
			});
			for (const item of omissions) log("omission:", item.message);
			const blocked = omissions.filter((item) =>
				/Text Scramble|Kinetic Shader|Sticker "star"/i.test(item.message),
			);
			const spilledCount = rendered.frames.filter((frame) => frame.pngPath).length;
			const firstPng = rendered.frames.find((frame) => frame.pngPath)?.pngPath ?? "none";
			log(
				"raster:",
				`frames=${rendered.frames.length}`,
				`uncaptured=${rendered.uncapturedElementIds.join(",") || "none"}`,
				`spilled=${spilledCount}`,
				`inlineKB=${Math.round(rendered.frames.reduce((sum, frame) => sum + frame.pngBase64.length, 0) / 1024)}`,
				`firstPng=${firstPng}`,
			);
			if (blocked.length > 0 || rendered.uncapturedElementIds.length > 0) {
				fail(
					`step=rasterize overlays capture missed ids=${rendered.uncapturedElementIds.join(",") || "none"} omissions=${blocked.map((item) => item.message).join(" | ")}`,
				);
				return;
			}
			step = "export with overlays";
			log("step:", step);
			overlayBytes = await exportEdlBytes({ editor, overlayFrames: rendered.frames });
			log(
				`diag: export bytes=${overlayBytes.byteLength} encode=${edl.output.resolution.width}x${edl.output.resolution.height}`,
			);
		} finally {
			painter.dispose();
		}

		step = "sample baseline frame";
		log("step:", step);
		const baseSample = await frameImageData({ bytes: baselineBytes, timeSeconds: 1, label: "baseline" });
		const baseFrame = baseSample.image;
		// Let WKWebView drop the baseline decoder before the overlay file
		// asks for one. A second <video> started while the first still owns
		// the hardware decoder never fires loadeddata or error.
		await new Promise((resolve) => setTimeout(resolve, 50));
		step = "sample overlay frame";
		log("step:", step);
		const overSample = await frameImageData({ bytes: overlayBytes, timeSeconds: 1, label: "overlay" });
		const overFrame = overSample.image;
		if (baseFrame.width !== overFrame.width || baseFrame.height !== overFrame.height) {
			fail(`frame size ${baseFrame.width}x${baseFrame.height} vs ${overFrame.width}x${overFrame.height}`);
			return;
		}
		const frameScaleX = canvas.width > 0 ? baseFrame.width / canvas.width : 1;
		const frameScaleY = canvas.height > 0 ? baseFrame.height / canvas.height : 1;
		log(
			`diag: sample scale=${frameScaleX.toFixed(3)}x${frameScaleY.toFixed(3)} frame=${baseFrame.width}x${baseFrame.height} canvas=${canvas.width}x${canvas.height}`,
		);
		const box = ({
			positionX,
			positionY,
			scale,
		}: {
			positionX: number;
			positionY: number;
			scale: number;
		}) => {
			const w = baseFrame.width * scale;
			const h = baseFrame.height * scale;
			return {
				x: baseFrame.width / 2 + positionX * frameScaleX - w / 2,
				y: baseFrame.height / 2 + positionY * frameScaleY - h / 2,
				w,
				h,
			};
		};
		const scrambleRatio = diffRatio({
			base: baseFrame,
			over: overFrame,
			box: box({ positionX: -canvas.width * 0.28, positionY: -canvas.height * 0.28, scale: 0.34 }),
		});
		const shaderRatio = diffRatio({
			base: baseFrame,
			over: overFrame,
			box: box({ positionX: canvas.width * 0.28, positionY: canvas.height * 0.28, scale: 0.34 }),
		});
		const stickerSide = 180 * frameScaleX;
		const stickerRatio = diffRatio({
			base: baseFrame,
			over: overFrame,
			box: {
				x: baseFrame.width / 2 - stickerSide / 2,
				y: baseFrame.height / 2 - stickerSide / 2,
				w: stickerSide,
				h: stickerSide,
			},
		});
		if (scrambleRatio < 0.01 || shaderRatio < 0.35 || stickerRatio < 0.05) {
			fail(
				`pixels scramble=${scrambleRatio.toFixed(3)} shader=${shaderRatio.toFixed(3)} sticker=${stickerRatio.toFixed(3)}`,
			);
			return;
		}
		if (guard.claim()) {
			log(
				`VERDICT phase=overlay-pixels PASS export=${Math.round(overlayBytes.byteLength / 1024)}KB scramble=${scrambleRatio.toFixed(2)} shader=${shaderRatio.toFixed(2)} sticker=${stickerRatio.toFixed(2)} sampled=${baseFrame.width}x${baseFrame.height} decoded=${baseSample.decodedWidth}x${baseSample.decodedHeight} encode=${edl.output.resolution.width}x${edl.output.resolution.height}`,
			);
		}
	} catch (error) {
		const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
		fail(`step=${step} ${message}`, error);
	} finally {
		if (spilled && spilledBridge) {
			log("step: clear overlay pngs");
			try {
				await clearSpilledOverlayPngs({ bridge: spilledBridge });
				log("diag: overlay pngs cleared after sampling");
			} catch (error) {
				log(
					"diag: clear overlay pngs failed",
					error instanceof Error ? `${error.name}: ${error.message}` : String(error),
				);
			}
		}
		guard.close();
	}
}

const FRAME_PROJECT = "Autotest Frame Capture";

async function previewFingerprint(): Promise<string | null> {
	try {
		const { wasmCompositor } = await import(
			"@kneecap/editor-core/services/renderer/compositor/wasm-compositor"
		);
		const source = wasmCompositor.getCanvas();
		const canvas = document.createElement("canvas");
		canvas.width = 8;
		canvas.height = 8;
		const ctx = canvas.getContext("2d");
		if (!ctx || source.width < 2 || source.height < 2) return null;
		ctx.drawImage(source, 0, 0, 8, 8);
		return Array.from(ctx.getImageData(0, 0, 8, 8).data.slice(0, 16)).join(",");
	} catch {
		return null;
	}
}

async function jpegPixels({ base64 }: { base64: string }): Promise<ImageData> {
	const img = new Image();
	const loaded = new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error("jpeg decode failed"));
	});
	img.src = `data:image/jpeg;base64,${base64}`;
	await loaded;
	const canvas = document.createElement("canvas");
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	const ctx = canvas.getContext("2d");
	if (!ctx || canvas.width < 2 || canvas.height < 2) throw new Error("jpeg has no pixels");
	ctx.drawImage(img, 0, 0);
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Imports the planted clip, inserts a magenta scramble template, and
 * captures one AI still. PASS means the JPEG contains the proxy video
 * (non-black) and that magenta, and the live preview canvas was not
 * rewritten.
 */
async function runFrameCapture({
	editor,
	root,
}: {
	editor: EditorCore;
	root: string;
}): Promise<void> {
	const guard = installPhaseGuard({ phase: "frame-capture" });
	const fail = (detail: string, error?: unknown) => {
		guard.note(detail);
		if (error instanceof Error && error.stack) log(error.stack);
	};
	let step = "start";
	try {
		step = "create project";
		log("step:", step);
		await editor.project.createNewProject({ name: FRAME_PROJECT });
		const before = await previewFingerprint();
		const bridge = await getNativeBridge();
		const source: NativeMediaSource = {
			pickMedia: async () => [plantedHandle(root)],
			generateProxy: (params) => bridge.generateProxy(params as Parameters<typeof bridge.generateProxy>[0]),
			toPlaybackUri: bridge.toPlaybackUri,
			getMediaRoot: () => bridge.getMediaRoot(),
		};
		step = "import planted video";
		log("step:", step);
		const { imported, failed } = await importMediaFromNative({
			editor,
			projectId: editor.project.getActive().metadata.id,
			source,
			kinds: ["video"],
			allowMultiple: false,
		});
		if (failed.length > 0 || imported.length !== 1) {
			fail(`import failed: imported=${imported.length} failed=${failed[0]?.error ?? "none"}`);
			return;
		}
		const video = imported[0];
		if (!video) {
			fail("import returned no video");
			return;
		}
		log(`diag: imported id=${video.id} proxy=${video.nativeRelativePath ?? "none"} source=${video.sourceNativeRelativePath ?? "none"}`);
		editor.command.execute({
			command: new InsertElementCommand({
				element: buildElementFromMedia({
					mediaId: video.id,
					mediaType: video.type,
					name: video.name,
					duration: mediaTimeFromSeconds({ seconds: video.duration || 6 }),
					startTime: mediaTimeFromSeconds({ seconds: 0 }),
				}),
				placement: { mode: "auto", trackType: "video" },
			}),
		});
		step = "insert template";
		log("step:", step);
		const scramble = insertHtmlTemplateElement({
			editor,
			templateId: "html-text-scramble",
			durationSec: 3,
			startSeconds: 0,
			values: {
				text: "SCRAMBLE",
				accent: "#ff2bd6",
				"transform.scaleX": 0.8,
				"transform.scaleY": 0.8,
			},
		});
		if (!scramble) {
			fail("could not insert template");
			return;
		}
		step = "capture frame";
		log("step:", step);
		const frame = await captureFrameAt({
			editor,
			timeSeconds: 1,
			onTrace: (line) => log("diag:", line),
		});
		if (!frame || frame.base64.length < 100) {
			fail(`capture returned no jpeg video=${frame?.trace.video ?? "none"} ${frame?.trace.videoDetail ?? ""}`);
			return;
		}
		log(
			`diag: jpeg chars=${frame.base64.length} video=${frame.trace.video} detail=${frame.trace.videoDetail} captured=${frame.trace.captured.join(",") || "none"} missed=${frame.trace.missed.join(",") || "none"}`,
		);
		const after = await previewFingerprint();
		if (before && after && before !== after) {
			fail("capture drew into the live preview");
			return;
		}
		if (!frame.includesVideo) {
			fail(`video not composited ${frame.trace.videoDetail}`);
			return;
		}
		step = "read jpeg";
		log("step:", step);
		const pixels = await withTimeout({
			promise: jpegPixels({ base64: frame.base64 }),
			ms: 10_000,
			label: "jpeg decode",
		});
		let nonBlack = 0;
		let magenta = 0;
		const count = pixels.data.length / 4;
		for (let i = 0; i < pixels.data.length; i += 4) {
			const r = pixels.data[i] ?? 0;
			const g = pixels.data[i + 1] ?? 0;
			const b = pixels.data[i + 2] ?? 0;
			if (r + g + b > 40) nonBlack += 1;
			if (r > 160 && b > 120 && g < 120) magenta += 1;
		}
		const nonBlackRatio = nonBlack / count;
		const templateRatio = magenta / count;
		const preview = before && after ? "unchanged" : "unread";
		log(
			`capture nonBlack=${nonBlackRatio.toFixed(3)} template=${templateRatio.toFixed(3)} preview=${preview} video=${frame.trace.video}`,
		);
		if (nonBlackRatio < 0.2 || templateRatio < 0.0003) {
			fail(
				`frame missing video or template pixels nonBlack=${nonBlackRatio.toFixed(3)} template=${templateRatio.toFixed(3)}`,
			);
			return;
		}
		if (guard.claim()) {
			log(
				`VERDICT phase=frame-capture PASS nonBlack=${nonBlackRatio.toFixed(3)} template=${templateRatio.toFixed(3)} preview=${preview} video=${frame.trace.video}`,
			);
		}
	} catch (error) {
		fail(
			`step=${step} ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`,
			error,
		);
	} finally {
		guard.close();
	}
}

export async function mountAutotest(): Promise<void> {
	const container = document.getElementById("app");
	if (!container) throw new Error("autotest: #app container missing");

	const editor = EditorCore.getInstance();
	(window as unknown as Record<string, unknown>).__kneecap = { editor };

	void ensurePreviewGpu().then(() => loadFontAtlas());

	const bridge = await getNativeBridge();
	const root = await bridge.getMediaRoot();
	if (!root) {
		log("VERDICT phase=none FAIL no media root (web platform or old native build)");
		return;
	}
	registerNativeMediaPathResolver({ root, toPlaybackUri: bridge.toPlaybackUri });
	registerNativeAudioRouter({
		start: (params) => bridge.audioStart(params),
		stop: () => bridge.audioStop(),
		level: () => bridge.audioLevel(),
		toNativePath: (url) => {
			const marker = "/_capacitor_file_";
			const index = url.indexOf(marker);
			return index === -1 ? null : url.slice(index + marker.length);
		},
	});
	log("media root", root);

	let frameCapture = window.location.hash.includes("frame-capture");
	try {
		const frameFlag = await fetch(bridge.toPlaybackUri(`file://${root}/autotest-frame-capture.flag`));
		if (frameFlag.ok || frameFlag.status === 0) frameCapture = true;
	} catch {
		// No flag — later phases decide.
	}
	if (frameCapture) {
		log("phase: frame-capture");
		await clearAutotestFlags({
			names: ["autotest-frame-capture.flag", "autotest.flag"],
		});
		container.innerHTML = "";
		createRoot(container).render(
			<EditorShell
				bootstrap={async () => {
					await runFrameCapture({ editor, root });
				}}
			/>,
		);
		return;
	}

	let overlayPixels = window.location.hash.includes("overlay-pixels");
	try {
		const overlayFlag = await fetch(bridge.toPlaybackUri(`file://${root}/autotest-overlay-pixels.flag`));
		if (overlayFlag.ok || overlayFlag.status === 0) overlayPixels = true;
	} catch {
		// No flag — later phases decide.
	}
	if (overlayPixels) {
		log("phase: overlay-pixels");
		await clearAutotestFlags({
			names: ["autotest-overlay-pixels.flag", "autotest.flag"],
		});
		container.innerHTML = "";
		createRoot(container).render(
			<EditorShell
				bootstrap={async () => {
					await runOverlayPixels({ editor, root });
				}}
			/>,
		);
		return;
	}

	let custodyMedia = window.location.hash.includes("custody-media");
	try {
		const custodyFlag = await fetch(bridge.toPlaybackUri(`file://${root}/autotest-custody-media.flag`));
		if (custodyFlag.ok || custodyFlag.status === 0) custodyMedia = true;
	} catch {
		// No flag — later phases decide.
	}
	if (custodyMedia) {
		log("phase: custody-media");
		container.innerHTML = "";
		createRoot(container).render(
			<EditorShell
				bootstrap={async () => {
					await runCustodyMedia({ editor, root });
				}}
			/>,
		);
		return;
	}

	let exportHonesty = window.location.hash.includes("export-honesty");
	try {
		const honestyFlag = await fetch(bridge.toPlaybackUri(`file://${root}/autotest-export-honesty.flag`));
		if (honestyFlag.ok || honestyFlag.status === 0) exportHonesty = true;
	} catch {
		// No flag — the playback phases run.
	}
	if (exportHonesty) {
		log("phase: export-honesty");
		container.innerHTML = "";
		createRoot(container).render(
			<EditorShell
				bootstrap={async () => {
					await runExportHonesty({ editor, root });
				}}
			/>,
		);
		return;
	}

	// Opt-in device-profile mode: a runner-planted `<root>/autotest-fallback.flag`
	// deletes WebCodecs AudioDecoder so the WebAudio remux fallback (the path
	// older-WebKit iPhones take) is what gets exercised and asserted. This
	// caught two real bugs on 2026-08-19: decodeAudioData rejecting movie
	// containers, and readPlayableBytes throwing on Capacitor's status-0
	// media responses.
	try {
		const flag = await fetch(
			bridge.toPlaybackUri(`file://${root}/autotest-fallback.flag`),
		);
		if (flag.ok || flag.status === 0) {
			delete (globalThis as { AudioDecoder?: unknown }).AudioDecoder;
			log("device-profile mode: AudioDecoder removed — fallback path under test");
		}
	} catch {
		// No flag — native WebCodecs path runs (the simulator default).
	}

	await editor.project.loadAllProjects();
	const phase: "import" | "reopen" = editor.project
		.getSavedProjects()
		.some((p) => p.name === PROJECT_NAME)
		? "reopen"
		: "import";
	log("phase:", phase);

	const bootstrap = async () => {
		try {
			await runPhase({ editor, phase, root });
		} catch (err) {
			log(
				`VERDICT phase=${phase} FAIL bootstrap: ${err instanceof Error ? err.message : String(err)}`,
			);
			throw err;
		}
	};

	container.innerHTML = "";
	createRoot(container).render(<EditorShell bootstrap={bootstrap} />);

	driveAndSample({ editor, phase }).catch((err) => {
		log(
			`VERDICT phase=${phase} FAIL drive: ${err instanceof Error ? err.message : String(err)}`,
		);
	});
}
