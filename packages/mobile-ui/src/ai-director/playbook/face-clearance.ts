/**
 * Keep a text band off detected face boxes.
 *
 * Boxes are normalised, origin top-left, each edge in 0..1. The three
 * bands match the caption positions in `captions/layout.ts` (top -0.36,
 * centre 0, bottom 0.36 of the canvas height, measured from the centre).
 */

export type TextBand = "top" | "center" | "bottom";

export interface NormRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const TEXT_BANDS: Record<TextBand, NormRect> = {
	top: { x: 0.08, y: 0.06, width: 0.84, height: 0.18 },
	center: { x: 0.08, y: 0.4, width: 0.84, height: 0.2 },
	bottom: { x: 0.08, y: 0.74, width: 0.84, height: 0.18 },
};

const FALLBACK: Record<TextBand, TextBand[]> = {
	bottom: ["top", "center"],
	top: ["bottom", "center"],
	center: ["top", "bottom"],
};

export function rectsOverlap({ a, b }: { a: NormRect; b: NormRect }): boolean {
	return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function overlapArea({ a, b }: { a: NormRect; b: NormRect }): number {
	const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
	const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
	return width * height;
}

function bandHitsFace({ band, faces }: { band: TextBand; faces: NormRect[] }): boolean {
	const box = TEXT_BANDS[band];
	return faces.some((face) => rectsOverlap({ a: box, b: face }));
}

export function placeClearOfFaces({
	preferred,
	faces,
}: {
	preferred: TextBand;
	faces: NormRect[];
}): { band: TextBand; moved: boolean; warning: string | null } {
	const order = [preferred, ...FALLBACK[preferred]];
	const clear = order.find((band) => !bandHitsFace({ band, faces }));
	if (clear) {
		return { band: clear, moved: clear !== preferred, warning: null };
	}
	let least = preferred;
	let leastArea = Number.POSITIVE_INFINITY;
	for (const band of order) {
		const area = faces.reduce((sum, face) => sum + overlapArea({ a: TEXT_BANDS[band], b: face }), 0);
		if (area < leastArea) {
			least = band;
			leastArea = area;
		}
	}
	return {
		band: least,
		moved: least !== preferred,
		warning:
			"Could not keep the text fully off a face. The face fills the frame. I did not claim it is clear.",
	};
}

/** Pixels from canvas centre. Negative is up, matching the text renderer. */
export function positionYForBand({ band, canvasHeight }: { band: TextBand; canvasHeight: number }): number {
	const fraction = band === "top" ? -0.36 : band === "bottom" ? 0.36 : 0;
	return fraction * canvasHeight;
}
