import React from "react";
import { useAIDirectorStore, type PlanStep } from "../../ai-director/ai-store";
import { Check, X, Loader2, AlertTriangle, MinusCircle } from "lucide-react";

/**
 * The approval gate for a proposed edit plan.
 *
 * This is the safety surface for someone who cannot edit: the plan states, in
 * plain language, everything the Director is about to do, and lets them drop
 * any step BEFORE it touches their video. Nothing here runs until "Apply" is
 * tapped.
 *
 * Each row shows the reason rather than the tool call, because the reason is
 * what a non-editor can actually judge. The tool name is kept as small
 * secondary text so an advanced user can still see the mechanism.
 */
export function PlanCard({ onApprove }: { onApprove: () => void }) {
	const plan = useAIDirectorStore((s) => s.pendingPlan);
	const togglePlanStep = useAIDirectorStore((s) => s.togglePlanStep);
	const setPendingPlan = useAIDirectorStore((s) => s.setPendingPlan);

	if (!plan || plan.status === "discarded") return null;

	const enabledCount = plan.steps.filter((s) => s.enabled).length;
	const isRunning = plan.status === "running";
	const isComplete = plan.status === "complete";

	return (
		<div className="my-2 rounded-xl bg-[#171717] border border-[#00f2fe]/40 overflow-hidden">
			<div className="px-3 py-2.5 border-b border-[#242424]">
				<p className="text-xs font-semibold text-[#00f2fe] mb-1">
					{isComplete ? "Plan applied" : "Proposed edit plan"}
				</p>
				<p className="text-[11px] text-[#bbb] leading-relaxed">{plan.summary}</p>
			</div>

			<ul className="max-h-[220px] overflow-y-auto divide-y divide-[#222]">
				{plan.steps.map((step, i) => (
					<PlanRow
						key={step.id}
						step={step}
						index={i + 1}
						locked={isRunning || isComplete}
						onToggle={() => togglePlanStep(step.id)}
					/>
				))}
			</ul>

			{!isComplete && (
				<div className="flex items-center gap-2 p-2.5 border-t border-[#242424]">
					<button
						type="button"
						onClick={onApprove}
						disabled={isRunning || enabledCount === 0}
						className="flex-1 py-2 rounded-lg bg-[#00f2fe] disabled:opacity-40 text-black text-xs font-semibold flex items-center justify-center gap-1.5"
					>
						{isRunning ? (
							<>
								<Loader2 size={12} className="animate-spin" />
								Applying…
							</>
						) : (
							<>
								<Check size={12} />
								Apply {enabledCount} step{enabledCount === 1 ? "" : "s"}
							</>
						)}
					</button>
					<button
						type="button"
						onClick={() => setPendingPlan(null)}
						disabled={isRunning}
						className="px-3 py-2 rounded-lg bg-[#242424] text-[#999] hover:text-white text-xs font-medium disabled:opacity-40"
					>
						<X size={12} />
					</button>
				</div>
			)}
		</div>
	);
}

function PlanRow({
	step,
	index,
	locked,
	onToggle,
}: {
	step: PlanStep;
	index: number;
	locked: boolean;
	onToggle: () => void;
}) {
	const dimmed = !step.enabled || step.status === "skipped";

	return (
		<li className={`flex items-start gap-2.5 px-3 py-2 ${dimmed ? "opacity-45" : ""}`}>
			<button
				type="button"
				onClick={onToggle}
				disabled={locked}
				aria-label={step.enabled ? "Skip this step" : "Include this step"}
				className={`mt-0.5 w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-colors ${
					step.enabled
						? "bg-[#00f2fe] border-[#00f2fe] text-black"
						: "border-[#444] text-transparent"
				}`}
			>
				<Check size={10} />
			</button>

			<div className="min-w-0 flex-1">
				<p className="text-[11px] text-white leading-relaxed">
					<span className="text-[#666] mr-1">{index}.</span>
					{step.reason || step.tool}
				</p>
				<p className="text-[10px] text-[#666] font-mono mt-0.5">{step.tool}</p>
				{step.status === "failed" && step.result && (
					<p className="text-[10px] text-amber-300 mt-1 flex items-start gap-1">
						<AlertTriangle size={10} className="mt-0.5 shrink-0" />
						{step.result}
					</p>
				)}
			</div>

			<StatusPip status={step.status} />
		</li>
	);
}

function StatusPip({ status }: { status: PlanStep["status"] }) {
	if (status === "running") return <Loader2 size={12} className="mt-0.5 animate-spin text-[#00f2fe]" />;
	if (status === "done") return <Check size={12} className="mt-0.5 text-[#00f2fe]" />;
	if (status === "failed") return <AlertTriangle size={12} className="mt-0.5 text-amber-400" />;
	if (status === "skipped") return <MinusCircle size={12} className="mt-0.5 text-[#555]" />;
	return null;
}
