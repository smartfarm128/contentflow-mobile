/**
 * One filmstrip frame slot. If the clip carries a real per-frame URI
 * (`clip.thumbnails[slotSec]` — populated once a consumer wires plan M4's
 * native thumbnail-strip generation) it's rendered directly; otherwise this
 * draws a deterministic placeholder swatch (a hue-shifted gradient keyed on
 * the clip's own `colorHue` + the slot's time) so the filmstrip still reads
 * as "many distinct frames" for layout/virtualization/interaction testing
 * without pretending to be real video content. NOT a claim that this is
 * what CapCut's or this app's real filmstrip will look like — see
 * timeline/types.ts's `TimelineClipVM.thumbnails` doc comment.
 */
export function FilmstripThumbnail({
	widthPx,
	realUri,
	colorHue,
	slotSec,
}: {
	widthPx: number;
	realUri?: string;
	colorHue: number;
	slotSec: number;
}) {
	if (realUri) {
		return (
			<div
				className="cc-timeline__clip-thumbnail"
				style={{ width: widthPx, backgroundImage: `url(${realUri})` }}
			/>
		);
	}

	return (
		<div
			className="cc-timeline__clip-thumbnail"
			style={{
				width: widthPx,
				background: "linear-gradient(180deg, #2b2c3a 0%, #171822 100%)",
				borderRight: "1px solid rgba(255, 255, 255, 0.08)",
			}}
			aria-hidden="true"
		/>
	);
}
