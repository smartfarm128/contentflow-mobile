import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The mobile app's Content-Security-Policy (apps/mobile/index.html) is the
 * only thing between this package's outbound requests and the network on a
 * device — and the Vite dev harness serves no CSP at all, so a missing host
 * passes every browser check and then fails every time in the WebView
 * (Pexels video downloads and thumbnails did exactly that). Every host this
 * package reaches must be allowed by the directive the browser actually
 * checks: `connect-src` for fetch(), `img-src` for <img>. An explicit
 * directive never falls back to `default-src`.
 */

const INDEX_HTML = join(import.meta.dir, "../../../../apps/mobile/index.html");

function readCsp(): Map<string, string[]> {
	const html = readFileSync(INDEX_HTML, "utf8");
	const match = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html);
	if (!match?.[1]) throw new Error(`No CSP meta tag in ${INDEX_HTML}`);
	const directives = new Map<string, string[]>();
	for (const part of match[1].split(";")) {
		const [name, ...sources] = part.trim().split(/\s+/);
		if (name) directives.set(name, sources);
	}
	return directives;
}

const REQUIRED: Array<{ directive: string; origin: string; usedBy: string }> = [
	{ directive: "connect-src", origin: "https://api.anthropic.com", usedBy: "ai-agent.ts" },
	{ directive: "connect-src", origin: "https://api.elevenlabs.io", usedBy: "elevenlabs-voice.ts" },
	{ directive: "connect-src", origin: "https://api.pexels.com", usedBy: "stock search" },
	{ directive: "connect-src", origin: "https://images.pexels.com", usedBy: "stock photo download" },
	{ directive: "connect-src", origin: "https://videos.pexels.com", usedBy: "stock video download" },
	{ directive: "img-src", origin: "https://images.pexels.com", usedBy: "stock result thumbnails" },
	// Downloaded stock media and ElevenLabs voiceovers become object URLs.
	{ directive: "img-src", origin: "blob:", usedBy: "stock photos on the timeline" },
	{ directive: "connect-src", origin: "blob:", usedBy: "object-URL media reads" },
];

describe("apps/mobile CSP", () => {
	const csp = readCsp();

	for (const { directive, origin, usedBy } of REQUIRED) {
		test(`${directive} allows ${origin} (${usedBy})`, () => {
			expect(csp.get(directive) ?? []).toContain(origin);
		});
	}

	test("never allows string evaluation", () => {
		expect(csp.get("script-src") ?? []).not.toContain("'unsafe-eval'");
	});
});
