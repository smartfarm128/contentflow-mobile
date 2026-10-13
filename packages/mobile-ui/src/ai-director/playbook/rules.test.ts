import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	LIME,
	WARNING_RED,
	accentColorForText,
	drawnLogoRefusal,
	honestDirectorClose,
	isPortraitReel,
	likenessRefusal,
	musicBedRefusal,
	objectLabelRefusal,
	playbookToolRefusal,
} from "./rules";
import { placeClearOfFaces, rectsOverlap, TEXT_BANDS } from "./face-clearance";
import { playbookPromptForRequest } from "./prompt";

describe("playbook hard rules", () => {
	test("titles default to lime, and a don't is red", () => {
		expect(accentColorForText({ content: "AI for real work" })).toBe(LIME);
		expect(accentColorForText({ content: "Don't push him" })).toBe(WARNING_RED);
	});

	test("a portrait canvas refuses a music bed, and landscape does not", () => {
		expect(isPortraitReel({ width: 1080, height: 1920 })).toBe(true);
		expect(musicBedRefusal({ width: 1080, height: 1920 })).toContain("No music bed");
		expect(musicBedRefusal({ width: 1920, height: 1080 })).toBeNull();
		expect(musicBedRefusal({ width: 1080, height: 1080 })).toBeNull();
	});

	test("a logo request and a generated face are refused", () => {
		expect(drawnLogoRefusal({ text: "Add the OpenAI logo" })).toContain("did not draw a logo");
		expect(drawnLogoRefusal({ text: "ChatGPT" })).toBeNull();
		expect(likenessRefusal({ text: "generate a portrait of a teacher" })).toContain("did not create a likeness");
		expect(likenessRefusal({ text: "show a teacher at a desk" })).toBeNull();
	});

	test("an object label waits until a frame was seen", () => {
		expect(objectLabelRefusal({ text: "the camera on the boom", looked: false })).toContain("did not label");
		expect(objectLabelRefusal({ text: "the camera on the boom", looked: true })).toBeNull();
		expect(objectLabelRefusal({ text: "AI for real work", looked: false })).toBeNull();
	});

	test("add_text of a logo never reaches the timeline", () => {
		const refusal = playbookToolRefusal({
			name: "add_text",
			input: { content: "Draw a logo" },
			looked: true,
		});
		expect(refusal).toContain("Declined");
	});

	test("a claimed export that did not happen is replaced with the tool results", () => {
		const honest = honestDirectorClose({
			reply: "I exported the video and added the title.",
			toolResults: ['Added text overlay "AI for real work" at 0.00s (clip id t1).'],
		});
		expect(honest.startsWith("I did not do an export")).toBe(true);
		expect(honest).toContain("Added text overlay");
		expect(honest).not.toContain("I exported the video and added");
	});

	test("a real tool result is left alone", () => {
		const reply = "Added the title in lime.";
		expect(
			honestDirectorClose({
				reply,
				toolResults: ['Added text overlay "AI for real work" at 0.00s.'],
			}),
		).toBe(reply);
	});

	test("claiming a music bed is never treated as done", () => {
		const honest = honestDirectorClose({
			reply: "I added a music bed under the voice.",
			toolResults: [],
		});
		expect(honest).toContain("I did not do a music bed");
		expect(honest).toContain("No edit ran");
	});
});

describe("face clearance", () => {
	test("a face in the bottom band moves captions to the top", () => {
		const placed = placeClearOfFaces({
			preferred: "bottom",
			faces: [{ x: 0.2, y: 0.72, width: 0.5, height: 0.22 }],
		});
		expect(placed.band).toBe("top");
		expect(placed.moved).toBe(true);
		expect(placed.warning).toBeNull();
		expect(rectsOverlap({ a: TEXT_BANDS.top, b: { x: 0.2, y: 0.72, width: 0.5, height: 0.22 } })).toBe(false);
	});

	test("a face that fills the frame warns instead of pretending it is clear", () => {
		const placed = placeClearOfFaces({
			preferred: "center",
			faces: [{ x: 0, y: 0, width: 1, height: 1 }],
		});
		expect(placed.warning).toContain("Could not keep the text fully off a face");
	});

	test("no overlap leaves the preferred band", () => {
		const placed = placeClearOfFaces({
			preferred: "bottom",
			faces: [{ x: 0.3, y: 0.2, width: 0.3, height: 0.2 }],
		});
		expect(placed.band).toBe("bottom");
		expect(placed.moved).toBe(false);
	});
});

describe("playbook prompt", () => {
	test("every request gets the hard rules, and a reel gets the no-music rule", () => {
		const prompt = playbookPromptForRequest({ request: "edit this tiktok reel" });
		expect(prompt).toContain("Never put text over a face");
		expect(prompt).toContain("No music bed on a reel");
		expect(prompt).toContain("#D8F34A");
		expect(prompt).toContain("microphone");
		expect(prompt).not.toContain("## Scripts");
	});

	test("a script request includes the checklist and skips the reel default", () => {
		const prompt = playbookPromptForRequest({ request: "write a script and a title" });
		expect(prompt).toContain("## Scripts");
		expect(prompt).toContain("## Titles and thumbnails");
		expect(prompt).not.toContain("## Reels and Shorts");
	});

	test("the full playbook file is in the repo and was not rewritten", () => {
		const path = join(import.meta.dir, "../../../../../apps/mobile/src/director/playbook/paul-playbook.md");
		const text = readFileSync(path, "utf8");
		expect(text).toContain("## 2. Hard rules (never break)");
		expect(text).toContain("Identify the object before labelling it");
		expect(text).toContain("#D8F34A");
		expect(text).not.toContain("ADDITION 2026-10-13");
	});
});
