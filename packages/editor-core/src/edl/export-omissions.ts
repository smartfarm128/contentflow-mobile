import type { Edl, EdlClip } from "./types";
import { validateEdl } from "./validate";

/**
 * What a native exporter will leave out of the file.
 *
 * `validateEdl` is the structural checker (bad ticks, unknown assets, the
 * aspirational v1 effect list). This is the honesty layer on top of it: the
 * export sheet shows these sentences before export, and both native mappers
 * skip the same items instead of failing the whole file. It does not promise
 * that a later PR will render them — templates, blob media, filters, masks,
 * stickers, shapes and reverse are preview-only until a mapper actually
 * implements them.
 *
 * Platform split that exists today: iOS composites `adjust` and `brightness`,
 * and it rasterizes overlay text (a graphic or sticker that carries
 * `params.content`). Android composites none of those yet, so on Android and
 * on the web fallback every effect is listed.
 */
export type NativeExportPlatform = "ios" | "android" | "web";

export interface NativeExportOmission {
	/** JSON-pointer-ish path, same style as `validateEdl` issues. */
	path: string;
	message: string;
}

const IOS_RENDERED_EFFECTS: ReadonlySet<string> = new Set(["adjust", "brightness"]);

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
}: {
	edl: Edl;
	platform: NativeExportPlatform;
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
	const renderedEffects = platform === "ios" ? IOS_RENDERED_EFFECTS : new Set<string>();

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
			} else if (clip.kind === "graphic" || clip.kind === "sticker") {
				const content = stringParam({ clip, key: "content" });
				const definitionId = stringParam({ clip, key: "definitionId" }) ?? "";
				const iosDrawsIt = platform === "ios" && content !== null;
				if (!iosDrawsIt) {
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
				}
			} else if (clip.kind === "effect") {
				push({
					path,
					message: `Effect clip "${label}" will be left out of the export.`,
				});
			}

			for (const [ei, effect] of clip.effects.entries()) {
				if (!effect.enabled || renderedEffects.has(effect.type)) continue;
				const kindLabel = effect.type === "filter" ? "Filter" : `Effect "${effect.type}"`;
				push({
					path: `${path}.effects[${ei}]`,
					message: `${kindLabel} on "${label}" will be left out of the export.`,
				});
			}

			if (clip.masks.length > 0) {
				push({
					path: `${path}.masks`,
					message: `Mask on "${label}" will be left out of the export.`,
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
