import { describe, expect, test } from "bun:test";
import { exportUriFromToolText } from "./autotest";

describe("exportUriFromToolText", () => {
	test("keeps the space in Application Support", () => {
		const uri =
			"capacitor://localhost/_capacitor_file_/Users/example/Library/Application Support/kneecap/Exports/out.mp4";
		expect(exportUriFromToolText(`Exported ${uri}.`)).toBe(uri);
	});

	test("stops before the omission sentence", () => {
		const uri = "capacitor://localhost/_capacitor_file_/tmp/out.mp4";
		expect(exportUriFromToolText(`Exported ${uri}. Omissions: a mask.`)).toBe(uri);
	});
});
