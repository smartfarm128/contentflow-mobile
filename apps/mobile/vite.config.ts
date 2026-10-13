import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import wasm from "vite-plugin-wasm";

const editorCoreSrc = fileURLToPath(
	new URL("../../packages/editor-core/src", import.meta.url),
);

/**
 * `public/` is copied verbatim into every build, so without this a release
 * `www/` would still carry `spike-assets/` (~15 MB of M1 spike test video that
 * only spike.html and the dev-server demo project read). Vite has no per-mode
 * publicDir filter; deleting the copied directory once the bundle is written
 * is the smallest equivalent. Registered for production builds only — dev
 * serves `public/` directly and `--mode debug` keeps it for spike.html.
 */
function dropSpikeAssetsFromRelease(): Plugin {
	let outDir = "";
	return {
		name: "kneecap:drop-spike-assets-from-release",
		apply: "build",
		configResolved(config) {
			outDir = resolve(config.root, config.build.outDir);
		},
		closeBundle() {
			rmSync(resolve(outDir, "spike-assets"), { recursive: true, force: true });
		},
	};
}

/**
 * kneecap M3 (+ M1 spike, see apps/mobile/src/spike/) — builds
 * apps/mobile/src into apps/mobile/www, the static bundle Capacitor packages
 * into both native apps (plan M3 item 2: bundled locally, never loaded from
 * a dev server or a remote URL at runtime).
 *
 * Two pages: `index.html` (the product) and `spike.html` (the M1 spike's
 * hidden diagnostics screen). `spike.html` is built only in non-production
 * modes (`bun run dev`, `bun run build:debug` = `--mode debug`); a release
 * `bun run build` emits index.html alone (and drops the `spike-assets/` test
 * video, see dropSpikeAssetsFromRelease above), so neither the spike page nor
 * its fixtures ship in a store binary. In debug builds it is reachable only via the deep link
 * documented in docs/SPIKE-GUIDE.md (itself debug-only on both platforms),
 * never linked from index.html.
 *
 * `wasm()`: `opencut-wasm` is wasm-bindgen's `--target bundler` output
 * (`import * as wasm from "./opencut_wasm_bg.wasm"` inside its own glue —
 * see that package's opencut_wasm.js), which is the "ESM WebAssembly
 * integration" proposal Vite does not implement natively. `vite-plugin-wasm`
 * is the standard bridge for exactly this wasm-bindgen output shape.
 * `build.target: "esnext"` (below) is what lets the transformed module keep
 * its native top-level `await` instead of Vite trying to downlevel-compile
 * it away — deliberately NOT using the companion `vite-plugin-top-level-await`
 * transform plugin: it crashed at the rendering-chunks stage against this
 * repo's resolved `@swc/core@1.16.0` ("missing field `type`", an
 * AST-version mismatch inside that plugin's own SWC round-trip), and it is
 * unnecessary anyway — this app's platform floors (iOS 17 WKWebView, Android
 * minSdk 29 System WebView, both plan §2.5) are years past every engine's
 * native top-level-await support (Safari 15/2021, Chrome 89/2021), so
 * `esnext` alone is sufficient here.
 *
 * Verified necessary directly in this repo: no prior bundler config anywhere
 * (Next.js's webpack config included) ever solved this —
 * `packages/editor-core/src/services/renderer/compositor/wasm-compositor.ts`
 * has never actually been exercised through a real bundler before the M1
 * spike (see that file's and apps/mobile/src/legacy-harness.ts's own
 * comments).
 *
 * `esbuild.jsx`/`jsxImportSource` (structural-gap fixer pass — this app now
 * mounts `@kneecap/mobile-ui`'s real `EditorShell`, its first host outside
 * apps/web's Next.js dev route): this repo's own `src/**\/*.ts` files never
 * use JSX (see main.ts/legacy-harness.ts's plain-DOM style), but
 * `@kneecap/mobile-ui`'s `.tsx` source ships UNCOMPILED — its package.json
 * `exports` point straight at `./src/*.tsx` — and Vite bundles that source
 * directly, the same way it already bundles `@kneecap/editor-core`'s source
 * (see the `resolve.alias` comment above). Those files use TS's `"jsx":
 * "react-jsx"` automatic-runtime convention (no `import React` in scope —
 * see e.g. editor-shell.tsx), so this app's OWN bundler needs to agree, or
 * the emitted `jsx(...)` calls reference an import that was never added. No
 * `@vitejs/plugin-react` needed for that alone: this app has no Fast Refresh
 * requirement (it only ever runs through `vite build` into a packaged
 * Capacitor shell, never a live dev server a device points at — see the
 * `server.hostname` comment on `capacitor.config.ts`), and esbuild's own
 * `jsx`/`jsxImportSource` transform options, forwarded here, are sufficient
 * for a one-shot build.
 */
export default defineConfig(({ mode }) => ({
	root: __dirname,
	plugins: [
		wasm(),
		...(mode === "production" ? [dropSpikeAssetsFromRelease()] : []),
	],
	esbuild: {
		jsx: "automatic",
		jsxImportSource: "react",
	},
	resolve: {
		// Mirrors apps/web/tsconfig.json's "@/*" mapping: packages/editor-core's
		// OWN source uses this alias internally (its tsconfig.json maps "@/*"
		// to "./src/*" for a standalone `tsc --noEmit` self-containment proof —
		// see that package's index.ts header), so any host bundling
		// editor-core's source directly (as this app does, and as apps/web
		// does) must resolve the same alias.
		alias: {
			"@": editorCoreSrc,
		},
	},
	build: {
		outDir: "www",
		emptyOutDir: true,
		target: "esnext",
		minify: true,
		rollupOptions: {
			input: {
				main: "index.html",
				...(mode === "production" ? {} : { spike: "spike.html" }),
			},
			output: {
				manualChunks(id) {
					const path = id.replaceAll("\\", "/");
					if (path.includes("/node_modules/three/")) return "vendor-three";
					if (path.includes("/node_modules/d3/") || path.includes("/node_modules/d3-")) return "vendor-d3";
					if (path.includes("/node_modules/remotion/") || path.includes("/node_modules/@remotion/")) {
						return "vendor-remotion";
					}
					if (path.includes("/motion-templates/catalog/openchatcut-templates.compiled")) {
						return "openchatcut-catalog";
					}
					if (
						path.includes("/motion-templates/registry") ||
						path.includes("/motion-templates/templates/") ||
						path.includes("/motion-templates/catalog-loader") ||
						path.includes("/motion-templates/template-host")
					) {
						return "template-registry";
					}
					return undefined;
				},
			},
		},
	},
	worker: {
		format: "es",
		plugins: () => [wasm()],
	},
	optimizeDeps: {
		// wasm-bindgen bundler-target output must not be pre-bundled by esbuild
		// (it doesn't understand the `.wasm` ESM import either) — same
		// exclusion vite-plugin-wasm's own docs recommend.
		exclude: ["opencut-wasm"],
	},
	server: {
		// `bun run dev` here is a plain browser preview of the harness only —
		// never something a packaged app points at (plan M3 item 2).
		port: 5183,
	},
}));
