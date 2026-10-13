import { describe, expect, test } from "bun:test";
import { HTML_OVERLAY_TARGET_FPS, htmlOverlayStepSeconds } from "./rasterize-for-export";

describe("htmlOverlayStepSeconds", () => {
	test("a 6s timeline holds 15 fps", () => {
		const step = htmlOverlayStepSeconds({ durationSeconds: 6, width: 1280, height: 720 });
		expect(step).toBeCloseTo(1 / HTML_OVERLAY_TARGET_FPS, 5);
		expect(Math.round(6 / step)).toBe(90);
	});

	test("a 30s timeline keeps animating at 15 fps", () => {
		const step = htmlOverlayStepSeconds({ durationSeconds: 30, width: 1920, height: 1080 });
		expect(step).toBeCloseTo(1 / HTML_OVERLAY_TARGET_FPS, 5);
		expect(Math.round(30 / step)).toBe(450);
	});

	test("a 60s timeline keeps animating at 15 fps", () => {
		const step = htmlOverlayStepSeconds({ durationSeconds: 60, width: 1920, height: 1080 });
		expect(step).toBeCloseTo(1 / HTML_OVERLAY_TARGET_FPS, 5);
		expect(Math.round(60 / step)).toBe(900);
	});
});
