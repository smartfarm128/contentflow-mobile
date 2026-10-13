import { describe, expect, test } from "bun:test";
import { registerDefaultEffects } from "@/effects";
import { effectsRegistry } from "@/effects/registry";
import {
	adjustShaderGrade,
	applyShaderGradeColorUnclamped,
	boxMaskContains,
	filterShaderGrade,
	renderPreviewGradeFrame,
	sampledBlurSigma,
	shaderGradeMatrix,
} from "@/effects/grade";

function applyMatrix({
	r,
	g,
	b,
	matrix,
}: {
	r: number;
	g: number;
	b: number;
	matrix: number[];
}): { r: number; g: number; b: number } {
	return {
		r: (matrix[0] ?? 0) * r + (matrix[4] ?? 0) * g + (matrix[8] ?? 0) * b + (matrix[12] ?? 0),
		g: (matrix[1] ?? 0) * r + (matrix[5] ?? 0) * g + (matrix[9] ?? 0) * b + (matrix[13] ?? 0),
		b: (matrix[2] ?? 0) * r + (matrix[6] ?? 0) * g + (matrix[10] ?? 0) * b + (matrix[14] ?? 0),
	};
}

describe("shader grade", () => {
	test("the color matrix matches the WGSL color section before clamp", () => {
		const grade = adjustShaderGrade({
			params: { brightness: 20, contrast: -30, saturation: 40, temperature: 25, tint: -10 },
		});
		if (!grade) throw new Error("expected a grade");
		const matrix = shaderGradeMatrix(grade);
		const samples = [
			[0.1, 0.2, 0.3],
			[1, 0, 0],
			[0.5, 0.5, 0.5],
			[0.9, 0.1, 0.8],
		];
		for (const [r, g, b] of samples) {
			const fromShader = applyShaderGradeColorUnclamped({ r: r ?? 0, g: g ?? 0, b: b ?? 0, grade });
			const fromMatrix = applyMatrix({ r: r ?? 0, g: g ?? 0, b: b ?? 0, matrix });
			expect(Math.abs(fromShader.r - fromMatrix.r)).toBeLessThan(1e-5);
			expect(Math.abs(fromShader.g - fromMatrix.g)).toBeLessThan(1e-5);
			expect(Math.abs(fromShader.b - fromMatrix.b)).toBeLessThan(1e-5);
		}
	});

	test("mono at full intensity drops chroma", () => {
		const grade = filterShaderGrade({ params: { preset: "mono", intensity: 100 } });
		if (!grade) throw new Error("expected mono");
		expect(grade.saturation).toBe(0);
		const gray = applyShaderGradeColorUnclamped({ r: 1, g: 0, b: 0, grade });
		expect(Math.abs(gray.r - gray.g)).toBeLessThan(1e-6);
		expect(Math.abs(gray.g - gray.b)).toBeLessThan(1e-6);
	});

	test("none and zero intensity emit no filter grade", () => {
		expect(filterShaderGrade({ params: { preset: "none", intensity: 100 } })).toBeNull();
		expect(filterShaderGrade({ params: { preset: "warm", intensity: 0 } })).toBeNull();
		expect(adjustShaderGrade({ params: {} })).toBeNull();
	});

	test("filter preset reaches the preview compositor as color-adjust", () => {
		registerDefaultEffects();
		const definition = effectsRegistry.get("filter");
		const passes = definition.renderer.buildPasses?.({
			effectParams: { preset: "warm", intensity: 100 },
			width: 100,
			height: 100,
		});
		expect(passes?.map((pass) => pass.shader)).toEqual(["color-adjust"]);
		expect(passes?.[0]?.uniforms.u_saturation).toBeGreaterThan(1);
	});

	test("ellipse mask keeps the center and clears a corner", () => {
		const mask = {
			type: "ellipse" as const,
			centerX: 0,
			centerY: 0,
			width: 0.5,
			height: 0.5,
			rotation: 0,
			inverted: false,
		};
		expect(boxMaskContains({ x: 32, y: 18, width: 64, height: 36, mask })).toBe(true);
		expect(boxMaskContains({ x: 1, y: 1, width: 64, height: 36, mask })).toBe(false);
		const pixels = new Uint8ClampedArray(64 * 36 * 4);
		pixels.fill(255);
		const rendered = renderPreviewGradeFrame({
			pixels,
			width: 64,
			height: 36,
			grades: [],
			blurSigma: 0,
			mask,
		});
		expect(rendered[(18 * 64 + 32) * 4]).toBe(255);
		expect(rendered[0]).toBe(0);
	});

	test("sampled blur sigma scales with the 1920 reference", () => {
		expect(sampledBlurSigma({ intensity: 80, sampleWidth: 640 })).toBeCloseTo((80 / 5) * (640 / 1920));
	});
});
