/**
 * Paul's hard rules as code. The prompt asks for them; these functions
 * refuse the edit when a tool call would break one.
 *
 * Lime `#D8F34A` is the accent. Red `#FF3B30` is only for a warning or a
 * "don't". A portrait canvas is a reel: no music bed. A logo is never
 * drawn. A face is never generated. An object is never named until a
 * frame has been seen.
 */

export const LIME = "#D8F34A";
export const WARNING_RED = "#FF3B30";

const WARNING_WORDS = /\b(don't|do not|never|warning|stop|avoid)\b/i;
const LOGO = /\blogos?\b/i;
const LIKENESS =
	/\b(avatar|likeness|deepfake|face swap|lookalike)\b|\b(generate|draw|create|make)\b[^.]{0,48}\b(face|portrait)\b/i;
const OBJECT_NOUN =
	/\b(cameras?|mics?|microphones?|webcams?|lenses?|screens?|laptops?|monitors?|speakers?|boom arms?|tripods?)\b/i;
const DENIAL = /\b(did not|didn't|could not|couldn't|cannot|can't|unable|without|no music|not add)\b/i;

export function accentColorForText({ content }: { content: string }): string {
	return WARNING_WORDS.test(content) ? WARNING_RED : LIME;
}

/** Taller than wide: 9:16 and 4:5. Square and landscape are not reels. */
export function isPortraitReel({ width, height }: { width: number; height: number }): boolean {
	return height > width && width > 0;
}

export function musicBedRefusal({
	width,
	height,
}: {
	width: number;
	height: number;
}): string | null {
	if (!isPortraitReel({ width, height })) return null;
	return "No music bed on a reel. Voice and sound effects only. Add the trending sound in TikTok or Instagram, not in this file.";
}

export function drawnLogoRefusal({ text }: { text: string }): string | null {
	if (!LOGO.test(text)) return null;
	return "Declined: I did not draw a logo. Use an official logo file or plain text of the name. This app does not generate brand marks.";
}

export function likenessRefusal({ text }: { text: string }): string | null {
	if (!LIKENESS.test(text)) return null;
	return "Declined: I did not create a likeness. This app cannot generate a face. Only Paul's own footage of himself is allowed, and it has to be labelled as AI.";
}

export function namesAnObject({ text }: { text: string }): boolean {
	return OBJECT_NOUN.test(text);
}

export function objectLabelRefusal({ text, looked }: { text: string; looked: boolean }): string | null {
	if (looked || !namesAnObject({ text })) return null;
	return "Declined: I did not label that. I have to look at a captured frame before naming an object. Call render_frame. If the frame still does not show what it is, label nothing and say so.";
}

function toolText({ name, input }: { name: string; input: Record<string, unknown> }): string {
	if (name === "add_text") return typeof input.content === "string" ? input.content : "";
	if (name === "add_broll") return typeof input.query === "string" ? input.query : "";
	if (name === "add_voiceover") return typeof input.text === "string" ? input.text : "";
	if (name === "apply_motion_template") {
		try {
			return JSON.stringify(input.values ?? {});
		} catch {
			return "";
		}
	}
	return "";
}

/** A refusal the executor returns instead of running the tool. Null means proceed. */
export function playbookToolRefusal({
	name,
	input,
	looked,
}: {
	name: string;
	input: Record<string, unknown>;
	looked: boolean;
}): string | null {
	const text = toolText({ name, input });
	if (!text.trim()) return null;
	const logo = drawnLogoRefusal({ text });
	if (logo) return logo;
	const likeness = likenessRefusal({ text });
	if (likeness) return likeness;
	if (name === "add_text" || name === "apply_motion_template") {
		return objectLabelRefusal({ text, looked });
	}
	return null;
}

const CLAIMS: ReadonlyArray<{ label: string; sentence: RegExp; proof: RegExp }> = [
	{
		label: "an export",
		sentence: /\b(exported|export is ready|saved the (mp4|file|video))\b/i,
		proof: /^Exported /,
	},
	{
		label: "captions",
		sentence: /\b(added captions|generated captions|captioned)\b/i,
		proof: /^Generated \d+ caption/,
	},
	{ label: "a trim", sentence: /\btrimmed\b/i, proof: /^Trimmed/ },
	{
		label: "text",
		sentence: /\badded (the )?(title|text|overlay)\b/i,
		proof: /^Added text overlay/,
	},
	{
		label: "a music bed",
		sentence: /\b(added|placed|mixed|included) (a |the )?(music bed|music|song)\b/i,
		proof: /^NEVER_A_MUSIC_BED$/,
	},
];

function sentenceClaims({ reply, pattern }: { reply: string; pattern: RegExp }): boolean {
	const sentences = reply.split(/(?<=[.!?])\s+/);
	const chunks = sentences.length > 0 ? sentences : [reply];
	return chunks.some((sentence) => pattern.test(sentence) && !DENIAL.test(sentence));
}

/**
 * Replaces a closing line that claims an edit the tool results do not show.
 * The tool lines are what happened.
 */
export function honestDirectorClose({
	reply,
	toolResults,
}: {
	reply: string;
	toolResults: string[];
}): string {
	const missed = CLAIMS.filter(
		(claim) =>
			sentenceClaims({ reply, pattern: claim.sentence }) &&
			!toolResults.some((line) => claim.proof.test(line)),
	);
	if (missed.length === 0) return reply;
	const done = toolResults.filter((line) => line.trim().length > 0);
	const list = done.length > 0 ? done.map((line) => `- ${line}`).join("\n") : "- No edit ran.";
	return `I did not do ${missed.map((item) => item.label).join(" or ")}. Here is what actually happened:\n${list}`;
}
