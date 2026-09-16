import { describe, it, expect, beforeEach } from "bun:test";
import {
	computePacingStats,
	formatTranscriptLines,
	buildStyleExtractionPrompt,
	type ReferenceWord,
} from "./reference-analysis";
import { useStyleProfileStore, formatStyleProfile } from "./style-profile-store";

/**
 * The reference-matching path is the app's core creative promise: "edit mine
 * like that one". Its two failure modes are both silent — pacing numbers that
 * are subtly wrong (the model then copies a rhythm the reference never had),
 * and a style profile that saves but does not reach the planner. Both are
 * covered here.
 */

function words(spec: Array<[string, number, number]>): ReferenceWord[] {
	return spec.map(([text, startSeconds, endSeconds]) => ({ text, startSeconds, endSeconds }));
}

describe("pacing stats", () => {
	it("computes words-per-minute from real word timings", () => {
		// 60 words spanning exactly 30s of speech = 120 wpm.
		const w: ReferenceWord[] = [];
		for (let i = 0; i < 60; i++) {
			w.push({ text: `w${i}`, startSeconds: i * 0.5, endSeconds: i * 0.5 + 0.4 });
		}
		const stats = computePacingStats({ words: w, durationSeconds: 30 });
		expect(stats).toContain("60 words");
		expect(stats).toContain("120 wpm average");
	});

	it("reports per-quarter rates so a front-loaded reference is distinguishable", () => {
		// Every word in the first quarter of a 40s video — the average alone
		// would read as slow, which is exactly the wrong direction to copy.
		const w = words(
			Array.from({ length: 20 }, (_, i) => [`w${i}`, i * 0.5, i * 0.5 + 0.4] as [string, number, number]),
		);
		const stats = computePacingStats({ words: w, durationSeconds: 40 });
		const quarters = stats.match(/per-quarter wpm: ([\d\s/]+)/)?.[1].trim().split(" / ");
		expect(quarters).toHaveLength(4);
		expect(Number(quarters![0])).toBeGreaterThan(0);
		expect(Number(quarters![1])).toBe(0);
		expect(Number(quarters![3])).toBe(0);
	});

	it("says plainly when there is no speech rather than reporting 0 wpm", () => {
		const stats = computePacingStats({ words: [], durationSeconds: 30 });
		expect(stats).toContain("No speech detected");
		expect(stats).not.toContain("0 wpm average");
	});

	it("does not divide by zero on a zero-length reference", () => {
		const stats = computePacingStats({ words: words([["a", 0, 1]]), durationSeconds: 0 });
		expect(stats).toContain("No speech detected");
		expect(stats).not.toContain("NaN");
		expect(stats).not.toContain("Infinity");
	});
});

describe("transcript formatting", () => {
	it("groups words into timestamped lines", () => {
		const w = words([
			["Hello", 0, 0.4],
			["there", 0.5, 0.9],
			["friend", 1.0, 1.5],
		]);
		const text = formatTranscriptLines({ words: w, wordsPerLine: 3 });
		expect(text).toBe("[0.0s–1.5s] Hello there friend");
	});

	it("sorts out-of-order words before chunking", () => {
		const w = words([
			["second", 1.0, 1.4],
			["first", 0.0, 0.4],
		]);
		const text = formatTranscriptLines({ words: w, wordsPerLine: 2 });
		expect(text).toContain("first second");
	});

	it("is explicit about silence instead of returning an empty string", () => {
		expect(formatTranscriptLines({ words: [] })).toBe("(no speech detected)");
	});
});

describe("style extraction prompt", () => {
	it("carries the frames, pacing and transcript, and demands a save", () => {
		const prompt = buildStyleExtractionPrompt({
			analysis: {
				frames: [
					{ base64: "x", mediaType: "image/jpeg", timeSeconds: 1.5 },
					{ base64: "y", mediaType: "image/jpeg", timeSeconds: 4.5 },
				],
				transcript: "[0.0s–2.0s] hello",
				pacing: "Speech stats: 4 words",
				durationSeconds: 6,
				name: "ref.mp4",
			},
		});
		expect(prompt).toContain("ref.mp4");
		expect(prompt).toContain("1.5s, 4.5s");
		expect(prompt).toContain("Speech stats");
		expect(prompt).toContain("[0.0s–2.0s] hello");
		// The whole point: an unsaved observation is useless next session.
		expect(prompt).toContain("save_style_profile");
	});
});

describe("style profiles", () => {
	beforeEach(() => {
		useStyleProfileStore.setState({ profiles: [] });
	});

	it("round-trips a saved profile by id", () => {
		const saved = useStyleProfileStore.getState().saveProfile({
			name: "Punchy Reel",
			pacing: "fast, ~180wpm",
			cutRhythm: "every 1.5-2s on sentence ends",
		});
		const found = useStyleProfileStore.getState().getProfile(saved.id);
		expect(found?.name).toBe("Punchy Reel");
		expect(found?.cutRhythm).toBe("every 1.5-2s on sentence ends");
	});

	it("replaces rather than duplicates when saving over an existing id", () => {
		const first = useStyleProfileStore.getState().saveProfile({ name: "A" });
		useStyleProfileStore.getState().saveProfile({ id: first.id, name: "A revised" });
		const all = useStyleProfileStore.getState().profiles;
		expect(all).toHaveLength(1);
		expect(all[0].name).toBe("A revised");
	});

	it("formats only the fields that were actually observed", () => {
		const saved = useStyleProfileStore.getState().saveProfile({
			name: "Sparse",
			pacing: "slow",
			captionStyle: "   ",
		});
		const text = formatStyleProfile(saved);
		expect(text).toContain("Pacing: slow");
		// An empty field must not render as a header with nothing behind it —
		// the model would read that as "no captions", not "not observed".
		expect(text).not.toContain("Caption style:");
		expect(text).not.toContain("Color grade:");
	});

	it("removes a profile by id", () => {
		const saved = useStyleProfileStore.getState().saveProfile({ name: "Temp" });
		useStyleProfileStore.getState().removeProfile(saved.id);
		expect(useStyleProfileStore.getState().getProfile(saved.id)).toBeUndefined();
	});
});
