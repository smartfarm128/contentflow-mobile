import { ChevronDown, Search, X, Lock } from "lucide-react";
import { CC_ICON_STROKE } from "../../tokens";
import { ExportButton } from "../export-button";
import { cn } from "../../lib/cn";

interface TopBarProps {
	onClose?: () => void;
	/** The "AI UHD ▾" resolution pill — in CapCut this is a quick export-
	 *  resolution control, so kneecap wires it to the export sheet (where
	 *  resolution/fps/quality genuinely live). */
	resolutionLabel: string;
	onOpenExportSettings?: () => void;
	onExport?: () => void;
	onOpenVault?: () => void;
	className?: string;
}

/**
 * CapCut-parity top bar, MEASURED from the founder capture
 * (docs/capcut-reference/capture-editor-toolbar-start.png): ✕ close +
 * search on the left, then a spacer, then the dark "AI UHD ▾" resolution
 * pill and the cyan Export pill.
 */
export function TopBar({
	onClose,
	resolutionLabel,
	onOpenExportSettings,
	onExport,
	onOpenVault,
	className,
}: TopBarProps) {
	return (
		<div className={cn("cc-topbar", className)}>
			<button type="button" className="cc-topbar__icon-btn" onClick={onClose} aria-label="Close project">
				<X size={24} strokeWidth={CC_ICON_STROKE} />
			</button>
			<span className="cc-topbar__icon-btn cc-topbar__icon-btn--chrome" aria-hidden="true">
				<Search size={22} strokeWidth={CC_ICON_STROKE} />
			</span>
			<span className="cc-topbar__spacer" />
			{onOpenVault && (
				<button
					type="button"
					className="cc-topbar__icon-btn"
					onClick={onOpenVault}
					aria-label="Key Vault"
					style={{ marginRight: "4px" }}
				>
					<Lock size={18} strokeWidth={CC_ICON_STROKE} />
				</button>
			)}
			<button
				type="button"
				className="cc-topbar__resolution-pill"
				onClick={onOpenExportSettings}
				aria-label="Export settings"
			>
				{resolutionLabel}
				<ChevronDown size={14} strokeWidth={2.5} />
			</button>
			<ExportButton onClick={() => onExport?.()} />
		</div>
	);
}
