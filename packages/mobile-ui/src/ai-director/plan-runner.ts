/**
 * Executes an approved edit plan, step by step, then hands the result back to
 * the Director for a self-review pass.
 *
 * Why a plan at all: this app is for people who cannot edit. Watching a long
 * chain of edits fire unannounced is alarming and unreviewable — you cannot
 * judge "cut 14 silences" after the fact. A plan makes the intent legible
 * BEFORE anything changes, lets the user drop steps they don't want, and keeps
 * one undo story.
 *
 * Steps run through the SAME `executeTool` path a direct tool call uses, so
 * there is exactly one execution engine and approved plans cannot drift from
 * ad-hoc edits.
 */
import { useAIDirectorStore } from "./ai-store";
import { executeTool, type ToolContext } from "./ai-executors";

export interface PlanRunSummary {
	ran: number;
	failed: number;
	skipped: number;
	/** Per-step results, for feeding the review turn. */
	lines: string[];
}

/**
 * Runs every enabled step in order. Failures are recorded and execution
 * CONTINUES: a plan is a list of independent improvements, and aborting the
 * whole thing because one motion template id was wrong would throw away good
 * work. The summary reports honestly what landed and what didn't.
 */
export async function runApprovedPlan({
	ctx,
	onStepDone,
}: {
	ctx: ToolContext;
	/** Fires after each step so the UI can stream progress. */
	onStepDone?: (params: { stepId: string; ok: boolean; result: string }) => void;
}): Promise<PlanRunSummary> {
	const store = useAIDirectorStore.getState();
	const plan = store.pendingPlan;
	if (!plan) return { ran: 0, failed: 0, skipped: 0, lines: [] };

	store.setPlanStatus("running");

	const lines: string[] = [];
	let ran = 0;
	let failed = 0;
	let skipped = 0;

	for (const step of plan.steps) {
		if (!step.enabled) {
			skipped++;
			useAIDirectorStore.getState().updatePlanStep(step.id, { status: "skipped" });
			lines.push(`- ${step.tool}: skipped by the user`);
			continue;
		}

		useAIDirectorStore.getState().updatePlanStep(step.id, { status: "running" });

		let result: string;
		let ok = true;
		try {
			const outcome = await executeTool(step.tool, step.input, ctx);
			result = outcome.text;
			// Executors report recoverable problems as text rather than throwing
			// (a missing clip id, an unavailable device capability), so treat
			// those prefixes as failures too instead of counting them as wins.
			ok = !/^(Error|Could not|Declined)/.test(result);
		} catch (err) {
			ok = false;
			result = err instanceof Error ? err.message : String(err);
		}

		if (ok) ran++;
		else failed++;

		useAIDirectorStore.getState().updatePlanStep(step.id, {
			status: ok ? "done" : "failed",
			result,
		});
		onStepDone?.({ stepId: step.id, ok, result });
		lines.push(`- ${step.tool}: ${result}`);
	}

	useAIDirectorStore.getState().setPlanStatus("complete");
	return { ran, failed, skipped, lines };
}

/**
 * The message handed back to the Director after a plan runs. It deliberately
 * INSTRUCTS a review rather than just reporting success, because the whole
 * point of the loop is that the model looks at what it did before declaring
 * the job done.
 */
export function buildPlanReviewPrompt(summary: PlanRunSummary): string {
	const header =
		`The approved plan has finished: ${summary.ran} step(s) applied, ` +
		`${summary.failed} failed, ${summary.skipped} skipped by the user.`;
	const detail = summary.lines.join("\n");
	const instruction =
		summary.failed > 0
			? "Some steps failed. Call review_composition to look at the result, fix what you can, and tell the user plainly what did not work and why."
			: "Now call review_composition, LOOK at the frames, fix anything wrong (text over a face, unreadable or clipped captions, dead frames, colliding overlays), and only then give the user a short summary.";
	return `${header}\n\n${detail}\n\n${instruction}`;
}
