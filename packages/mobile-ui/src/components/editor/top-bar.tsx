import { ChevronDown, ChevronLeft, Search, Lock } from "lucide-react";
import { CC_ICON_STROKE } from "../../tokens";
import { ExportButton } from "../export-button";
import { cn } from "../../lib/cn";

interface TopBarProps {
	onClose?: () => void;
	/** The "1080 ▾" resolution pill from ContentFlow/Expo design — in CapCut/ContentFlow
	 *  this is a quick export-resolution control wired to the export sheet. */
	resolutionLabel: string;
	onOpenExportSettings?: () => void;
	onExport?: () => void;
	onOpenVault?: () => void;
	className?: string;
}

/**
 * ContentFlow editor top bar (Expo parity):
 * Left: Chevron-left back + search
 * Right: Lock (Key Vault) + dark resolution pill (1080 ▾) + orange Export button
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
			<button type="button" className="cc-topbar__icon-btn" onClick={onClose} aria-label="Back to projects">
				<ChevronLeft size={26} strokeWidth={CC_ICON_STROKE} />
			</button>
			<span className="cc-topbar__icon-btn cc-topbar__icon-btn--chrome" aria-hidden="true">
				<Search size={20} strokeWidth={CC_ICON_STROKE} />
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
