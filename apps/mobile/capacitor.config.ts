import type { CapacitorConfig } from "@capacitor/cli";

/**
 * kneecap M3 — Capacitor 8 shell config.
 *
 * appId/appName are the "original name" plan §8.2 requires (never CapCut-
 * adjacent). `webDir: "www"` is the LOCALLY BUNDLED static build the app
 * ships — plan M3 item 2: "No remote loading of the editor bundle: Apple
 * 2.5.2 forbids downloading code that changes app functionality." `www/` is
 * produced by `bun run build` (Vite) from `src/`; nothing in this config
 * points at a dev server or a remote URL.
 *
 * Do not set `server.hostname`. Capacitor applies that one field to every
 * platform. Setting it to the Android asset host made iOS `convertFileSrc`
 * emit `capacitor://appassets.androidplatform.net/_capacitor_file_/...`,
 * and WKWebView fetch of a Director export at that URL threw
 * `TypeError: Load failed` (director-export, 2026-10-13). iOS stays on
 * Capacitor's default `capacitor://localhost`. Android stays on
 * `https://localhost` via `androidScheme`, which is a secure context and
 * not `file://` (plan M3 item 3).
 *
 * iOS needs no hostname override: Capacitor's WKWebView integration
 * already satisfies Apple 2.5.6 (WKWebView, not the deprecated UIWebView)
 * and already avoids file:// by construction.
 */
const config: CapacitorConfig = {
	appId: "com.contentflow.app",
	appName: "ContentFlow",
	webDir: "www",
	android: {
		allowMixedContent: false,
	},
	ios: {
		// The app is a fixed full-screen shell: every scrollable region is its
		// own overflow container. Leaving WKWebView's outer scroll view on let
		// the whole page pan/bounce on both axes, so fixed sheets swayed under
		// a scrolling finger (founder, 2026-09-30).
		scrollEnabled: false,
	},
	server: {
		androidScheme: "https",
		// No `url` field: that is exactly the "remote loading" plan M3 item 2
		// forbids. If this ever gets set to a remote URL, the app would be
		// loading code over the network — an offline-first-directive violation,
		// not just an App Review risk.
	},
};

export default config;
