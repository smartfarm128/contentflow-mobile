import { intensityToSigma } from "./definitions/blur";

/**
 * Color grade shared by the preview's `color-adjust` WGSL pass
 * (`rust/crates/effects/src/shaders/color_adjust.wgsl`), the iOS Core Image
 * export, and the Android Media3 RGB matrix. Spatial terms (sharpen,
 * vignette, blur) are not part of the matrix. Keep the preset table and the
 * matrix multiply in sync with `TransitionCompositor.swift` and
 * `ColorGradeMatrix.kt`.
 */
export interface ShaderGrade {
	/** Added to RGB, already in shader units (adjust slider maps by 0.35). */
	brightness: number;
	/** Multiplier around mid-gray. 1 is identity. */
	contrast: number;
	/** 0 is mono, 1 is identity. */
	saturation: number;
	/** -1..1. Positive warms (more red, less blue). */
	temperature: number;
	/** -1..1. Positive pushes magenta. */
	tint: number;
	/** 0..1 unsharp amount. 0 for filter presets. */
	sharpen: number;
	/** 0..1 corner darkening. 0 for filter presets. */
	vignette: number;
}

const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;

interface PresetTarget {
	brightness: number;
	contrast: number;
	saturation: number;
	temperature: number;
	tint: number;
}

/** Full-intensity look, in shader units. Intensity lerps back to identity. */
const FILTER_PRESET_TARGETS: Record<string, PresetTarget> = {
	vivid: { brightness: 0.03, contrast: 1.15, saturation: 1.35, temperature: 0.08, tint: 0 },
	mono: { brightness: 0, contrast: 1.08, saturation: 0, temperature: 0, tint: 0 },
	vintage: { brightness: 0.04, contrast: 0.92, saturation: 0.62, temperature: 0.55, tint: 0.12 },
	cool: { brightness: 0, contrast: 1.06, saturation: 0.92, temperature: -0.72, tint: 0.08 },
	warm: { brightness: 0.03, contrast: 1.05, saturation: 1.08, temperature: 0.62, tint: -0.06 },
	cinematic: { brightness: -0.03, contrast: 1.2, saturation: 0.78, temperature: -0.22, tint: 0.1 },
};

function numberParam({
	params,
	key,
	fallback,
}: {
	params: Record<string, unknown>;
	key: string;
	fallback: number;
}): number {
	const raw = params[key];
	const value = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
	return Number.isFinite(value) ? value : fallback;
}

export function isNeutralShaderGrade(grade: ShaderGrade): boolean {
	return (
		grade.brightness === 0 &&
		grade.contrast === 1 &&
		grade.saturation === 1 &&
		grade.temperature === 0 &&
		grade.tint === 0 &&
		grade.sharpen === 0 &&
		grade.vignette === 0
	);
}

/** Adjust-panel sliders → the `color-adjust` uniforms. Neutral returns null. */
export function adjustShaderGrade({
	params,
}: {
	params: Record<string, unknown>;
}): ShaderGrade | null {
	const brightness = numberParam({ params, key: "brightness", fallback: 0 });
	const contrast = numberParam({ params, key: "contrast", fallback: 0 });
	const saturation = numberParam({ params, key: "saturation", fallback: 0 });
	const temperature = numberParam({ params, key: "temperature", fallback: 0 });
	const tint = numberParam({ params, key: "tint", fallback: 0 });
	const sharpen = numberParam({ params, key: "sharpen", fallback: 0 });
	const vignette = numberParam({ params, key: "vignette", fallback: 0 });
	const grade: ShaderGrade = {
		brightness: (brightness / 100) * 0.35,
		contrast: 1 + (contrast / 100) * 0.6,
		saturation: Math.max(0, 1 + saturation / 100),
		temperature: temperature / 100,
		tint: tint / 100,
		sharpen: sharpen / 100,
		vignette: vignette / 100,
	};
	return isNeutralShaderGrade(grade) ? null : grade;
}

/**
 * Filter preset → one `color-adjust` pass. `none`, an unknown preset, and
 * intensity 0 contribute nothing, matching an unfiltered frame.
 */
export function filterShaderGrade({
	params,
}: {
	params: Record<string, unknown>;
}): ShaderGrade | null {
	const preset = typeof params.preset === "string" ? params.preset : "none";
	const target = FILTER_PRESET_TARGETS[preset];
	if (!target) return null;
	const intensity = Math.max(0, Math.min(100, numberParam({ params, key: "intensity", fallback: 100 })));
	const mix = intensity / 100;
	if (mix === 0) return null;
	const grade: ShaderGrade = {
		brightness: target.brightness * mix,
		contrast: 1 + (target.contrast - 1) * mix,
		saturation: 1 + (target.saturation - 1) * mix,
		temperature: target.temperature * mix,
		tint: target.tint * mix,
		sharpen: 0,
		vignette: 0,
	};
	return isNeutralShaderGrade(grade) ? null : grade;
}

export function shaderGradeUniforms(grade: ShaderGrade): Record<string, number> {
	return {
		u_brightness: grade.brightness,
		u_contrast: grade.contrast,
		u_saturation: grade.saturation,
		u_temperature: grade.temperature,
		u_tint: grade.tint,
		u_sharpen: grade.sharpen,
		u_vignette: grade.vignette,
	};
}

function matMul({ a, b }: { a: number[]; b: number[] }): number[] {
	const out = new Array<number>(16).fill(0);
	for (let col = 0; col < 4; col++) {
		for (let row = 0; row < 4; row++) {
			let sum = 0;
			for (let k = 0; k < 4; k++) {
				sum += (a[k * 4 + row] ?? 0) * (b[col * 4 + k] ?? 0);
			}
			out[col * 4 + row] = sum;
		}
	}
	return out;
}

/**
 * Column-major 4×4. `out = M * vec4(rgb, 1)` matches the WGSL color section
 * (temperature, brightness, contrast, saturation) before the final clamp.
 * Sharpen and vignette are spatial and are not in this matrix.
 */
export function shaderGradeMatrix(grade: ShaderGrade): number[] {
	const temperature = [
		1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
		grade.temperature * 0.12 + grade.tint * 0.05,
		-grade.tint * 0.1,
		-grade.temperature * 0.12 + grade.tint * 0.05,
		1,
	];
	const brightness = [
		1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
		grade.brightness, grade.brightness, grade.brightness, 1,
	];
	const bias = 0.5 - 0.5 * grade.contrast;
	const contrast = [
		grade.contrast, 0, 0, 0,
		0, grade.contrast, 0, 0,
		0, 0, grade.contrast, 0,
		bias, bias, bias, 1,
	];
	const inv = 1 - grade.saturation;
	const sat = grade.saturation;
	const saturation = [
		sat + inv * LUMA_R, inv * LUMA_R, inv * LUMA_R, 0,
		inv * LUMA_G, sat + inv * LUMA_G, inv * LUMA_G, 0,
		inv * LUMA_B, inv * LUMA_B, sat + inv * LUMA_B, 0,
		0, 0, 0, 1,
	];
	return matMul({
		a: saturation,
		b: matMul({ a: contrast, b: matMul({ a: brightness, b: temperature }) }),
	});
}

export function applyShaderGradeColor({
	r,
	g,
	b,
	grade,
}: {
	r: number;
	g: number;
	b: number;
	grade: ShaderGrade;
}): { r: number; g: number; b: number } {
	const matrix = shaderGradeMatrix(grade);
	const rr = (matrix[0] ?? 0) * r + (matrix[4] ?? 0) * g + (matrix[8] ?? 0) * b + (matrix[12] ?? 0);
	const gg = (matrix[1] ?? 0) * r + (matrix[5] ?? 0) * g + (matrix[9] ?? 0) * b + (matrix[13] ?? 0);
	const bb = (matrix[2] ?? 0) * r + (matrix[6] ?? 0) * g + (matrix[10] ?? 0) * b + (matrix[14] ?? 0);
	return {
		r: Math.min(1, Math.max(0, rr)),
		g: Math.min(1, Math.max(0, gg)),
		b: Math.min(1, Math.max(0, bb)),
	};
}

/** Unclamped WGSL color section, used to prove the matrix matches the shader. */
export function applyShaderGradeColorUnclamped({
	r,
	g,
	b,
	grade,
}: {
	r: number;
	g: number;
	b: number;
	grade: ShaderGrade;
}): { r: number; g: number; b: number } {
	let rr = r + grade.temperature * 0.12 + grade.tint * 0.05;
	let gg = g - grade.tint * 0.1;
	let bb = b - grade.temperature * 0.12 + grade.tint * 0.05;
	rr += grade.brightness;
	gg += grade.brightness;
	bb += grade.brightness;
	rr = (rr - 0.5) * grade.contrast + 0.5;
	gg = (gg - 0.5) * grade.contrast + 0.5;
	bb = (bb - 0.5) * grade.contrast + 0.5;
	const luma = rr * LUMA_R + gg * LUMA_G + bb * LUMA_B;
	const sat = grade.saturation;
	return {
		r: luma * (1 - sat) + rr * sat,
		g: luma * (1 - sat) + gg * sat,
		b: luma * (1 - sat) + bb * sat,
	};
}

export type RenderedMaskType = "ellipse" | "rectangle" | "diamond";

export interface BoxMaskSample {
	type: RenderedMaskType;
	centerX: number;
	centerY: number;
	width: number;
	height: number;
	rotation: number;
	inverted: boolean;
}

export function boxMaskContains({
	x,
	y,
	width,
	height,
	mask,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	mask: BoxMaskSample;
}): boolean {
	const centerX = width / 2 + mask.centerX * width;
	const centerY = height / 2 + mask.centerY * height;
	const maskWidth = Math.max(mask.width, 0.01) * width;
	const maskHeight = Math.max(mask.height, 0.01) * height;
	const rotationRad = (mask.rotation * Math.PI) / 180;
	const dx = x + 0.5 - centerX;
	const dy = y + 0.5 - centerY;
	const cos = Math.cos(-rotationRad);
	const sin = Math.sin(-rotationRad);
	const lx = dx * cos - dy * sin;
	const ly = dx * sin + dy * cos;
	const halfW = Math.max(maskWidth / 2, 0.5);
	const halfH = Math.max(maskHeight / 2, 0.5);
	let inside = false;
	if (mask.type === "ellipse") {
		const nx = lx / halfW;
		const ny = ly / halfH;
		inside = nx * nx + ny * ny <= 1;
	} else if (mask.type === "rectangle") {
		inside = Math.abs(lx) <= halfW && Math.abs(ly) <= halfH;
	} else {
		inside = Math.abs(lx) / halfW + Math.abs(ly) / halfH <= 1;
	}
	return mask.inverted ? !inside : inside;
}

function sampleClamped({
	pixels,
	width,
	height,
	x,
	y,
}: {
	pixels: Uint8ClampedArray;
	width: number;
	height: number;
	x: number;
	y: number;
}): { r: number; g: number; b: number; a: number } {
	const sx = Math.min(width - 1, Math.max(0, x));
	const sy = Math.min(height - 1, Math.max(0, y));
	const index = (sy * width + sx) * 4;
	return {
		r: pixels[index] ?? 0,
		g: pixels[index + 1] ?? 0,
		b: pixels[index + 2] ?? 0,
		a: pixels[index + 3] ?? 0,
	};
}

function gaussianBlurAxis({
	pixels,
	width,
	height,
	sigma,
	horizontal,
}: {
	pixels: Uint8ClampedArray;
	width: number;
	height: number;
	sigma: number;
	horizontal: boolean;
}): Uint8ClampedArray {
	if (sigma < 0.05) return pixels;
	const radius = Math.min(30, Math.max(1, Math.ceil(sigma * 3)));
	const weights: number[] = [];
	let total = 0;
	for (let index = -radius; index <= radius; index++) {
		const weight = Math.exp(-(index * index) / (2 * sigma * sigma));
		weights.push(weight);
		total += weight;
	}
	const out = new Uint8ClampedArray(pixels.length);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			for (let index = -radius; index <= radius; index++) {
				const weight = (weights[index + radius] ?? 0) / total;
				const sample = sampleClamped({
					pixels,
					width,
					height,
					x: horizontal ? x + index : x,
					y: horizontal ? y : y + index,
				});
				r += sample.r * weight;
				g += sample.g * weight;
				b += sample.b * weight;
				a += sample.a * weight;
			}
			const offset = (y * width + x) * 4;
			out[offset] = r;
			out[offset + 1] = g;
			out[offset + 2] = b;
			out[offset + 3] = a;
		}
	}
	return out;
}

/**
 * Preview/WGSL rendering of one frame: color grades in order (the
 * `color-adjust` pass), then the separable gaussian the blur effect emits,
 * then the first supported mask. Outside the mask the pixel is clear black,
 * which is what native export composites over the canvas.
 *
 * `blurSigma` is in THIS image's pixels. For a frame sampled down from the
 * export, that is `(intensity / 5) * (sampleWidth / 1920)`.
 */
export function renderPreviewGradeFrame({
	pixels,
	width,
	height,
	grades,
	blurSigma,
	mask,
}: {
	pixels: Uint8ClampedArray;
	width: number;
	height: number;
	grades: readonly ShaderGrade[];
	blurSigma: number;
	mask: BoxMaskSample | null;
}): Uint8ClampedArray {
	const graded = new Uint8ClampedArray(pixels.length);
	for (let index = 0; index < pixels.length; index += 4) {
		let r = (pixels[index] ?? 0) / 255;
		let g = (pixels[index + 1] ?? 0) / 255;
		let b = (pixels[index + 2] ?? 0) / 255;
		for (const grade of grades) {
			const next = applyShaderGradeColor({ r, g, b, grade });
			r = next.r;
			g = next.g;
			b = next.b;
		}
		graded[index] = Math.round(r * 255);
		graded[index + 1] = Math.round(g * 255);
		graded[index + 2] = Math.round(b * 255);
		graded[index + 3] = pixels[index + 3] ?? 255;
	}
	const blurred =
		blurSigma > 0.05
			? gaussianBlurAxis({
					pixels: gaussianBlurAxis({
						pixels: graded,
						width,
						height,
						sigma: blurSigma,
						horizontal: true,
					}),
					width,
					height,
					sigma: blurSigma,
					horizontal: false,
				})
			: graded;
	if (!mask) return blurred;
	const masked = new Uint8ClampedArray(blurred.length);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const offset = (y * width + x) * 4;
			if (!boxMaskContains({ x, y, width, height, mask })) continue;
			masked[offset] = blurred[offset] ?? 0;
			masked[offset + 1] = blurred[offset + 1] ?? 0;
			masked[offset + 2] = blurred[offset + 2] ?? 0;
			masked[offset + 3] = blurred[offset + 3] ?? 255;
		}
	}
	return masked;
}

/** Sigma of the blur effect in the pixel grid of a sampled export frame. */
export function sampledBlurSigma({
	intensity,
	sampleWidth,
}: {
	intensity: number;
	sampleWidth: number;
}): number {
	return intensityToSigma({ intensity, resolution: sampleWidth, reference: 1920 });
}
