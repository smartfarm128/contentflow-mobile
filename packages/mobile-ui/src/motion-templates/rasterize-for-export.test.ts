import { describe, expect, test } from "bun:test";
import { htmlOverlayStepSeconds } from "./rasterize-for-export";

describe("htmlOverlayStepSeconds", () => {
	test("a short timeline stays at or under 8 fps and 24 frames", () => {
		const step = htmlOverlayStepSeconds({ durationSeconds: 6 });
		expect(step).toBeGreaterThanOrEqual(1 / 8);
		expect(Math.ceil(6 / step)).toBeLessThanOrEqual(24);
	});

	test("a long timeline does not exceed 24 samples", () => {
		const step = htmlOverlayStepSeconds({ durationSeconds: 60 });
		expect(Math.ceil(60 / step)).toBeLessThanOrEqual(24);
	});
});
