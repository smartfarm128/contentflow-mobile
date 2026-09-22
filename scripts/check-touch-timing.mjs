#!/usr/bin/env bun
/**
 * check-touch-timing.mjs — the gate for gestures that only break under REAL
 * finger timing.
 *
 * WHY THIS EXISTS
 *
 * On 2026-09-22 the founder reported "when I cut I can't drag the videos".
 * Every automated check was green, and every prior CDP verification had passed
 * that exact interaction. The reason is a class of bug the whole suite was
 * structurally blind to:
 *
 *   A synthetic driver fires pointerdown -> pointermove within milliseconds.
 *   A finger rests on the glass for 200-600ms before it starts sliding.
 *
 * `timeline-clip.tsx` armed a move-drag AND a 450ms long-press timer on
 * pointerdown, and the timer tore down the move session before asking whether
 * the hold would even be honoured. Any gesture slower than 450ms lost its drag.
 * The synthetic path never waited, so the bug was invisible to CI and obvious
 * within seconds of a human touching the screen.
 *
 * Measured A/B, main track, one clip (drag distance in px):
 *
 *            |  rest 50ms  |  rest 700ms
 *   pre-fix  |    140      |      0      <- the reported bug
 *   post-fix |    140      |    140
 *
 * WHAT THIS GATE ENFORCES
 *
 * Not a timing simulation — a structural rule, so it stays fast and
 * deterministic:
 *
 *   1. A fired long-press timer must not discard move/pan state unless the
 *      hold was actually honoured. (`resolveLongPressOutcome` is the single
 *      place that decides, and it must key off `lifted`.)
 *   2. LONG_PRESS_MS must clear iOS's own 500ms long-press recognizer, so our
 *      timer isn't racing WebKit's for the same gesture.
 *   3. Gesture travel must be measured as true distance, not |dx| alone — an
 *      X-only test leaves a hold armed through a diagonal slide off the clip.
 *
 * The behavioural assertions live in src/__tests__/clip-gesture.test.ts;
 * reverting either fix fails four of those. This script is the cheap
 * structural backstop plus the written reason, so the next person to touch
 * the gesture code learns why the constant is 550 and not 450.
 *
 * STANDING RULE: browser verification does NOT sign off a touch fix. It is
 * necessary and not sufficient. Hardware (or a simulator with real WebKit
 * touch dispatch) is the sign-off.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const gesturePath = join(
	repoRoot,
	"packages/mobile-ui/src/timeline/clip-gesture.ts",
);

const failures = [];

let source;
try {
	source = readFileSync(gesturePath, "utf8");
} catch {
	console.error(
		"check-touch-timing: FAIL — packages/mobile-ui/src/timeline/clip-gesture.ts is missing.\n" +
			"  The long-press/move arbitration rules live there so they can be unit\n" +
			"  tested without a DOM. If they moved, update this gate to follow them.",
	);
	process.exit(1);
}

/**
 * Body of a top-level exported function, from its signature to the closing
 * brace in column 0.
 *
 * A lazy `[\s\S]*?\n}` does NOT work here: these functions take a destructured
 * object parameter, so the first `\n}` in the text is the end of the parameter
 * type, not of the function. Matching that stopped short of the return
 * statement and made every assertion below fail against correct source.
 */
function functionBody({ name }) {
	const match = source.match(
		new RegExp(`export function ${name}\\b[\\s\\S]*?\\n\\}\\n`),
	);
	return match ? match[0] : null;
}

// 1. A declined hold must leave the drag alive.
const outcomeBody = functionBody({ name: "resolveLongPressOutcome" });
if (!outcomeBody) {
	failures.push(
		"resolveLongPressOutcome is gone. It is the single decision point for\n" +
			"  whether a fired long-press may discard an in-flight drag.",
	);
} else {
	if (!/clearMoveSession:\s*lifted/.test(outcomeBody)) {
		failures.push(
			"resolveLongPressOutcome must return `clearMoveSession: lifted`.\n" +
				"  Unconditionally clearing is the exact 2026-09-22 bug: a hold the view\n" +
				"  DECLINED (non-main track, or a main track with one clip) still killed\n" +
				"  the user's drag. Measured effect: a 700ms-rested drag moved 0px.",
		);
	}
	if (!/clearPanSession:\s*lifted/.test(outcomeBody)) {
		failures.push(
			"resolveLongPressOutcome must return `clearPanSession: lifted` for the\n" +
				"  same reason — a declined hold must not kill strip panning either.",
		);
	}
}

// 2. The hold must not race iOS's own recognizer.
const msMatch = source.match(/export const LONG_PRESS_MS\s*=\s*(\d+)/);
if (!msMatch) {
	failures.push("LONG_PRESS_MS is no longer exported from clip-gesture.ts.");
} else if (Number(msMatch[1]) <= 500) {
	failures.push(
		`LONG_PRESS_MS is ${msMatch[1]}ms; it must exceed 500ms.\n` +
			"  iOS's own long-press recognizer fires at 500ms. Sitting under it puts\n" +
			"  our timer in a race with WebKit's for the same gesture.",
	);
}

// 3. Travel must be true distance, not |dx|.
const travelBody = functionBody({ name: "exceedsMoveThreshold" });
if (!travelBody) {
	failures.push("exceedsMoveThreshold is gone from clip-gesture.ts.");
} else if (!/Math\.hypot/.test(travelBody)) {
	failures.push(
		"exceedsMoveThreshold must measure distance with Math.hypot, not |dx|.\n" +
			"  An X-only check reports 'no travel' for a diagonal slide (dx=5, dy=5)\n" +
			"  and leaves the hold armed while the finger leaves the clip.",
	);
}

if (failures.length > 0) {
	console.error("check-touch-timing: FAIL\n");
	for (const failure of failures) {
		console.error(`  - ${failure}\n`);
	}
	console.error(
		"  Background: scripts/check-touch-timing.mjs header, and\n" +
			"  packages/mobile-ui/src/timeline/clip-gesture.ts.",
	);
	process.exit(1);
}

console.log(
	"check-touch-timing: clean — long-press arbitration, hold timing and\n" +
		"travel measurement all hold. (Browser checks still do not sign off a\n" +
		"touch fix; hardware does.)",
);
