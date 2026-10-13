/**
 * kneecap mobile entry — a deliberately thin hash router:
 *
 *   (default)        -> ./app/app-root.tsx  — the real product: project
 *                       list + the CapCut-parity editor (`EditorShell`).
 *   #/diagnostics    -> ./legacy-harness.ts — the M3/M4 NativeBridge shell
 *                       harness, kept reachable for QA (see its header).
 *
 *   #/autotest       -> ./autotest.tsx      — headless end-to-end QA.
 *   #/autotest/export-honesty (or `<mediaRoot>/autotest-export-honesty.flag`
 *                    next to autotest.flag) -> the export-honesty phase.
 *   #/autotest/custody-media (or `<mediaRoot>/autotest-custody-media.flag`)
 *                    -> stock + voiceover files imported into native custody.
 *   #/autotest/overlay-pixels (or `<mediaRoot>/autotest-overlay-pixels.flag`)
 *                    -> CSS template, WebGL template and sticker pixels in
 *                    the exported file.
 *   #/autotest/nvidia-director (or `<mediaRoot>/autotest-nvidia-director.flag`,
 *                    plus a one-line `<mediaRoot>/NVIDIA_API_KEY`)
 *                    -> one AI Director turn through NVIDIA.
 *   #/autotest/director-export (or `<mediaRoot>/autotest-director-export.flag`,
 *                    plus the same NVIDIA_API_KEY file)
 *                    -> one Director turn that trims and exports.
 *
 * Both are dynamic imports so the diagnostics path stays out of the
 * editor's startup graph and vice versa. A hash flip between modes does a
 * full reload rather than trying to unmount one world and boot the other —
 * this is a hidden debug switch, not user-facing navigation.
 *
 * The two debug routes exist only when `DEBUG_ROUTES` is on (the Vite dev
 * server, or `bun run build:debug`). A release bundle (`bun run build`)
 * ignores both hashes and the autotest flag file, so neither a deep link nor
 * a planted file can open an internal test surface in a shipped app.
 */
const DIAGNOSTICS_HASH = "#/diagnostics";
const AUTOTEST_HASH = "#/autotest";

/** `MODE` is "development" under the dev server, "debug" for
 *  `vite build --mode debug`, and "production" for a plain `vite build`.
 *  Statically replaced by Vite, so a release build drops both debug routes
 *  (and their dynamic-import chunks) from the bundle entirely. */
const DEBUG_ROUTES = import.meta.env.MODE !== "production";

function wantsDiagnostics(): boolean {
	return DEBUG_ROUTES && window.location.hash.startsWith(DIAGNOSTICS_HASH);
}

/**
 * Headless trigger for the `#/autotest` route: a Capacitor app launch has
 * no way to carry a URL hash (`simctl launch` starts the app; the WebView
 * always loads bare index.html), so an automated runner instead plants
 * `<mediaRoot>/autotest.flag` in the app container and relaunches. The
 * check is a single local scheme-handler fetch (missing file -> the task
 * fails -> fetch throws -> false), a few ms on device and skipped
 * entirely on the web dev server.
 */
async function autotestFlagPresent(): Promise<boolean> {
	try {
		const { Capacitor } = await import("@capacitor/core");
		if (!Capacitor.isNativePlatform()) return false;
		const { getNativeBridge } = await import("@kneecap/native-bridge");
		const bridge = await getNativeBridge();
		const root = await bridge.getMediaRoot();
		if (!root) return false;
		const res = await fetch(bridge.toPlaybackUri(`file://${root}/autotest.flag`));
		return res.ok || res.status === 0;
	} catch {
		return false;
	}
}

async function boot() {
	if (wantsDiagnostics()) {
		const { mountLegacyHarness } = await import("./legacy-harness");
		await mountLegacyHarness();
	} else if (
		DEBUG_ROUTES &&
		(window.location.hash.startsWith(AUTOTEST_HASH) || (await autotestFlagPresent()))
	) {
		// End-to-end playback QA (import → persist → reopen → frames) — see
		// autotest.tsx. Hidden debug route, same policy as #/diagnostics.
		const { mountAutotest } = await import("./autotest");
		await mountAutotest();
	} else {
		const { mountApp } = await import("./app/app-root");
		mountApp();
	}
	appMounted = true;
}

let appMounted = false;

/** A boot failure must never strand the user on index.html's static
 *  "Loading…" placeholder (exactly what a silent dynamic-import rejection
 *  did on the first real-device run) — surface the error on screen, where
 *  it is also screenshot-debuggable without a Web Inspector attach. */
function showBootError(err: unknown) {
	const detail =
		err instanceof Error ? `${err.name}: ${err.message}\n\n${err.stack ?? ""}` : String(err);
	const container = document.getElementById("app") ?? document.body;
	const pre = document.createElement("pre");
	pre.style.cssText =
		"padding:16px;white-space:pre-wrap;word-break:break-word;color:#ff5c5c;font:12px/1.5 ui-monospace,monospace;";
	pre.textContent = `ContentFlow failed to start\n\n${detail}`;
	container.replaceChildren(pre);
}

window.addEventListener("unhandledrejection", (event) => {
	// Pre-mount, a rejection means boot itself died — take over the screen.
	// POST-mount it's a runtime error inside a running app; replacing the
	// entire UI with a death screen for those was a real bug (a failed
	// pickMedia call on the founder's iPhone nuked the whole editor,
	// 2026-08-18). Running-app errors log instead; user-facing feedback is
	// each feature's own responsibility.
	if (appMounted) {
		console.error("ContentFlow unhandled rejection:", event.reason);
		return;
	}
	showBootError(event.reason);
});

window.addEventListener("hashchange", () => {
	const inDiagnostics = wantsDiagnostics();
	const bootedDiagnostics = document.body.dataset.kneecapMode === "diagnostics";
	if (inDiagnostics !== bootedDiagnostics) window.location.reload();
});

document.body.dataset.kneecapMode = wantsDiagnostics() ? "diagnostics" : "app";

boot().catch(showBootError);
