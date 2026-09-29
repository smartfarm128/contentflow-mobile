import { describe, expect, it } from "bun:test";
import { filmstripUrisFromCover } from "../editor/use-timeline-project-vm";

/**
 * Pins the native thumbnail-strip derivation (the "one smeared cover across
 * the whole clip" fix): iOS/Android import writes thumb-000..thumb-009 into
 * Thumbnails/<assetId>/ and persists only thumb-000 as the asset's
 * thumbnailUrl. The VM re-derives the sibling frames from that cover path.
 */
describe("filmstripUrisFromCover", () => {
	it("expands a native cover into the full 10-frame strip", () => {
		const uris = filmstripUrisFromCover(
			"capacitor://localhost/_capacitor_file_/x/Thumbnails/ASSET-1/thumb-000.jpg",
		);
		expect(uris).toHaveLength(10);
		expect(uris?.[0]).toEndWith("Thumbnails/ASSET-1/thumb-000.jpg");
		expect(uris?.[9]).toEndWith("Thumbnails/ASSET-1/thumb-009.jpg");
		// Every frame keeps the cover's own directory.
		for (const uri of uris ?? []) {
			expect(uri).toStartWith("capacitor://localhost/_capacitor_file_/x/Thumbnails/ASSET-1/");
		}
	});

	it("returns undefined for non-native covers (blob URLs, images)", () => {
		expect(filmstripUrisFromCover("blob:https://localhost/abc-123")).toBeUndefined();
		expect(filmstripUrisFromCover("/spike-assets/thumb.jpg")).toBeUndefined();
		expect(filmstripUrisFromCover(undefined)).toBeUndefined();
	});
});
