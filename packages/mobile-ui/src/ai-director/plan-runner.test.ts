import { describe, it, expect, beforeEach } from "bun:test";
import { useAIDirectorStore, type PlanStep } from "./ai-store";
import { buildPlanReviewPrompt, type PlanRunSummary } from "./plan-runner";

/**
 * The plan is the safety gate for users who cannot edit, so its state machine
 * has to behave predictably: unchecked steps must not run, and the summary fed
 * back to the model must be honest about failures rather than reporting a
 * clean sweep.
 */

function step(over: Partial<PlanStep> = {}): PlanStep {
	return {
		id: over.id ?? "s1",
		tool: over.tool ?? "cut_silence",
		input: over.input ?? {},
		reason: over.reason ?? "Tighten the pacing",
		enabled: over.enabled ?? true,
		status: over.status ?? "pending",
		result: over.result,
	};
}

beforeEach(() => {
	useAIDirectorStore.setState({ pendingPlan: null });
});

describe("plan state", () => {
	it("holds a proposed plan awaiting approval", () => {
		useAIDirectorStore.getState().setPendingPlan({
			id: "p1",
			summary: "Tighten and caption",
			steps: [step({ id: "a" }), step({ id: "b", tool: "generate_captions" })],
			status: "awaiting-approval",
		});
		const plan = useAIDirectorStore.getState().pendingPlan!;
		expect(plan.status).toBe("awaiting-approval");
		expect(plan.steps).toHaveLength(2);
		expect(plan.steps.every((s) => s.enabled)).toBe(true);
	});

	it("lets the user drop a step before anything runs", () => {
		useAIDirectorStore.getState().setPendingPlan({
			id: "p1",
			summary: "x",
			steps: [step({ id: "a" }), step({ id: "b" })],
			status: "awaiting-approval",
		});
		useAIDirectorStore.getState().togglePlanStep("a");
		const plan = useAIDirectorStore.getState().pendingPlan!;
		expect(plan.steps.find((s) => s.id === "a")!.enabled).toBe(false);
		expect(plan.steps.find((s) => s.id === "b")!.enabled).toBe(true);
	});

	it("records per-step outcomes without touching siblings", () => {
		useAIDirectorStore.getState().setPendingPlan({
			id: "p1",
			summary: "x",
			steps: [step({ id: "a" }), step({ id: "b" })],
			status: "running",
		});
		useAIDirectorStore.getState().updatePlanStep("a", { status: "failed", result: "Error: no clip" });
		const plan = useAIDirectorStore.getState().pendingPlan!;
		expect(plan.steps.find((s) => s.id === "a")!.status).toBe("failed");
		expect(plan.steps.find((s) => s.id === "b")!.status).toBe("pending");
	});

	it("discarding clears the gate so no steps can run", () => {
		useAIDirectorStore.getState().setPendingPlan({
			id: "p1",
			summary: "x",
			steps: [step()],
			status: "awaiting-approval",
		});
		useAIDirectorStore.getState().setPendingPlan(null);
		expect(useAIDirectorStore.getState().pendingPlan).toBeNull();
	});
});

describe("review prompt", () => {
	const base: PlanRunSummary = { ran: 3, failed: 0, skipped: 1, lines: ["- cut_silence: ok"] };

	it("always instructs a visual review rather than declaring success", () => {
		const prompt = buildPlanReviewPrompt(base);
		expect(prompt).toContain("review_composition");
		expect(prompt).toContain("3 step(s) applied");
		expect(prompt).toContain("1 skipped");
	});

	it("is explicit about failures instead of glossing over them", () => {
		const prompt = buildPlanReviewPrompt({ ...base, failed: 2 });
		expect(prompt).toContain("2 failed");
		expect(prompt.toLowerCase()).toContain("did not work");
	});
});
