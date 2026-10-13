import type { Edl, EdlClip } from "./types";
import { validateEdl } from "./validate";

/**
 * What a native exporter will leave out of the file.
 *
 * `validateEdl` is the structural checker (bad ticks, unknown assets, the
 * aspirational v1 effect list). This is the honesty layer on top of it: the
 * export sheet shows these sentences before export, and both native mappers
 * skip the same items instead of failing the whole file. It does not promise
 * that a later PR will render them. Motion templates, stickers and shapes
 * are rasterized into the overlay frames both exporters already composite.
 * They are listed only when `uncapturedClipIds` names them (the rasterizer
 * could not capture that clip).
 *
 * Platform split: iOS composites adjust, brightness, filter presets, blur,
 * and ellipse/rectangle/diamond masks. Android composites the color part of
 * adjust, brightness, and filter presets through a Media3 RGB matrix.
 * Sharpen, vignette, blur, masks, and reverse stay listed on Android.
 * The web fallback lists every effect and mask.
 */
export type NativeExportPlatform = "ios" | "android" | "web";

export interface NativeExportOmission {
	/** JSON-pointer-ish path, same style as `validateEdl` issues. */
	path: string;
	message: string;
}

const IOS_RENDERED_EFFECTS: ReadonlySet<string> = new Set([
	"adjust",
	"brightness",
	"filter",
	"blur",
]);

const ANDROID_RENDERED_EFFECTS: ReadonlySet<string> = new Set([
	"adjust",
	"brightness",
	"filter",
]);

/** Mask bodies the iOS compositor draws. Other types stay on the list. */
const IOS_RENDERED_MASKS: ReadonlySet<string> = new Set([
	"ellipse",
	"rectangle",
	"diamond",
]);

const SHAPE_DEFINITION_IDS: ReadonlySet<string> = new Set([
	"rectangle",
	"ellipse",
	"star",
	"polygon",
]);

function stringParam({ clip, key }: { clip: EdlClip; key: string }): string | null {
	const value = clip.params[key];
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function clipLabel({ clip }: { clip: EdlClip }): string {
	const name = clip.name.trim();
	return name.length > 0 ? name : clip.clipId;
}

export function listNativeExportOmissions({
	edl,
	platform,
	uncapturedClipIds,
}: {
	edl: Edl;
	platform: NativeExportPlatform;
	/**
	 * Graphic and sticker clip ids the overlay rasterizer could not paint.
	 * Omit the set and those clips are treated as included. Pass the ids
	 * `renderOverlayFrames` returns when a template or sticker capture failed.
	 */
	uncapturedClipIds?: ReadonlySet<string>;
}): NativeExportOmission[] {
	// Same checker the exporters' contract tests use. Source-uri and mask
	// findings are rephrased as omissions below; other errors (bad ticks,
	// unknown ids) stay real export failures and are not listed here.
	const validation = validateEdl({ edl, options: { strict: true } });
	const _structuralErrors = validation.errors.filter(
		(issue) => !issue.message.includes("sourceUri") && !issue.message.includes("blob:"),
	);
	void _structuralErrors;

	const omissions: NativeExportOmission[] = [];
	const seen = new Set<string>();
	const push = ({ path, message }: NativeExportOmission) => {
		const key = `${path}\0${message}`;
		if (seen.has(key)) return;
		seen.add(key);
		omissions.push({ path, message });
	};

	const assetById = new Map(edl.assets.map((asset) => [asset.assetId, asset]));
	const renderedEffects =
		platform === "ios"
			? IOS_RENDERED_EFFECTS
			: platform === "android"
				? ANDROID_RENDERED_EFFECTS
				: new Set<string>();
	const renderedMasks = platform === "ios" ? IOS_RENDERED_MASKS : new Set<string>();

	for (const [ti, track] of edl.tracks.entries()) {
		if (track.hidden) continue;
		for (const [ci, clip] of track.clips.entries()) {
			if (clip.hidden) continue;
			const path = `tracks[${ti}].clips[${ci}]`;
			const label = clipLabel({ clip });

			if (clip.kind === "video" || clip.kind === "image" || clip.kind === "audio") {
				const asset = clip.assetId ? assetById.get(clip.assetId) : undefined;
				const uri = asset?.sourceUri ?? null;
				const unreadable =
					!clip.assetId ||
					!asset ||
					!uri ||
					uri.startsWith("blob:") ||
					uri.startsWith("data:");
				if (unreadable) {
					push({
						path,
						message:
							`"${label}" will be left out of the export. The file isn't in the app sandbox ` +
							"(it only exists as a temporary in-memory clip).",
					});
				}
			} else if (
				(clip.kind === "graphic" || clip.kind === "sticker") &&
				uncapturedClipIds?.has(clip.clipId)
			) {
				const definitionId = stringParam({ clip, key: "definitionId" }) ?? "";
				const what =
					clip.kind === "sticker"
						? "Sticker"
						: definitionId.startsWith("html:")
							? "Motion template"
							: SHAPE_DEFINITION_IDS.has(definitionId)
								? "Shape"
								: "Motion graphic";
				push({
					path,
					message: `${what} "${label}" will be left out of the export.`,
				});
			} else if (clip.kind === "effect") {
				push({
					path,
					message: `Effect clip "${label}" will be left out of the export.`,
				});
			}

			for (const [ei, effect] of clip.effects.entries()) {
				if (!effect.enabled) continue;
				if (renderedEffects.has(effect.type)) {
					// Android's matrix covers the color sliders. Sharpen and
					// vignette are spatial and have no Media3 effect here.
					if (platform === "android" && effect.type === "adjust") {
						const sharpen = effect.params.sharpen;
						const vignette = effect.params.vignette;
						if (typeof sharpen === "number" && sharpen > 0) {
							push({
								path: `${path}.effects[${ei}].sharpen`,
								message: `Sharpen on "${label}" will be left out of the export.`,
							});
						}
						if (typeof vignette === "number" && vignette > 0) {
							push({
								path: `${path}.effects[${ei}].vignette`,
								message: `Vignette on "${label}" will be left out of the export.`,
							});
						}
					}
					continue;
				}
				const kindLabel = effect.type === "filter" ? "Filter" : `Effect "${effect.type}"`;
				push({
					path: `${path}.effects[${ei}]`,
					message: `${kindLabel} on "${label}" will be left out of the export.`,
				});
			}

			const unsupportedMasks = clip.masks.filter((mask) => !renderedMasks.has(mask.type));
			if (unsupportedMasks.length > 0) {
				push({
					path: `${path}.masks`,
					message: `Mask on "${label}" will be left out of the export.`,
				});
			}
			const stroked = clip.masks.some((mask) => {
				if (!renderedMasks.has(mask.type)) return false;
				const stroke = mask.params.strokeWidth;
				return typeof stroke === "number" && stroke > 0;
			});
			if (stroked) {
				push({
					path: `${path}.masks`,
					message: `Mask stroke on "${label}" will be left out of the export.`,
				});
			}

			if (clip.params.reversed === true) {
				push({
					path: `${path}.params.reversed`,
					message: `Reverse on "${label}" will be left out of the export (the clip plays forward).`,
				});
			}
		}
	}

	return omissions;
}
