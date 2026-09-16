import React from "react";
import { useAIDirectorStore, type PlanStep } from "../../ai-director/ai-store";
import { Check, X, Loader2, AlertTriangle, MinusCircle, Clapperboard } from "lucide-react";
import { CC_ICON_STROKE } from "../../tokens";

/**
 * The approval gate for a proposed edit plan.
 *
 * CapCut Mobile Pixel-Fidelity: uses `.cc-plan-card` and `.cc-panel-cta`
 * to look like a native CapCut smart assistant card.
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
		<div className="cc-plan-card">
			<div className="cc-plan-card__header">
				<h4 className="cc-plan-card__title">
					{isComplete ? "Plan applied" : "Proposed edit plan"}
				</h4>
				{/* Which reference this edit is copying has to be VISIBLE — the
				    user is approving "edit my video like that one", and cannot
				    judge that without seeing which "that one" means. */}
				{plan.styleProfileName && (
					<div className="cc-plan-card__style">
						<Clapperboard size={11} strokeWidth={CC_ICON_STROKE} />
						<span>Matching style: {plan.styleProfileName}</span>
					</div>
				)}
				<p className="cc-plan-card__summary">{plan.summary}</p>
			</div>

			<ul className="cc-plan-card__list">
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
				<div className="cc-plan-card__footer">
					<button
						type="button"
						onClick={onApprove}
						disabled={isRunning || enabledCount === 0}
						className="cc-panel-cta"
						style={{ margin: 0, flex: 1, minHeight: "38px", padding: "8px 14px", fontSize: "13px" }}
					>
						{isRunning ? (
							<>
								<Loader2 size={13} className="animate-spin" />
								<span>Applying…</span>
							</>
						) : (
							<>
								<Check size={14} strokeWidth={CC_ICON_STROKE} />
								<span>Apply {enabledCount} step{enabledCount === 1 ? "" : "s"}</span>
							</>
						)}
					</button>
					<button
						type="button"
						onClick={() => setPendingPlan(null)}
						disabled={isRunning}
						aria-label="Discard plan"
						style={{
							width: "38px",
							height: "38px",
							borderRadius: "10px",
							background: "rgba(255, 255, 255, 0.08)",
							border: "none",
							color: "var(--cc-text-secondary)",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
						}}
					>
						<X size={15} strokeWidth={CC_ICON_STROKE} />
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
	const disabled = !step.enabled || step.status === "skipped";

	return (
		<li className={`cc-plan-card__item ${disabled ? "cc-plan-card__item--disabled" : ""}`}>
			<button
				type="button"
				onClick={onToggle}
				disabled={locked}
				aria-label={step.enabled ? "Skip this step" : "Include this step"}
				className={`cc-plan-card__check ${step.enabled ? "cc-plan-card__check--active" : ""}`}
			>
				{step.enabled && <Check size={11} strokeWidth={CC_ICON_STROKE} />}
			</button>

			<div className="cc-plan-card__content">
				<p className="cc-plan-card__reason">
					<span style={{ color: "var(--cc-text-secondary)", marginRight: "4px" }}>
						{index}.
					</span>
					{step.reason || step.tool}
				</p>
				<p className="cc-plan-card__tool">{step.tool}</p>
				{step.status === "failed" && step.result && (
					<p
						style={{
							fontSize: "10px",
							color: "#ffaa00",
							marginTop: "2px",
							display: "flex",
							alignItems: "center",
							gap: "4px",
						}}
					>
						<AlertTriangle size={10} />
						<span>{step.result}</span>
					</p>
				)}
			</div>

			<StatusPip status={step.status} />
		</li>
	);
}

function StatusPip({ status }: { status: PlanStep["status"] }) {
	if (status === "running") return <Loader2 size={13} className="animate-spin text-[#00cae0]" />;
	if (status === "done") return <Check size={13} color="var(--cc-accent)" strokeWidth={CC_ICON_STROKE} />;
	if (status === "failed") return <AlertTriangle size={13} color="#ffaa00" />;
	if (status === "skipped") return <MinusCircle size={13} color="var(--cc-text-disabled)" />;
	return null;
}
