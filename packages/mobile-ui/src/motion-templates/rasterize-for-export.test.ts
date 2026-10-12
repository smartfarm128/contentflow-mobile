import { describe, expect, test } from "bun:test";
import {
	HTML_OVERLAY_PAYLOAD_CHARS,
	HTML_OVERLAY_TARGET_FPS,
	htmlOverlayStepSeconds,
} from "./rasterize-for-export";

describe("htmlOverlayStepSeconds", () => {
	test("a 6s 720p timeline holds 15 fps", () => {
		const step = htmlOverlayStepSeconds({ durationSeconds: 6, width: 1280, height: 720 });
		expect(step).toBeCloseTo(1 / HTML_OVERLAY_TARGET_FPS, 5);
		expect(Math.ceil(6 / step)).toBeGreaterThan(24);
	});

	test("a 6s 1080p timeline stays at 15 fps inside the payload estimate", () => {
		const width = 1920;
		const height = 1080;
		const step = htmlOverlayStepSeconds({ durationSeconds: 6, width, height });
		const frames = Math.ceil(6 / step);
		expect(step).toBeCloseTo(1 / HTML_OVERLAY_TARGET_FPS, 5);
		expect(frames * width * height * 0.2).toBeLessThanOrEqual(HTML_OVERLAY_PAYLOAD_CHARS);
	});

	test("a 60s 1080p timeline scales past 24 frames and stays inside the payload estimate", () => {
		const width = 1920;
		const height = 1080;
		const step = htmlOverlayStepSeconds({ durationSeconds: 60, width, height });
		const frames = Math.ceil(60 / step);
		expect(frames).toBeGreaterThan(24);
		expect(step).toBeGreaterThanOrEqual(1 / HTML_OVERLAY_TARGET_FPS - 1e-9);
		expect(frames * width * height * 0.2).toBeLessThanOrEqual(HTML_OVERLAY_PAYLOAD_CHARS);
	});
});
